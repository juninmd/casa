mod config;
mod net_guard;
mod providers;
mod scan;
mod service;
mod vault;

use config::ProviderConfig;
use providers::DeviceDto;
use scan::Host;
use service::{Listing, ProviderView, Service, TestReport};
use tauri::{Manager, State};

#[tauri::command]
async fn scan_lan(prefix: String) -> Result<Vec<Host>, String> {
    let octets = scan::parse_prefix(&prefix)?;
    Ok(scan::sweep(octets).await)
}

#[tauri::command]
fn providers_list(svc: State<'_, Service>) -> Result<Vec<ProviderView>, String> {
    svc.list_providers()
}

/// Write-only credential channel: the webview can set a secret but never read it back.
#[tauri::command]
async fn provider_save(
    svc: State<'_, Service>,
    config: ProviderConfig,
    username: Option<String>,
    secret: Option<String>,
) -> Result<ProviderView, String> {
    svc.save(config, username, secret).await
}

#[tauri::command]
async fn provider_remove(svc: State<'_, Service>, id: String) -> Result<(), String> {
    svc.remove(&id).await
}

#[tauri::command]
async fn provider_test(svc: State<'_, Service>, id: String) -> Result<TestReport, String> {
    svc.test(&id).await
}

#[tauri::command]
async fn devices_list(svc: State<'_, Service>) -> Result<Listing, String> {
    svc.devices().await
}

#[tauri::command]
async fn device_set_power(
    svc: State<'_, Service>,
    provider_id: String,
    device_id: String,
    on: bool,
) -> Result<DeviceDto, String> {
    svc.set_power(&provider_id, &device_id, on).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let path = app.path().app_data_dir()?.join("providers.json");
            app.manage(Service::new(path, Box::new(vault::KeyringStore)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_lan,
            providers_list,
            provider_save,
            provider_remove,
            provider_test,
            devices_list,
            device_set_power
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
