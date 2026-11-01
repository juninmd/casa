//! Credential vault. Secrets live in the OS keychain and are only ever read by Rust code:
//! no command returns them to the webview, which can only write, delete or ask "is it set?".

use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Mutex};

#[derive(Serialize, Deserialize, Clone, PartialEq)]
pub struct Secret {
    pub username: Option<String>,
    pub secret: String,
}

// Never print the secret, even by accident in a log or panic message.
impl std::fmt::Debug for Secret {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("Secret(***)")
    }
}

pub trait SecretStore: Send + Sync {
    fn put(&self, id: &str, secret: &Secret) -> Result<(), String>;
    fn get(&self, id: &str) -> Result<Option<Secret>, String>;
    fn delete(&self, id: &str) -> Result<(), String>;
}

/// OS keychain: Windows Credential Manager, macOS/iOS Keychain, Linux Secret Service.
pub struct KeyringStore;

#[cfg(not(target_os = "android"))]
impl KeyringStore {
    fn entry(id: &str) -> Result<keyring::Entry, String> {
        keyring::Entry::new("dev.juninmd.casa", &format!("provider:{id}"))
            .map_err(|e| format!("cofre indisponível: {e}"))
    }
}

#[cfg(not(target_os = "android"))]
impl SecretStore for KeyringStore {
    fn put(&self, id: &str, secret: &Secret) -> Result<(), String> {
        let json = serde_json::to_string(secret).map_err(|e| e.to_string())?;
        Self::entry(id)?
            .set_password(&json)
            .map_err(|e| format!("não foi possível gravar no cofre: {e}"))
    }

    fn get(&self, id: &str) -> Result<Option<Secret>, String> {
        match Self::entry(id)?.get_password() {
            Ok(json) => serde_json::from_str(&json).map(Some).map_err(|e| e.to_string()),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(format!("não foi possível ler o cofre: {e}")),
        }
    }

    fn delete(&self, id: &str) -> Result<(), String> {
        match Self::entry(id)?.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(e) => Err(format!("não foi possível apagar do cofre: {e}")),
        }
    }
}

// The Android Keystore bridge is not wired yet; refuse instead of silently storing in plaintext.
#[cfg(target_os = "android")]
impl SecretStore for KeyringStore {
    fn put(&self, _: &str, _: &Secret) -> Result<(), String> {
        Err("cofre de credenciais ainda não suportado no Android".into())
    }
    fn get(&self, _: &str) -> Result<Option<Secret>, String> {
        Ok(None)
    }
    fn delete(&self, _: &str) -> Result<(), String> {
        Ok(())
    }
}

/// In-memory store for tests.
#[cfg(test)]
#[derive(Default)]
pub struct MemoryStore(Mutex<HashMap<String, Secret>>);

#[cfg(test)]
impl SecretStore for MemoryStore {
    fn put(&self, id: &str, secret: &Secret) -> Result<(), String> {
        self.0.lock().unwrap().insert(id.into(), secret.clone());
        Ok(())
    }
    fn get(&self, id: &str) -> Result<Option<Secret>, String> {
        Ok(self.0.lock().unwrap().get(id).cloned())
    }
    fn delete(&self, id: &str) -> Result<(), String> {
        self.0.lock().unwrap().remove(id);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn debug_never_leaks_the_secret() {
        let s = Secret { username: Some("a@b.c".into()), secret: "hunter2".into() };
        let shown = format!("{s:?}");
        assert!(!shown.contains("hunter2") && !shown.contains("a@b.c"));
    }

    #[test]
    fn memory_store_roundtrip_and_delete_is_idempotent() {
        let st = MemoryStore::default();
        let s = Secret { username: None, secret: "t".into() };
        st.put("x", &s).unwrap();
        assert_eq!(st.get("x").unwrap(), Some(s));
        st.delete("x").unwrap();
        st.delete("x").unwrap();
        assert_eq!(st.get("x").unwrap(), None);
    }

    // Real keychain round trip: `cargo test -- --ignored vault_`. Cleans up after itself.
    #[test]
    #[ignore]
    fn vault_keyring_roundtrip() {
        let st = KeyringStore;
        let s = Secret { username: Some("u".into()), secret: "s3cret".into() };
        st.put("casa-selftest", &s).unwrap();
        assert_eq!(st.get("casa-selftest").unwrap(), Some(s));
        st.delete("casa-selftest").unwrap();
        assert_eq!(st.get("casa-selftest").unwrap(), None);
    }
}
