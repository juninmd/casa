//! Outbound-target validation. The webview supplies hosts and URLs, so every one is checked
//! here before Rust connects: a compromised frontend must not turn the app into an SSRF proxy.

use std::net::{IpAddr, Ipv4Addr};

fn is_lan_ip(ip: Ipv4Addr) -> bool {
    ip.is_private() || ip.is_loopback() || ip.is_link_local()
}

/// A device host: a literal private IPv4 on the LAN. Loopback/link-local are refused (a device
/// is never on this machine, and 169.254.169.254 is a cloud metadata address) and so is any
/// port but 80, so this cannot be used as a local port scanner.
pub fn lan_host(s: &str) -> Result<String, String> {
    let (host, port) = match s.rsplit_once(':') {
        Some((h, p)) => (h, Some(p.parse::<u16>().map_err(|_| format!("porta inválida: {s}"))?)),
        None => (s, None),
    };
    if port.is_some_and(|p| p != 80) {
        return Err("dispositivos Tapo usam a porta 80".into());
    }
    let ip: Ipv4Addr = host.parse().map_err(|_| format!("use um IP da LAN, não '{s}'"))?;
    if !ip.is_private() {
        return Err(format!("{ip} não é um endereço de rede privada"));
    }
    Ok(ip.to_string())
}

/// A Home Assistant base URL. Plain http is only accepted for local targets; https is free
/// (Nabu Casa, reverse proxy). No embedded credentials, query or fragment.
pub fn base_url(s: &str) -> Result<String, String> {
    let url = reqwest::Url::parse(s.trim()).map_err(|_| format!("URL inválida: {s}"))?;
    if !url.username().is_empty() || url.password().is_some() {
        return Err("não coloque usuário/senha na URL".into());
    }
    if url.query().is_some() || url.fragment().is_some() {
        return Err("a URL não pode ter query nem fragmento".into());
    }
    let host = url.host_str().ok_or("URL sem host")?;
    match url.scheme() {
        "https" => {}
        "http" => {
            // host_str() keeps IPv6 in brackets, so strip them before parsing.
            let bare = host.trim_start_matches('[').trim_end_matches(']');
            let local = match bare.parse::<IpAddr>() {
                Ok(IpAddr::V4(ip)) => is_lan_ip(ip),
                Ok(IpAddr::V6(ip)) => ip.is_loopback(),
                Err(_) => host == "localhost" || host.ends_with(".local"),
            };
            if !local {
                return Err("http só é aceito para endereços locais; use https".into());
            }
        }
        other => return Err(format!("esquema não suportado: {other}")),
    }
    Ok(url.as_str().trim_end_matches('/').to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lan_host_accepts_private_and_rejects_public_or_names() {
        assert_eq!(lan_host("192.168.1.11").unwrap(), "192.168.1.11");
        assert_eq!(lan_host("192.168.1.11:80").unwrap(), "192.168.1.11");
        for bad in [
            "8.8.8.8", "example.com", "169.254.169.254", "127.0.0.1", "192.168.1.11:2375",
            "192.168.1", "", "1.1.1.1:80",
        ] {
            assert!(lan_host(bad).is_err(), "{bad} must be rejected");
        }
    }

    #[test]
    fn base_url_enforces_https_for_remote_and_blocks_tricks() {
        assert_eq!(base_url("http://[::1]:8123").unwrap(), "http://[::1]:8123");
        assert_eq!(base_url("http://homeassistant.local:8123/").unwrap(), "http://homeassistant.local:8123");
        assert_eq!(base_url("http://192.168.1.50:8123").unwrap(), "http://192.168.1.50:8123");
        assert_eq!(base_url("https://ha.example.com").unwrap(), "https://ha.example.com");
        for bad in [
            "http://ha.example.com",
            "http://8.8.8.8:8123",
            "http://[2001:db8::1]:8123",
            "http://ai",
            "http://homeassistant",
            "ftp://192.168.1.2",
            "https://user:pw@ha.example.com",
            "https://ha.example.com/?x=1",
            "not a url",
        ] {
            assert!(base_url(bad).is_err(), "{bad} must be rejected");
        }
    }
}
