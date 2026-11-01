//! Test-only fake Tapo device speaking the server side of the AES passthrough protocol.
//! It proves the client's plumbing (cookie, token, cool-down, re-handshake), not that real
//! firmware agrees: that is covered by the ignored live test against a real device.

use super::tapo_crypto::{login_params, AesSession};
use axum::{
    body::Body,
    extract::{Query, State},
    http::{HeaderMap, Response},
    routing::post,
    Router,
};
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use rsa::{pkcs8::DecodePublicKey, rand_core::{OsRng, RngCore}, Pkcs1v15Encrypt, RsaPublicKey};
use serde_json::{json, Value};
use std::{collections::HashMap, sync::{Arc, Mutex}};

struct Sess {
    aes: AesSession,
    token: Option<String>,
}

#[derive(Default)]
struct Inner {
    sessions: HashMap<String, Sess>,
    on: bool,
    handshakes: u32,
    counter: u32,
}

#[derive(Clone)]
pub struct Mock {
    user: String,
    pass: String,
    v2: bool,
    inner: Arc<Mutex<Inner>>,
}

pub struct Snapshot {
    pub on: bool,
    pub handshakes: u32,
}

impl Mock {
    pub fn new(user: &str, pass: &str, v2: bool) -> Self {
        Self { user: user.into(), pass: pass.into(), v2, inner: Arc::default() }
    }
    pub fn state(&self) -> Snapshot {
        let i = self.inner.lock().unwrap();
        Snapshot { on: i.on, handshakes: i.handshakes }
    }
    pub fn expire_sessions(&self) {
        self.inner.lock().unwrap().sessions.clear();
    }
}

fn plain(body: Value, cookie: Option<String>) -> Response<Body> {
    let mut b = Response::builder().header("content-type", "application/json");
    if let Some(c) = cookie {
        b = b.header("set-cookie", format!("{c};TIMEOUT=86400"));
    }
    b.body(Body::from(body.to_string())).unwrap()
}

fn handshake(m: &Mock, params: &Value) -> Response<Body> {
    // Real firmware accepts the single-line body; a strict PEM parser would not, so read the DER.
    let body: String = params["key"]
        .as_str()
        .unwrap_or_default()
        .lines()
        .filter(|l| !l.starts_with("-----"))
        .collect();
    let Some(public) = B64.decode(body).ok().and_then(|der| RsaPublicKey::from_public_key_der(&der).ok()) else {
        return plain(json!({ "error_code": 1003 }), None);
    };
    let mut key_iv = [0u8; 32];
    OsRng.fill_bytes(&mut key_iv);
    let enc = public.encrypt(&mut OsRng, Pkcs1v15Encrypt, &key_iv).unwrap();
    let mut i = m.inner.lock().unwrap();
    i.handshakes += 1;
    i.counter += 1;
    let id = format!("SID{}", i.counter);
    let aes = AesSession::from_parts(key_iv[..16].try_into().unwrap(), key_iv[16..].try_into().unwrap());
    i.sessions.insert(id.clone(), Sess { aes, token: None });
    plain(json!({ "error_code": 0, "result": { "key": B64.encode(enc) } }), Some(format!("TP_SESSIONID={id}")))
}

fn passthrough(m: &Mock, q: &HashMap<String, String>, headers: &HeaderMap, params: &Value) -> Response<Body> {
    let sid = headers
        .get("cookie")
        .and_then(|v| v.to_str().ok())
        .and_then(|c| c.strip_prefix("TP_SESSIONID="))
        .unwrap_or_default()
        .to_string();
    let mut i = m.inner.lock().unwrap();
    let Some(sess) = i.sessions.get_mut(&sid) else {
        return plain(json!({ "error_code": 9999 }), None);
    };
    let aes = sess.aes.clone();
    let req: Value = serde_json::from_str(&aes.decrypt(params["request"].as_str().unwrap_or_default()).unwrap()).unwrap();
    let reply = |v: Value| plain(json!({ "error_code": 0, "result": { "response": aes.encrypt(&v.to_string()) } }), None);

    if req["method"] == "login_device" {
        let want = login_params(&m.user, &m.pass, m.v2);
        if req["params"] == want {
            let token = format!("TOK{sid}");
            sess.token = Some(token.clone());
            return reply(json!({ "error_code": 0, "result": { "token": token } }));
        }
        i.sessions.remove(&sid); // real devices need a fresh handshake after a failed login
        return reply(json!({ "error_code": -1501 }));
    }
    if sess.token.as_deref() != q.get("token").map(String::as_str) || sess.token.is_none() {
        return reply(json!({ "error_code": 9999 }));
    }
    match req["method"].as_str() {
        Some("get_device_info") => reply(json!({ "error_code": 0, "result": {
            "device_id": "dev1", "model": "P110", "type": "SMART.TAPOPLUG",
            "nickname": B64.encode("Tomada da sala"), "device_on": i.on } })),
        Some("set_device_info") => {
            i.on = req["params"]["device_on"].as_bool().unwrap_or(false);
            reply(json!({ "error_code": 0 }))
        }
        _ => reply(json!({ "error_code": -1008 })),
    }
}

async fn app(
    State(m): State<Mock>,
    Query(q): Query<HashMap<String, String>>,
    headers: HeaderMap,
    body: String,
) -> Response<Body> {
    let req: Value = serde_json::from_str(&body).unwrap_or_default();
    match req["method"].as_str() {
        Some("handshake") => handshake(&m, &req["params"]),
        Some("securePassthrough") => passthrough(&m, &q, &headers, &req["params"]),
        _ => plain(json!({ "error_code": 1003 }), None),
    }
}

/// Starts the fake device on a random loopback port; returns `127.0.0.1:port`.
pub async fn spawn(m: Mock) -> String {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap().to_string();
    let router = Router::new().route("/app", post(app)).with_state(m);
    tokio::spawn(async move { axum::serve(listener, router).await.unwrap() });
    addr
}
