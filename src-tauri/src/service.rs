//! Application service: provider CRUD, credential handling and device commands.
//! Plain async methods so everything is testable without a Tauri runtime.

use crate::{
    config::{self, Kind, ProviderConfig},
    providers::{DeviceDto, Providers},
    vault::{Secret, SecretStore},
};
use serde::Serialize;
use std::path::PathBuf;
use tokio::sync::Mutex;

const MAX_SECRET_LEN: usize = 4096;

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ProviderView {
    #[serde(flatten)]
    pub config: ProviderConfig,
    pub has_credentials: bool,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ProviderError {
    pub provider_id: String,
    pub message: String,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Listing {
    pub devices: Vec<DeviceDto>,
    pub errors: Vec<ProviderError>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TestReport {
    pub ok: bool,
    pub message: String,
    pub devices: usize,
}

pub struct Service {
    path: PathBuf,
    vault: Box<dyn SecretStore>,
    providers: Providers,
    // Serializes read-modify-write of providers.json.
    write_lock: Mutex<()>,
}

impl Service {
    pub fn new(path: PathBuf, vault: Box<dyn SecretStore>) -> Self {
        Self { path, vault, providers: Providers::new(), write_lock: Mutex::new(()) }
    }

    fn view(&self, c: ProviderConfig) -> Result<ProviderView, String> {
        let has = self.vault.get(&c.id)?.is_some();
        Ok(ProviderView { config: c, has_credentials: has })
    }

    pub fn list_providers(&self) -> Result<Vec<ProviderView>, String> {
        config::load(&self.path)?.into_iter().map(|c| self.view(c)).collect()
    }

    /// `username`/`secret` of `None` keep what is already in the vault.
    pub async fn save(&self, cfg: ProviderConfig, username: Option<String>, secret: Option<String>) -> Result<ProviderView, String> {
        let cfg = config::validate(cfg)?;
        let _guard = self.write_lock.lock().await;
        let result = self.save_locked(cfg.clone(), username, secret).await;
        // Whatever happened, never keep a client built from the previous credentials.
        self.providers.forget(&cfg.id).await;
        result
    }

    async fn save_locked(&self, cfg: ProviderConfig, username: Option<String>, secret: Option<String>) -> Result<ProviderView, String> {
        let existing = self.vault.get(&cfg.id)?;
        let mut all = config::load(&self.path)?;
        // A stored secret must never follow a changed destination: otherwise anyone able to call
        // this command could point the saved token at a server they control.
        if secret.as_deref().is_none_or(str::is_empty) {
            if let Some(old) = all.iter().find(|p| p.id == cfg.id) {
                if old.kind != cfg.kind || old.base_url != cfg.base_url || old.hosts != cfg.hosts {
                    return Err("o destino mudou: digite a credencial novamente".into());
                }
            }
        }
        let username = username.map(|u| u.trim().to_string()).filter(|u| !u.is_empty());
        let secret = secret.filter(|s| !s.is_empty());
        if secret.as_ref().is_some_and(|s| s.len() > MAX_SECRET_LEN) {
            return Err("credencial longa demais".into());
        }
        let merged = Secret {
            username: username.or_else(|| existing.as_ref().and_then(|e| e.username.clone())),
            secret: secret.or_else(|| existing.map(|e| e.secret)).ok_or("informe a senha/token")?,
        };
        if cfg.kind == Kind::Tapo && merged.username.is_none() {
            return Err("informe o e-mail da conta TP-Link".into());
        }
        self.vault.put(&cfg.id, &merged)?;
        match all.iter_mut().find(|p| p.id == cfg.id) {
            Some(slot) => *slot = cfg.clone(),
            None => all.push(cfg.clone()),
        }
        config::save(&self.path, &all)?;
        self.view(cfg)
    }

    pub async fn remove(&self, id: &str) -> Result<(), String> {
        let _guard = self.write_lock.lock().await;
        let mut all = config::load(&self.path)?;
        all.retain(|p| p.id != id);
        config::save(&self.path, &all)?;
        self.vault.delete(id)?;
        self.providers.forget(id).await;
        Ok(())
    }

    fn find(&self, id: &str) -> Result<(ProviderConfig, Secret), String> {
        let cfg = config::load(&self.path)?.into_iter().find(|p| p.id == id).ok_or("provedor não encontrado")?;
        let secret = self.vault.get(id)?.ok_or("provedor sem credenciais salvas")?;
        Ok((cfg, secret))
    }

    pub async fn test(&self, id: &str) -> Result<TestReport, String> {
        let (cfg, secret) = self.find(id)?;
        match self.providers.list(&cfg, &secret).await {
            Ok(devs) => {
                let online = devs.iter().filter(|d| d.online).count();
                let why = devs.iter().find(|d| !d.online).and_then(|d| d.detail.clone());
                let ok = online > 0 || devs.is_empty();
                let message = match (&why, online == devs.len()) {
                    (_, true) => format!("{online} dispositivo(s) acessíveis"),
                    (Some(w), false) => format!("{online} de {} acessíveis. Problema: {w}", devs.len()),
                    (None, false) => format!("{online} de {} acessíveis", devs.len()),
                };
                Ok(TestReport { ok, message, devices: online })
            }
            Err(e) => Ok(TestReport { ok: false, message: e, devices: 0 }),
        }
    }

    pub async fn devices(&self) -> Result<Listing, String> {
        let mut out = Listing { devices: vec![], errors: vec![] };
        for cfg in config::load(&self.path)? {
            let secret = match self.vault.get(&cfg.id) {
                Ok(Some(s)) => s,
                Ok(None) => {
                    out.errors.push(ProviderError { provider_id: cfg.id, message: "sem credenciais salvas".into() });
                    continue;
                }
                Err(message) => {
                    out.errors.push(ProviderError { provider_id: cfg.id, message });
                    continue;
                }
            };
            match self.providers.list(&cfg, &secret).await {
                Ok(d) => out.devices.extend(d),
                Err(message) => out.errors.push(ProviderError { provider_id: cfg.id, message }),
            }
        }
        Ok(out)
    }

    pub async fn set_power(&self, provider_id: &str, device_id: &str, on: bool) -> Result<DeviceDto, String> {
        let (cfg, secret) = self.find(provider_id)?;
        self.providers.set_power(&cfg, &secret, device_id, on).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::MemoryStore;

    fn svc() -> (Service, PathBuf) {
        let dir = std::env::temp_dir().join(format!("casa-svc-{}-{:?}", std::process::id(), std::thread::current().id()));
        let _ = std::fs::remove_dir_all(&dir);
        let path = dir.join("providers.json");
        (Service::new(path.clone(), Box::new(MemoryStore::default())), dir)
    }

    fn tapo(id: &str) -> ProviderConfig {
        ProviderConfig { id: id.into(), kind: Kind::Tapo, label: "Tapo".into(), hosts: vec!["192.168.1.11".into()], base_url: None, allow_self_signed: false }
    }

    #[tokio::test]
    async fn secrets_go_to_the_vault_never_to_disk_or_the_view() {
        let (s, dir) = svc();
        let v = s.save(tapo("t"), Some("me@x.com".into()), Some("TOPSECRET".into())).await.unwrap();
        assert!(v.has_credentials);
        let json = serde_json::to_string(&s.list_providers().unwrap()).unwrap();
        let file = std::fs::read_to_string(dir.join("providers.json")).unwrap();
        for text in [&json, &file] {
            assert!(!text.contains("TOPSECRET") && !text.contains("me@x.com"), "credential leaked: {text}");
        }
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn editing_without_retyping_keeps_the_stored_secret_but_new_provider_needs_one() {
        let (s, dir) = svc();
        s.save(tapo("t"), Some("a@b.c".into()), Some("pw1".into())).await.unwrap();
        let mut edited = tapo("t");
        edited.label = "Casa nova".into();
        let v = s.save(edited, None, None).await.unwrap();
        assert_eq!(v.config.label, "Casa nova");
        assert_eq!(s.vault.get("t").unwrap().unwrap().secret, "pw1");
        assert!(s.save(tapo("novo"), Some("a@b.c".into()), None).await.is_err());
        assert!(s.save(tapo("outro"), None, Some("pw".into())).await.is_err(), "tapo needs an e-mail");
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn a_stored_secret_cannot_be_redirected_to_a_new_destination() {
        let (s, dir) = svc();
        s.save(tapo("t"), Some("a@b.c".into()), Some("pw1".into())).await.unwrap();
        let mut moved = tapo("t");
        moved.hosts = vec!["192.168.1.99".into()];
        let err = s.save(moved.clone(), None, None).await.unwrap_err();
        assert!(err.contains("destino mudou"), "{err}");
        let mut other_kind = tapo("t");
        other_kind.kind = Kind::HomeAssistant;
        other_kind.base_url = Some("https://attacker.example".into());
        assert!(s.save(other_kind, None, None).await.is_err());
        assert_eq!(s.list_providers().unwrap()[0].config.hosts, ["192.168.1.11"], "config must be unchanged");
        // Retyping the credential is the explicit way to move it.
        assert!(s.save(moved, None, Some("pw1".into())).await.is_ok());
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn remove_wipes_config_and_vault() {
        let (s, dir) = svc();
        s.save(tapo("t"), Some("a@b.c".into()), Some("pw".into())).await.unwrap();
        s.remove("t").await.unwrap();
        assert!(s.list_providers().unwrap().is_empty());
        assert!(s.vault.get("t").unwrap().is_none());
        assert!(s.set_power("t", "192.168.1.11", true).await.is_err());
        let _ = std::fs::remove_dir_all(dir);
    }

    #[tokio::test]
    async fn devices_reports_a_provider_without_credentials_instead_of_failing_all() {
        let (s, dir) = svc();
        let cfg = config::validate(tapo("sem-cred")).unwrap();
        config::save(&s.path, &[cfg]).unwrap();
        let l = s.devices().await.unwrap();
        assert!(l.devices.is_empty() && l.errors.len() == 1);
        let _ = std::fs::remove_dir_all(dir);
    }

    // Live, READ-ONLY check against the providers the app saved on this machine:
    //   CASA_LIVE_PROVIDER=<id> cargo test --lib live_provider -- --ignored --nocapture
    // Credentials come from the OS keychain, so they never touch the shell or the transcript.
    #[tokio::test]
    #[ignore]
    async fn live_provider_read_only() {
        let id = std::env::var("CASA_LIVE_PROVIDER").expect("set CASA_LIVE_PROVIDER");
        let appdata = std::env::var("APPDATA").expect("APPDATA");
        let path = std::path::Path::new(&appdata).join("dev.juninmd.casa").join("providers.json");
        let s = Service::new(path, Box::new(crate::vault::KeyringStore));
        let report = s.test(&id).await.unwrap();
        println!("test: ok={} devices={} msg={}", report.ok, report.devices, report.message);
        for d in s.devices().await.unwrap().devices.iter().filter(|d| d.provider_id == id) {
            println!("{} | {} | {} | on={} online={} | {:?}", d.id, d.name, d.kind, d.on, d.online, d.detail);
        }
        assert!(report.ok, "{}", report.message);
    }
}
