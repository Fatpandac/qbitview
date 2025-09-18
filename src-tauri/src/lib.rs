use qbit_rs::Qbit;
use qbit_rs::model::Credential;

#[tauri::command]
async fn login(username: &str, password: &str) -> Result<String, String> {
    let credential = Credential::new(username, password);
    let api = Qbit::new("http://192.168.31.209:8080", credential);
    let login_res = api.login(true).await;
    if let Ok(_) = login_res {
        let version = api.get_version().await.unwrap();
        Ok(format!("qBittrroent Version: {}", version))
    } else {
        let err = login_res.err();
        if let Some(e) = &err {
            Err(e.to_string())
        } else {
            Err("Login failed: Unknown error".to_string())
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![login])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
