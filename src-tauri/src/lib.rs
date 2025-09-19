use once_cell::sync::Lazy;
use qbit_rs::model::Credential;
use qbit_rs::Qbit;
use tauri::async_runtime::Mutex;
use std::sync::Arc;

// global client
static CLIENT: Lazy<Arc<Mutex<Option<Qbit>>>> = Lazy::new(|| Arc::new(Mutex::new(None)));

#[tauri::command]
async fn login(username: &str, password: &str) -> Result<String, String> {
    let credential = Credential::new(username, password);
    let api = Qbit::new("http://192.168.31.209:8080", credential);
    let login_res = api.login(true).await;
    if let Ok(_) = login_res {
        let mut client = CLIENT.lock().await;
        *client = Some(api.clone());
        Ok("Login successful".to_string())
    } else {
        let err = login_res.err();
        if let Some(e) = &err {
            Err(e.to_string())
        } else {
            Err("Login failed: Unknown error".to_string())
        }
    }
}

#[tauri::command]
async fn get_version() -> Result<String, String> {
    let client = CLIENT.lock().await;
    if let Some(ref api) = *client {
        let version_res = api.get_version().await;
        if let Ok(version) = version_res {
            Ok(version)
        } else {
            let err = version_res.err();
            if let Some(e) = &err {
                Err(e.to_string())
            } else {
                Err("Get version failed: Unknown error".to_string())
            }
        }
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            login,
            get_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
