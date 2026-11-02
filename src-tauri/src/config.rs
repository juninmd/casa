//! Non-secret provider settings, persisted as JSON in the app data dir.
//! Anything sensitive (usernames, passwords, tokens) goes to the vault instead.

use crate::net_guard;
use serde::{Deserialize, Serialize};
use std::{fs, path::Path};

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq)]
pub enum Kind {
    #[serde(rename = "tapo")]
    Tapo,
    #[serde(rename = "homeassistant")]
    HomeAssistant,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ProviderConfig {
    pub id: String,
    pub kind: Kind,
    pub label: String,
    /// Tapo: device IPs on the LAN.
    #[serde(default)]
    pub hosts: Vec<String>,
    /// Home Assistant: instance URL.
    #[serde(default)]
    pub base_url: Option<String>,
    /// Home Assistant over https with a self-signed certificate (explicit opt-in).
    #[serde(default)]
    pub allow_self_signed: bool,
}

#[derive(Serialize, Deserialize, Default)]
struct ConfigFile {
    providers: Vec<ProviderConfig>,
}

/// Validates and normalizes a config coming from the webview.
pub fn validate(mut c: ProviderConfig) -> Result<ProviderConfig, String> {
    let id_ok = !c.id.is_empty()
        && c.id.len() <= 40
        && c.id.chars().all(|ch| ch.is_ascii_lowercase() || ch.is_ascii_digit() || ch == '-');
    if !id_ok {
        return Err("id inválido: use a-z, 0-9 e '-' (até 40)".into());
    }
    c.label = c.label.trim().to_string();
    if c.label.is_empty() || c.label.chars().count() > 60 {
        return Err("o nome deve ter de 1 a 60 caracteres".into());
    }
    match c.kind {
        Kind::Tapo => {
            if c.hosts.is_empty() || c.hosts.len() > 32 {
                return Err("informe de 1 a 32 IPs de dispositivos Tapo".into());
            }
            c.hosts = c.hosts.iter().map(|h| net_guard::lan_host(h.trim())).collect::<Result<_, _>>()?;
            c.hosts.sort();
            c.hosts.dedup();
            c.base_url = None;
            c.allow_self_signed = false;
        }
        Kind::HomeAssistant => {
            c.base_url = Some(net_guard::base_url(c.base_url.as_deref().unwrap_or(""))?);
            c.hosts.clear();
        }
    }
    Ok(c)
}

pub fn load(path: &Path) -> Result<Vec<ProviderConfig>, String> {
    match fs::read_to_string(path) {
        Ok(text) => serde_json::from_str::<ConfigFile>(&text)
            .map(|f| f.providers)
            .map_err(|e| format!("providers.json corrompido: {e}")),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(vec![]),
        Err(e) => Err(e.to_string()),
    }
}

/// Atomic replace so a crash mid-write never leaves a half-written file.
pub fn save(path: &Path, providers: &[ProviderConfig]) -> Result<(), String> {
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    let text = serde_json::to_string_pretty(&ConfigFile { providers: providers.to_vec() })
        .map_err(|e| e.to_string())?;
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, text).map_err(|e| e.to_string())?;
    fs::rename(&tmp, path).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tapo(hosts: &[&str]) -> ProviderConfig {
        ProviderConfig {
            id: "tapo-casa".into(),
            kind: Kind::Tapo,
            label: " Tapo ".into(),
            hosts: hosts.iter().map(|s| s.to_string()).collect(),
            base_url: Some("junk".into()),
            allow_self_signed: true,
        }
    }

    #[test]
    fn tapo_config_is_normalized_and_deduplicated() {
        let c = validate(tapo(&["192.168.1.12", " 192.168.1.11 ", "192.168.1.12"])).unwrap();
        assert_eq!(c.hosts, ["192.168.1.11", "192.168.1.12"]);
        assert_eq!(c.label, "Tapo");
        assert!(c.base_url.is_none() && !c.allow_self_signed);
    }

    #[test]
    fn rejects_public_hosts_bad_ids_and_empty_lists() {
        assert!(validate(tapo(&["8.8.8.8"])).is_err());
        assert!(validate(tapo(&[])).is_err());
        let mut bad = tapo(&["192.168.1.11"]);
        bad.id = "../etc".into();
        assert!(validate(bad).is_err());
    }

    #[test]
    fn file_roundtrip_and_missing_file_is_empty() {
        let dir = std::env::temp_dir().join(format!("casa-cfg-{}", std::process::id()));
        let path = dir.join("providers.json");
        assert!(load(&path).unwrap().is_empty());
        let c = validate(tapo(&["192.168.1.11"])).unwrap();
        save(&path, &[c.clone()]).unwrap();
        assert_eq!(load(&path).unwrap(), vec![c]);
        fs::write(&path, "{ nope").unwrap();
        assert!(load(&path).is_err());
        let _ = fs::remove_dir_all(dir);
    }
}
