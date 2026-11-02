//! Provider layer: turns configured accounts into devices and executes commands.

pub mod homeassistant;
pub mod tapo;
mod tapo_crypto;
#[cfg(test)]
mod tapo_mock;

use crate::{
    config::{Kind, ProviderConfig},
    vault::Secret,
};
use serde::Serialize;

/// What the UI sees. Never carries credentials.
#[derive(Serialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DeviceDto {
    pub id: String,
    pub provider_id: String,
    pub name: String,
    /// Matches the TypeScript `Kind` union.
    pub kind: String,
    pub on: bool,
    pub online: bool,
    pub controllable: bool,
    /// Model, reading with unit, or the reason a device is offline.
    pub detail: Option<String>,
}

pub struct Providers {
    pub tapo: tapo::Pool,
}

impl Providers {
    pub fn new() -> Self {
        Self { tapo: tapo::Pool::new() }
    }

    pub async fn list(&self, cfg: &ProviderConfig, secret: &Secret) -> Result<Vec<DeviceDto>, String> {
        match cfg.kind {
            Kind::Tapo => Ok(self.tapo.list(cfg, secret).await),
            Kind::HomeAssistant => homeassistant::list(cfg, secret).await,
        }
    }

    pub async fn set_power(
        &self,
        cfg: &ProviderConfig,
        secret: &Secret,
        device_id: &str,
        on: bool,
    ) -> Result<DeviceDto, String> {
        match cfg.kind {
            Kind::Tapo => self.tapo.set_power(cfg, secret, device_id, on).await,
            Kind::HomeAssistant => homeassistant::set_power(cfg, secret, device_id, on).await,
        }
    }

    /// Drop cached sessions (credentials changed or provider removed).
    pub async fn forget(&self, provider_id: &str) {
        self.tapo.forget(provider_id).await;
    }
}
