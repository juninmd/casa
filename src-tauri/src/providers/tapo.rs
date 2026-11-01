//! Tapo plugs/bulbs over the local "AES passthrough" protocol (verified against python-kasa).
//! One cached session per device; at most one retry on expiry; a cool-down after a failed
//! login: a refused password is remembered until the credentials change (the client is dropped
//! by `forget`), so polling can never hammer a device into a lockout.

use super::{
    tapo_crypto::{login_params, AesSession, Keypair},
    DeviceDto,
};
use crate::{config::ProviderConfig, vault::Secret};
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use reqwest::header::{ACCEPT, CONTENT_TYPE, COOKIE, SET_COOKIE};
use serde_json::{json, Value};
use std::{
    collections::HashMap,
    sync::Arc,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tokio::{sync::Mutex, task::JoinSet};

/// Per python-kasa: returned when a request arrives without a valid (re)handshake.
const SESSION_EXPIRED: i64 = 9999;

#[derive(Debug)]
pub enum Fail {
    Device(i64),
    Auth(i64),
    Other(String),
}

impl From<String> for Fail {
    fn from(s: String) -> Self {
        Fail::Other(s)
    }
}
impl From<&str> for Fail {
    fn from(s: &str) -> Self {
        Fail::Other(s.into())
    }
}

impl std::fmt::Display for Fail {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Fail::Device(c) => write!(f, "o dispositivo recusou o comando (código {c})"),
            Fail::Auth(c) => write!(f, "credenciais recusadas (código {c}); atualize e-mail e senha em Provedores"),
            Fail::Other(m) => f.write_str(m),
        }
    }
}

struct Session {
    aes: AesSession,
    cookie: Option<String>,
    token: Option<String>,
}

pub struct Client {
    base: String,
    http: reqwest::Client,
    user: String,
    pass: String,
    keypair: Option<Arc<Keypair>>,
    session: Option<Session>,
    /// Login variant that worked last time (`None` = not learned yet).
    v2: Option<bool>,
    /// Set once a login was refused; no further attempt until the client is rebuilt.
    auth_failed: Option<i64>,
}

fn now_ms() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0)
}

fn session_cookie(headers: &reqwest::header::HeaderMap) -> Option<String> {
    headers.get_all(SET_COOKIE).iter().filter_map(|v| v.to_str().ok()).find_map(|v| {
        let pair = v.split(';').next()?.trim();
        let (name, val) = pair.split_once('=')?;
        matches!(name, "TP_SESSIONID" | "SESSIONID").then(|| format!("TP_SESSIONID={val}"))
    })
}

impl Client {
    pub fn new(base: String, http: reqwest::Client, secret: &Secret) -> Self {
        Self {
            base,
            http,
            user: secret.username.clone().unwrap_or_default(),
            pass: secret.secret.clone(),
            keypair: None,
            session: None,
            v2: None,
            auth_failed: None,
        }
    }

    async fn post(&self, url: &str, body: &Value, cookie: Option<&str>) -> Result<(Value, Option<String>), Fail> {
        let mut req = self
            .http
            .post(url)
            .header(CONTENT_TYPE, "application/json")
            .header(ACCEPT, "application/json")
            .header("requestByApp", "true")
            .body(body.to_string());
        if let Some(c) = cookie {
            req = req.header(COOKIE, c);
        }
        let resp = req.send().await.map_err(|e| format!("sem resposta do dispositivo: {}", e.without_url()))?;
        if !resp.status().is_success() {
            return Err(Fail::Other(format!("HTTP {} do dispositivo", resp.status().as_u16())));
        }
        let cookie = session_cookie(resp.headers());
        let json: Value = resp.json().await.map_err(|_| "resposta do dispositivo não é JSON")?;
        match json["error_code"].as_i64().unwrap_or(0) {
            0 => Ok((json, cookie)),
            c => Err(Fail::Device(c)),
        }
    }

    async fn keypair(&mut self) -> Result<Arc<Keypair>, Fail> {
        if let Some(k) = &self.keypair {
            return Ok(k.clone());
        }
        // RSA keygen is CPU-bound: keep it off the async workers, and do it once per client.
        let k = tokio::task::spawn_blocking(Keypair::generate).await.map_err(|e| e.to_string())??;
        let k = Arc::new(k);
        self.keypair = Some(k.clone());
        Ok(k)
    }

    async fn handshake(&mut self) -> Result<Session, Fail> {
        let kp = self.keypair().await?;
        let body = json!({ "method": "handshake", "params": { "key": kp.public_pem()? } });
        let (resp, cookie) = self.post(&format!("{}/app", self.base), &body, None).await?;
        let key = resp["result"]["key"].as_str().ok_or("handshake sem chave")?;
        Ok(Session { aes: kp.open_session(key)?, cookie, token: None })
    }

    /// One encrypted round trip; returns the decrypted inner JSON (error_code already checked).
    async fn secure(&self, s: &Session, inner: &Value) -> Result<Value, Fail> {
        let outer = json!({ "method": "securePassthrough", "params": { "request": s.aes.encrypt(&inner.to_string()) } });
        let url = match &s.token {
            Some(t) => format!("{}/app?token={t}", self.base),
            None => format!("{}/app", self.base),
        };
        let (resp, _) = self.post(&url, &outer, s.cookie.as_deref()).await?;
        let enc = resp["result"]["response"].as_str().ok_or("resposta sem payload cifrado")?;
        let plain: Value = serde_json::from_str(&s.aes.decrypt(enc)?).map_err(|_| "payload decifrado não é JSON")?;
        match plain["error_code"].as_i64().unwrap_or(0) {
            0 => Ok(plain),
            c => Err(Fail::Device(c)),
        }
    }

    async fn establish(&mut self) -> Result<(), Fail> {
        if let Some(code) = self.auth_failed {
            return Err(Fail::Auth(code));
        }
        let variants = self.v2.map_or(vec![true, false], |v| vec![v]);
        let mut last = 0;
        for v2 in variants {
            // A failed login invalidates the handshake, so every attempt starts a new one.
            let mut s = self.handshake().await?;
            let req = json!({ "method": "login_device", "params": login_params(&self.user, &self.pass, v2), "request_time_milis": now_ms() });
            match self.secure(&s, &req).await {
                Ok(resp) => {
                    s.token = Some(resp["result"]["token"].as_str().ok_or("login sem token")?.to_string());
                    self.v2 = Some(v2);
                    self.session = Some(s);
                    return Ok(());
                }
                Err(Fail::Device(c)) => last = c,
                Err(e) => return Err(e),
            }
        }
        self.auth_failed = Some(last);
        Err(Fail::Auth(last))
    }

    pub async fn call(&mut self, method: &str, params: Option<Value>) -> Result<Value, Fail> {
        for attempt in 0..2 {
            if self.session.is_none() {
                self.establish().await?;
            }
            let mut inner = json!({ "method": method, "request_time_milis": now_ms() });
            if let Some(p) = &params {
                inner["params"] = p.clone();
            }
            let session = self.session.as_ref().expect("session established above");
            match self.secure(session, &inner).await {
                Err(Fail::Device(SESSION_EXPIRED)) if attempt == 0 => self.session = None,
                Ok(resp) => return Ok(resp["result"].clone()),
                Err(e) => return Err(e),
            }
        }
        Err(Fail::Other("sessão expirou duas vezes seguidas".into()))
    }

    pub async fn device(&mut self, provider_id: &str, id: &str) -> Result<DeviceDto, Fail> {
        let info = self.call("get_device_info", None).await?;
        Ok(dto_from_info(provider_id, id, &info))
    }
}

/// Nicknames come base64-encoded; fall back to the raw value if they are not.
fn nickname(info: &Value) -> Option<String> {
    let raw = info["nickname"].as_str().filter(|s| !s.is_empty())?;
    B64.decode(raw).ok().and_then(|b| String::from_utf8(b).ok()).or_else(|| Some(raw.to_string()))
}

fn dto_from_info(provider_id: &str, id: &str, info: &Value) -> DeviceDto {
    let model = info["model"].as_str().unwrap_or("Tapo");
    let bulb = info["type"].as_str().is_some_and(|t| t.contains("BULB"));
    DeviceDto {
        id: id.into(),
        provider_id: provider_id.into(),
        name: nickname(info).unwrap_or_else(|| format!("{model} ({id})")),
        kind: if bulb { "light" } else { "switch" }.into(),
        on: info["device_on"].as_bool().unwrap_or(false),
        online: true,
        controllable: true,
        detail: Some(model.to_string()),
    }
}

fn offline(provider_id: &str, id: &str, why: &Fail) -> DeviceDto {
    DeviceDto {
        id: id.into(),
        provider_id: provider_id.into(),
        name: format!("Tapo {id}"),
        kind: "switch".into(),
        on: false,
        online: false,
        controllable: false,
        detail: Some(why.to_string()),
    }
}

fn unconfirmed(provider_id: &str, id: &str, on: bool) -> DeviceDto {
    DeviceDto {
        id: id.into(),
        provider_id: provider_id.into(),
        name: format!("Tapo {id}"),
        kind: "switch".into(),
        on,
        online: true,
        controllable: true,
        detail: Some("estado não confirmado".into()),
    }
}

pub struct Pool {
    http: reqwest::Client,
    clients: Mutex<HashMap<String, Arc<Mutex<Client>>>>,
}

impl Pool {
    pub fn new() -> Self {
        // `no_proxy`: LAN devices must never be reached through a system proxy.
        let http = reqwest::Client::builder()
            .connect_timeout(Duration::from_secs(3))
            .timeout(Duration::from_secs(8))
            .no_proxy()
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("static reqwest config");
        Self { http, clients: Mutex::new(HashMap::new()) }
    }

    async fn client(&self, provider_id: &str, host: &str, secret: &Secret) -> Arc<Mutex<Client>> {
        let mut map = self.clients.lock().await;
        map.entry(format!("{provider_id}@{host}"))
            .or_insert_with(|| Arc::new(Mutex::new(Client::new(format!("http://{host}"), self.http.clone(), secret))))
            .clone()
    }

    pub async fn forget(&self, provider_id: &str) {
        let prefix = format!("{provider_id}@");
        self.clients.lock().await.retain(|k, _| !k.starts_with(&prefix));
    }

    pub async fn list(&self, cfg: &ProviderConfig, secret: &Secret) -> Vec<DeviceDto> {
        let mut set = JoinSet::new();
        for host in &cfg.hosts {
            let client = self.client(&cfg.id, host, secret).await;
            let (pid, host) = (cfg.id.clone(), host.clone());
            set.spawn(async move {
                let mut c = client.lock().await;
                c.device(&pid, &host).await.unwrap_or_else(|e| offline(&pid, &host, &e))
            });
        }
        let mut out = Vec::new();
        while let Some(joined) = set.join_next().await {
            if let Ok(d) = joined {
                out.push(d);
            }
        }
        out.sort_by(|a, b| a.id.cmp(&b.id));
        out
    }

    pub async fn set_power(&self, cfg: &ProviderConfig, secret: &Secret, host: &str, on: bool) -> Result<DeviceDto, String> {
        if !cfg.hosts.iter().any(|h| h == host) {
            return Err("dispositivo não pertence a este provedor".into());
        }
        let client = self.client(&cfg.id, host, secret).await;
        let mut c = client.lock().await;
        c.call("set_device_info", Some(json!({ "device_on": on }))).await.map_err(|e| e.to_string())?;
        // Re-read so the UI shows what the device really did; if that read fails the command
        // still succeeded, so report the requested state flagged as unconfirmed.
        Ok(c.device(&cfg.id, host).await.unwrap_or_else(|_| unconfirmed(&cfg.id, host, on)))
    }
}

#[cfg(test)]
mod tests {
    use super::super::tapo_mock::{spawn, Mock};
    use super::*;

    fn secret(u: &str, p: &str) -> Secret {
        Secret { username: Some(u.into()), secret: p.into() }
    }
    fn client_for(addr: &str, s: &Secret) -> Client {
        Client::new(format!("http://{addr}"), reqwest::Client::new(), s)
    }

    #[tokio::test]
    async fn reads_and_switches_a_device_end_to_end() {
        let mock = Mock::new("me@x.com", "pw", true);
        let addr = spawn(mock.clone()).await;
        let mut c = client_for(&addr, &secret("me@x.com", "pw"));
        let d = c.device("p", "dev1").await.unwrap();
        assert_eq!((d.name.as_str(), d.on, d.kind.as_str()), ("Tomada da sala", false, "switch"));
        c.call("set_device_info", Some(json!({ "device_on": true }))).await.unwrap();
        assert!(c.device("p", "dev1").await.unwrap().on);
        assert!(mock.state().on);
    }

    #[tokio::test]
    async fn learns_the_v1_login_variant_when_v2_is_refused() {
        let mock = Mock::new("me@x.com", "pw", false);
        let addr = spawn(mock.clone()).await;
        let mut c = client_for(&addr, &secret("me@x.com", "pw"));
        assert!(c.device("p", "d").await.is_ok());
        assert_eq!(c.v2, Some(false));
    }

    #[tokio::test]
    async fn wrong_password_is_refused_once_and_then_never_retried_until_credentials_change() {
        let mock = Mock::new("me@x.com", "pw", true);
        let addr = spawn(mock.clone()).await;
        let mut c = client_for(&addr, &secret("me@x.com", "WRONG"));
        assert!(matches!(c.device("p", "d").await, Err(Fail::Auth(_))));
        let hits = mock.state().handshakes;
        let again = c.device("p", "d").await.unwrap_err().to_string();
        assert!(again.contains("credenciais recusadas"), "{again}");
        assert_eq!(mock.state().handshakes, hits, "a refused password must not contact the device again");
    }

    #[tokio::test]
    async fn recovers_transparently_when_the_session_expires() {
        let mock = Mock::new("me@x.com", "pw", true);
        let addr = spawn(mock.clone()).await;
        let mut c = client_for(&addr, &secret("me@x.com", "pw"));
        c.device("p", "d").await.unwrap();
        mock.expire_sessions();
        assert!(c.device("p", "d").await.is_ok());
        assert_eq!(mock.state().handshakes, 2);
    }

    #[tokio::test]
    async fn unreachable_device_is_listed_offline_instead_of_failing_the_provider() {
        let pool = Pool::new();
        let cfg = ProviderConfig {
            id: "t".into(),
            kind: crate::config::Kind::Tapo,
            label: "t".into(),
            hosts: vec!["127.0.0.1:9".into()],
            base_url: None,
            allow_self_signed: false,
        };
        let devs = pool.list(&cfg, &secret("a", "b")).await;
        assert_eq!(devs.len(), 1);
        assert!(!devs[0].online && !devs[0].controllable);
    }

    #[tokio::test]
    async fn set_power_rejects_hosts_outside_the_provider() {
        let cfg = ProviderConfig {
            id: "t".into(),
            kind: crate::config::Kind::Tapo,
            label: "t".into(),
            hosts: vec!["192.168.1.11".into()],
            base_url: None,
            allow_self_signed: false,
        };
        let r = Pool::new().set_power(&cfg, &secret("a", "b"), "192.168.1.99", true).await;
        assert!(r.unwrap_err().contains("não pertence"));
    }
}
