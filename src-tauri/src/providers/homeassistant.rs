//! Home Assistant over its REST API (Bearer long-lived token).
//! Locks are listed read-only on purpose: an automation rule must not be able to unlock a door.

use super::DeviceDto;
use crate::{config::ProviderConfig, vault::Secret};
use reqwest::StatusCode;
use serde_json::{json, Value};
use std::time::Duration;

const MAX_ENTITIES: usize = 500;
/// Domains that accept `turn_on` / `turn_off` in their own namespace.
const TOGGLE: &[&str] = &["light", "switch", "input_boolean", "fan", "media_player"];

fn http(cfg: &ProviderConfig) -> Result<reqwest::Client, String> {
    let mut b = reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(4))
        .timeout(Duration::from_secs(10))
        .redirect(reqwest::redirect::Policy::none())
        .danger_accept_invalid_certs(cfg.allow_self_signed);
    if cfg.base_url.as_deref().is_some_and(|u| u.starts_with("http://")) {
        b = b.no_proxy(); // local instance: never through a proxy
    }
    b.build().map_err(|e| e.to_string())
}

fn base(cfg: &ProviderConfig) -> Result<&str, String> {
    cfg.base_url.as_deref().ok_or_else(|| "provedor sem URL".to_string())
}

fn explain(status: StatusCode) -> String {
    match status {
        StatusCode::UNAUTHORIZED => "token recusado (401): gere um novo token de longa duração no perfil do Home Assistant".into(),
        StatusCode::NOT_FOUND => "API não encontrada (404): confira a URL e se o componente 'api' está ativo".into(),
        s => format!("Home Assistant respondeu HTTP {}", s.as_u16()),
    }
}

async fn get_json(c: &reqwest::Client, url: &str, token: &str) -> Result<Value, String> {
    let r = c.get(url).bearer_auth(token).send().await.map_err(|e| format!("sem resposta do Home Assistant: {}", e.without_url()))?;
    if !r.status().is_success() {
        return Err(explain(r.status()));
    }
    r.json().await.map_err(|_| "resposta do Home Assistant não é JSON".into())
}

/// Maps one HA state object to a device, or `None` for domains we do not surface.
pub fn to_dto(provider_id: &str, st: &Value) -> Option<DeviceDto> {
    let id = st["entity_id"].as_str()?;
    let (domain, _) = id.split_once('.')?;
    let state = st["state"].as_str().unwrap_or("unknown");
    let attrs = &st["attributes"];
    let name = attrs["friendly_name"].as_str().unwrap_or(id).to_string();
    let unit = attrs["unit_of_measurement"].as_str().unwrap_or("");
    let online = state != "unavailable";
    let dto = |kind: &str, on: bool, controllable: bool, detail: Option<String>| DeviceDto {
        id: id.into(),
        provider_id: provider_id.into(),
        name: name.clone(),
        kind: kind.into(),
        on,
        online,
        controllable: controllable && online,
        detail,
    };
    Some(match domain {
        "light" => dto("light", state == "on", true, None),
        "switch" | "input_boolean" | "fan" => dto("switch", state == "on", true, None),
        "media_player" => dto("media", !matches!(state, "off" | "unavailable" | "unknown"), true, Some(state.into())),
        "lock" => dto("lock", state == "locked", false, Some(state.into())),
        "camera" => dto("camera", state != "unavailable", false, None),
        "sensor" => dto("sensor", true, false, Some(format!("{state} {unit}").trim().to_string())),
        "binary_sensor" => dto("sensor", state == "on", false, Some(state.into())),
        _ => return None,
    })
}

pub async fn list(cfg: &ProviderConfig, secret: &Secret) -> Result<Vec<DeviceDto>, String> {
    let c = http(cfg)?;
    let all = get_json(&c, &format!("{}/api/states", base(cfg)?), &secret.secret).await?;
    let mut out: Vec<DeviceDto> = all
        .as_array()
        .ok_or("resposta inesperada de /api/states")?
        .iter()
        .filter_map(|s| to_dto(&cfg.id, s))
        .collect();
    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    out.truncate(MAX_ENTITIES);
    Ok(out)
}

/// `domain.object_id`, lowercase ascii only: the id ends up inside a URL path.
fn parse_entity(id: &str) -> Result<&str, String> {
    let (domain, object) = id.split_once('.').ok_or("entity_id inválido")?;
    let ok = |s: &str| !s.is_empty() && s.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_');
    if !ok(domain) || !ok(object) {
        return Err("entity_id inválido".into());
    }
    if !TOGGLE.contains(&domain) {
        return Err(format!("o domínio '{domain}' não pode ser ligado/desligado pelo app"));
    }
    Ok(domain)
}

pub async fn set_power(cfg: &ProviderConfig, secret: &Secret, id: &str, on: bool) -> Result<DeviceDto, String> {
    let domain = parse_entity(id)?;
    let c = http(cfg)?;
    let service = if on { "turn_on" } else { "turn_off" };
    let url = format!("{}/api/services/{domain}/{service}", base(cfg)?);
    let r = c
        .post(&url)
        .bearer_auth(&secret.secret)
        .json(&json!({ "entity_id": id }))
        .send()
        .await
        .map_err(|e| format!("sem resposta do Home Assistant: {}", e.without_url()))?;
    if !r.status().is_success() {
        return Err(explain(r.status()));
    }
    // The command went through; if the confirmation read fails, report the requested state.
    let confirmed = get_json(&c, &format!("{}/api/states/{id}", base(cfg)?), &secret.secret).await;
    Ok(confirmed.ok().and_then(|st| to_dto(&cfg.id, &st)).unwrap_or_else(|| DeviceDto {
        id: id.into(),
        provider_id: cfg.id.clone(),
        name: id.into(),
        kind: "switch".into(),
        on,
        online: true,
        controllable: true,
        detail: Some("estado não confirmado".into()),
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::Kind;
    use axum::{extract::Path, http::{HeaderMap, StatusCode as S}, routing::{get, post}, Json, Router};
    use std::sync::{Arc, Mutex};

    fn state(id: &str, st: &str, attrs: Value) -> Value {
        json!({ "entity_id": id, "state": st, "attributes": attrs })
    }

    #[test]
    fn maps_domains_and_keeps_locks_read_only() {
        let light = to_dto("p", &state("light.sala", "on", json!({ "friendly_name": "Sala" }))).unwrap();
        assert_eq!((light.kind.as_str(), light.on, light.controllable), ("light", true, true));
        let lock = to_dto("p", &state("lock.porta", "locked", json!({}))).unwrap();
        assert_eq!((lock.kind.as_str(), lock.on, lock.controllable), ("lock", true, false));
        let temp = to_dto("p", &state("sensor.t", "27.4", json!({ "unit_of_measurement": "°C" }))).unwrap();
        assert_eq!(temp.detail.as_deref(), Some("27.4 °C"));
        let gone = to_dto("p", &state("switch.x", "unavailable", json!({}))).unwrap();
        assert!(!gone.online && !gone.controllable);
        assert!(to_dto("p", &state("automation.a", "on", json!({}))).is_none());
    }

    #[test]
    fn entity_ids_cannot_escape_the_url_path() {
        assert_eq!(parse_entity("light.sala_1"), Ok("light"));
        for bad in ["light", "light.", ".x", "light.a/b", "light.../x", "LIGHT.x", "lock.porta", "cover.garagem", "light.x?y=1"] {
            assert!(parse_entity(bad).is_err(), "{bad} must be rejected");
        }
    }

    async fn fake_ha(token: &'static str) -> (String, Arc<Mutex<Vec<String>>>) {
        let calls = Arc::new(Mutex::new(vec![]));
        let on = Arc::new(Mutex::new(false));
        let authed = move |h: &HeaderMap| h.get("authorization").and_then(|v| v.to_str().ok()) == Some(&format!("Bearer {token}"));
        let (c1, on1) = (calls.clone(), on.clone());
        let (c2, on2, on3) = (calls.clone(), on.clone(), on.clone());
        let app = Router::new()
            .route("/api/states", get(move |h: HeaderMap| async move {
                if !authed(&h) { return Err(S::UNAUTHORIZED); }
                Ok(Json(json!([state("light.sala", if *on1.lock().unwrap() { "on" } else { "off" }, json!({}))])))
            }))
            .route("/api/services/{d}/{s}", post(move |Path((d, s)): Path<(String, String)>, h: HeaderMap, Json(b): Json<Value>| async move {
                if !authed(&h) { return S::UNAUTHORIZED; }
                c2.lock().unwrap().push(format!("{d}/{s} {}", b["entity_id"]));
                *on2.lock().unwrap() = s == "turn_on";
                S::OK
            }))
            .route("/api/states/{id}", get(move |Path(_id): Path<String>| async move {
                Json(state("light.sala", if *on3.lock().unwrap() { "on" } else { "off" }, json!({})))
            }));
        let _ = c1;
        let l = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://{}", l.local_addr().unwrap());
        tokio::spawn(async move { axum::serve(l, app).await.unwrap() });
        (url, calls)
    }

    fn cfg(url: &str) -> ProviderConfig {
        ProviderConfig { id: "ha".into(), kind: Kind::HomeAssistant, label: "HA".into(), hosts: vec![], base_url: Some(url.into()), allow_self_signed: false }
    }

    #[tokio::test]
    async fn lists_and_switches_with_a_valid_token_and_explains_a_bad_one() {
        let (url, calls) = fake_ha("good").await;
        let ok = Secret { username: None, secret: "good".into() };
        assert_eq!(list(&cfg(&url), &ok).await.unwrap().len(), 1);
        let after = set_power(&cfg(&url), &ok, "light.sala", true).await.unwrap();
        assert!(after.on, "state must come from the device after the command");
        assert_eq!(calls.lock().unwrap().as_slice(), ["light/turn_on \"light.sala\""]);
        let bad = Secret { username: None, secret: "nope".into() };
        let err = list(&cfg(&url), &bad).await.unwrap_err();
        assert!(err.contains("401") && !err.contains("nope"), "{err}");
    }
}
