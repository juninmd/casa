//! Read-only LAN discovery: TCP connect probes on common IoT ports + the OS ARP table.
//! A refused connection still proves a host is alive, so closed-port hosts are not missed.

use serde::Serialize;
use std::{collections::BTreeMap, io::ErrorKind, net::SocketAddr, time::Duration};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpStream,
    task::JoinSet,
    time::timeout,
};

const PORTS: &[u16] = &[
    21, 22, 23, 53, 80, 81, 443, 554, 1400, 1883, 1900, 3000, 5000, 6668, 7000, 8000, 8008, 8009,
    8080, 8081, 8123, 8443, 8883, 8888, 9000, 9100, 9999, 10001, 49152, 55443,
];
const CONNECT_TIMEOUT: Duration = Duration::from_millis(400);

#[derive(Serialize, Clone, Debug, PartialEq)]
pub struct Host {
    pub ip: String,
    pub mac: Option<String>,
    pub ports: Vec<u16>,
    /// HTTP `Server` header of port 80, when present (e.g. Tapo plugs answer `SHIP 2.0`).
    pub server: Option<String>,
}

/// Accepts only an RFC1918 `a.b.c` prefix so the webview can never aim the scanner at the internet.
pub fn parse_prefix(s: &str) -> Result<[u8; 3], String> {
    let parts: Vec<u8> = s
        .split('.')
        .map(|p| {
            p.parse::<u8>()
                .map_err(|_| format!("prefixo inválido: {s}"))
        })
        .collect::<Result<_, _>>()?;
    let [a, b, c] =
        <[u8; 3]>::try_from(parts).map_err(|_| format!("use 3 octetos (a.b.c): {s}"))?;
    let private = a == 10 || (a == 172 && (16..=31).contains(&b)) || (a == 192 && b == 168);
    if private {
        Ok([a, b, c])
    } else {
        Err(format!("rede não privada recusada: {s}"))
    }
}

/// Parses `arp -a` output (Windows, Linux, macOS) into ip -> MAC, keeping only `prefix.*`.
pub fn parse_arp(output: &str, prefix: &str) -> BTreeMap<String, String> {
    let mut map = BTreeMap::new();
    for line in output.lines() {
        let Some(ip) = line
            .split(|c: char| !(c.is_ascii_digit() || c == '.'))
            .find(|t| t.starts_with(prefix) && t[prefix.len()..].starts_with('.'))
        else {
            continue;
        };
        let Some(mac) = line.split_whitespace().find_map(as_mac) else {
            continue;
        };
        if mac != "FF-FF-FF-FF-FF-FF" && !mac.starts_with("01-00-5E") {
            map.insert(ip.to_string(), mac);
        }
    }
    map
}

fn as_mac(tok: &str) -> Option<String> {
    let t = tok.trim_matches(|c| c == '(' || c == ')' || c == '[' || c == ']');
    let bytes: Vec<&str> = t.split(['-', ':']).collect();
    if bytes.len() == 6
        && bytes
            .iter()
            .all(|b| b.len() <= 2 && !b.is_empty() && u8::from_str_radix(b, 16).is_ok())
    {
        Some(
            bytes
                .iter()
                .map(|b| format!("{:0>2}", b.to_uppercase()))
                .collect::<Vec<_>>()
                .join("-"),
        )
    } else {
        None
    }
}

/// `Some(true)` open, `Some(false)` refused (host alive, port closed), `None` no answer.
async fn probe(addr: SocketAddr) -> Option<bool> {
    match timeout(CONNECT_TIMEOUT, TcpStream::connect(addr)).await {
        Ok(Ok(_)) => Some(true),
        Ok(Err(e)) if e.kind() == ErrorKind::ConnectionRefused => Some(false),
        _ => None,
    }
}

fn read_arp() -> String {
    let mut cmd = std::process::Command::new("arp");
    cmd.arg("-a");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    }
    // On Android/iOS there is no `arp`: degrade to TCP-only discovery instead of failing.
    cmd.output()
        .map(|o| String::from_utf8_lossy(&o.stdout).into_owned())
        .unwrap_or_default()
}

/// Extracts the `Server:` header from a raw HTTP response head.
pub fn parse_server(head: &str) -> Option<String> {
    head.lines()
        .find_map(|l| {
            l.strip_prefix("Server:")
                .or_else(|| l.strip_prefix("server:"))
        })
        .map(|v| v.trim().chars().take(80).collect::<String>())
        .filter(|v| !v.is_empty())
}

async fn grab_server(addr: SocketAddr) -> Option<String> {
    let io = async {
        let mut sock = TcpStream::connect(addr).await.ok()?;
        const REQ: &[u8] =
            b"GET / HTTP/1.1\r\nHost: casa.local\r\nUser-Agent: casa-scan\r\nConnection: close\r\n\r\n";
        sock.write_all(REQ).await.ok()?;
        let mut buf = [0u8; 1024];
        let n = sock.read(&mut buf).await.ok()?;
        parse_server(&String::from_utf8_lossy(&buf[..n]))
    };
    timeout(Duration::from_millis(800), io).await.ok().flatten()
}

/// One host = one task probing its ports one at a time: bursts of parallel SYNs make small IoT
/// stacks drop connections, so parallelism is across hosts only.
async fn probe_host([a, b, c]: [u8; 3], d: u8) -> Option<(u8, Vec<u16>, Option<String>)> {
    let mut alive = false;
    let mut open = Vec::new();
    for &port in PORTS {
        match probe(SocketAddr::from(([a, b, c, d], port))).await {
            Some(true) => {
                alive = true;
                open.push(port);
            }
            Some(false) => alive = true,
            None => {}
        }
    }
    let server = if open.contains(&80) {
        grab_server(SocketAddr::from(([a, b, c, d], 80))).await
    } else {
        None
    };
    alive.then_some((d, open, server))
}

pub async fn sweep(octets: [u8; 3]) -> Vec<Host> {
    let mut set = JoinSet::new();
    for d in 1..=254u8 {
        set.spawn(probe_host(octets, d));
    }
    let [a, b, c] = octets;
    let mut found: BTreeMap<u8, (Vec<u16>, Option<String>)> = BTreeMap::new();
    while let Some(joined) = set.join_next().await {
        if let Ok(Some((d, ports, server))) = joined {
            found.insert(d, (ports, server));
        }
    }
    let prefix = format!("{a}.{b}.{c}");
    let arp = tokio::task::spawn_blocking(read_arp)
        .await
        .unwrap_or_default();
    let macs = parse_arp(&arp, &prefix);

    let mut hosts: BTreeMap<String, Host> = BTreeMap::new();
    for (d, (mut ports, server)) in found {
        ports.sort_unstable();
        let ip = format!("{prefix}.{d}");
        hosts.insert(
            ip.clone(),
            Host {
                mac: macs.get(&ip).cloned(),
                ip,
                ports,
                server,
            },
        );
    }
    for (ip, mac) in macs {
        hosts.entry(ip.clone()).or_insert(Host {
            ip,
            mac: Some(mac),
            ports: vec![],
            server: None,
        });
    }
    let mut out: Vec<Host> = hosts.into_values().collect();
    out.sort_by_key(|h| {
        h.ip.rsplit('.')
            .next()
            .and_then(|n| n.parse::<u8>().ok())
            .unwrap_or(0)
    });
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_rfc1918_only() {
        assert_eq!(parse_prefix("192.168.1"), Ok([192, 168, 1]));
        assert_eq!(parse_prefix("10.0.5"), Ok([10, 0, 5]));
        assert_eq!(parse_prefix("172.20.1"), Ok([172, 20, 1]));
        for bad in [
            "8.8.8",
            "172.32.0",
            "192.169.1",
            "1.2.3.4",
            "a.b.c",
            "192.168",
            "300.1.1",
        ] {
            assert!(parse_prefix(bad).is_err(), "{bad} must be rejected");
        }
    }

    #[test]
    fn parses_windows_arp() {
        let out = "Interface: 192.168.1.20 --- 0x9\r\n  Internet Address      Physical Address      Type\r\n  192.168.1.1          a8-29-48-00-00-01     dynamic   \r\n  192.168.1.255        ff-ff-ff-ff-ff-ff     static    \r\n  224.0.0.22            01-00-5e-00-00-16     static    \r\n  10.0.0.9              aa-bb-cc-dd-ee-ff     dynamic\r\n";
        let m = parse_arp(out, "192.168.1");
        assert_eq!(m.len(), 1);
        assert_eq!(m["192.168.1.1"], "A8-29-48-00-00-01");
    }

    #[test]
    fn parses_unix_arp_with_short_octets() {
        let out = "? (192.168.1.7) at 3c:64:cf:9:0:7 on en0 ifscope [ethernet]\n? (192.168.1.9) at (incomplete) on en0\n";
        let m = parse_arp(out, "192.168.1");
        assert_eq!(m["192.168.1.7"], "3C-64-CF-09-00-07");
        assert!(!m.contains_key("192.168.1.9"));
    }

    // Live check against a real LAN: CASA_TEST_PREFIX=192.168.1 cargo test -- --ignored --nocapture
    #[tokio::test]
    #[ignore]
    async fn sweep_finds_the_gateway_on_a_real_lan() {
        let prefix = std::env::var("CASA_TEST_PREFIX").expect("set CASA_TEST_PREFIX");
        let hosts = sweep(parse_prefix(&prefix).unwrap()).await;
        for h in &hosts {
            println!("{} {:?} {:?} {:?}", h.ip, h.mac, h.ports, h.server);
        }
        assert!(hosts.len() > 1, "expected more than one host");
        let gw = hosts
            .iter()
            .find(|h| h.ip.ends_with(".1"))
            .expect("gateway .1 missing");
        assert!(
            !gw.ports.is_empty(),
            "gateway should expose at least one open port"
        );
        assert!(
            hosts.iter().filter(|h| !h.ports.is_empty()).count() > 1,
            "IoT hosts lost their ports (SYN burst regression)"
        );
    }

    #[test]
    fn parses_server_header_case_insensitively_on_prefix() {
        assert_eq!(
            parse_server(
                "HTTP/1.1 200 OK
Server: SHIP 2.0

"
            ),
            Some("SHIP 2.0".into())
        );
        assert_eq!(
            parse_server(
                "HTTP/1.0 200
server:  nginx 
"
            ),
            Some("nginx".into())
        );
        assert_eq!(
            parse_server(
                "HTTP/1.0 200
Content-Length: 0
"
            ),
            None
        );
        assert_eq!(parse_server(""), None);
    }

    #[test]
    fn prefix_match_does_not_leak_longer_octets() {
        let out = "  192.168.10.1   aa-bb-cc-dd-ee-ff  dynamic\n";
        assert!(parse_arp(out, "192.168.1").is_empty());
    }
}
