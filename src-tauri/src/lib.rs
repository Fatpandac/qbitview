use once_cell::sync::Lazy;
use qbit_rs::model::{AddTorrentArg, Credential, GetTorrentListArg, TorrentFile, TorrentFilter, TorrentSource};
use qbit_rs::Qbit;
use reqwest::header::{self, HeaderMap, HeaderValue};
use serde::Serialize;
use tauri::async_runtime::Mutex;
use std::sync::Arc;

// global client
static CLIENT: Lazy<Arc<Mutex<Option<Qbit>>>> = Lazy::new(|| Arc::new(Mutex::new(None)));

#[derive(Serialize)]
struct TransferInfoResponse {
    dl_info_speed: u64,
    up_info_speed: u64,
    dl_info_data: u64,
    up_info_data: u64,
    dht_nodes: u64,
}

#[tauri::command]
async fn login(username: &str, password: &str, domain: &str) -> Result<String, String> {
    let domain = domain.trim_end_matches('/');

    // Probe for HTTP→HTTPS redirects (Caddy and other reverse proxies redirect HTTP to HTTPS).
    // reqwest strips the Cookie header when following cross-scheme redirects, so we must
    // connect to the final URL directly to avoid losing the session cookie on every API call.
    let probe_client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| e.to_string())?;

    let actual_domain = {
        let probe_url = format!("{}/api/v2/auth/login", domain);
        match probe_client.post(&probe_url).send().await {
            Ok(resp) if resp.status().is_redirection() => {
                resp.headers()
                    .get("location")
                    .and_then(|loc| loc.to_str().ok())
                    .and_then(|loc| url::Url::parse(loc).ok())
                    .map(|url| {
                        let port = url.port().map(|p| format!(":{}", p)).unwrap_or_default();
                        format!("{}://{}{}", url.scheme(), url.host_str().unwrap_or(""), port)
                    })
                    .unwrap_or_else(|| domain.to_string())
            }
            _ => domain.to_string(),
        }
    };

    // Build client with Origin/Referer set to the real domain (satisfies qBittorrent CSRF check)
    let origin = HeaderValue::from_str(&actual_domain).map_err(|e| e.to_string())?;
    let mut default_headers = HeaderMap::new();
    default_headers.insert(header::ORIGIN, origin.clone());
    default_headers.insert(header::REFERER, origin);
    let http_client = reqwest::Client::builder()
        .default_headers(default_headers)
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| e.to_string())?;

    let credential = Credential::new(username, password);
    let api = Qbit::new_with_client(actual_domain.as_str(), credential, http_client);
    api.login(true).await.map_err(|e| e.to_string())?;

    let mut client = CLIENT.lock().await;
    *client = Some(api);
    Ok("Login successful".to_string())
}

#[tauri::command]
async fn get_version() -> Result<String, String> {
    let client = CLIENT.lock().await;
    if let Some(ref api) = *client {
        api.get_version().await.map_err(|e| e.to_string())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn get_torrents(filter: Option<String>) -> Result<serde_json::Value, String> {
    let client = CLIENT.lock().await;
    if let Some(ref api) = *client {
        let torrent_filter = match filter.as_deref() {
            Some("downloading") => Some(TorrentFilter::Downloading),
            Some("completed") => Some(TorrentFilter::Completed),
            Some("paused") => Some(TorrentFilter::Paused),
            Some("active") => Some(TorrentFilter::Active),
            Some("inactive") => Some(TorrentFilter::Inactive),
            Some("stalled") => Some(TorrentFilter::Stalled),
            Some("errored") => Some(TorrentFilter::Errored),
            _ => None,
        };
        let arg = GetTorrentListArg {
            filter: torrent_filter,
            ..Default::default()
        };
        let torrents = api.get_torrent_list(arg).await.map_err(|e| e.to_string())?;
        serde_json::to_value(torrents).map_err(|e| e.to_string())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn stop_torrents(hashes: Vec<String>) -> Result<(), String> {
    let client = CLIENT.lock().await;
    if let Some(ref api) = *client {
        api.stop_torrents(hashes).await.map_err(|e| e.to_string())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn start_torrents(hashes: Vec<String>) -> Result<(), String> {
    let client = CLIENT.lock().await;
    if let Some(ref api) = *client {
        api.start_torrents(hashes).await.map_err(|e| e.to_string())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn delete_torrents(hashes: Vec<String>, delete_files: bool) -> Result<(), String> {
    let client = CLIENT.lock().await;
    if let Some(ref api) = *client {
        api.delete_torrents(hashes, delete_files).await.map_err(|e| e.to_string())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn add_torrent_urls(
    urls: Vec<String>,
    savepath: Option<String>,
    category: Option<String>,
    paused: Option<bool>,
) -> Result<(), String> {
    let client = CLIENT.lock().await;
    if let Some(ref api) = *client {
        let url_list: Result<Vec<url::Url>, _> = urls.iter().map(|u| u.parse()).collect();
        let url_list = url_list.map_err(|e: url::ParseError| e.to_string())?;
        let arg = AddTorrentArg {
            source: TorrentSource::Urls {
                urls: url_list.into(),
            },
            savepath,
            category,
            paused: paused.map(|p| if p { "true".to_string() } else { "false".to_string() }),
            ..Default::default()
        };
        api.add_torrent(arg).await.map_err(|e| e.to_string())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn add_torrent_file(
    filename: String,
    data: Vec<u8>,
    savepath: Option<String>,
    category: Option<String>,
    paused: Option<bool>,
) -> Result<(), String> {
    let client = CLIENT.lock().await;
    if let Some(ref api) = *client {
        let arg = AddTorrentArg {
            source: TorrentSource::TorrentFiles {
                torrents: vec![TorrentFile { filename, data }],
            },
            savepath,
            category,
            paused: paused.map(|p| if p { "true".to_string() } else { "false".to_string() }),
            ..Default::default()
        };
        api.add_torrent(arg).await.map_err(|e| e.to_string())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn get_transfer_info() -> Result<TransferInfoResponse, String> {
    let client = CLIENT.lock().await;
    if let Some(ref api) = *client {
        let info = api.get_transfer_info().await.map_err(|e| e.to_string())?;
        Ok(TransferInfoResponse {
            dl_info_speed: info.dl_info_speed,
            up_info_speed: info.up_info_speed,
            dl_info_data: info.dl_info_data,
            up_info_data: info.up_info_data,
            dht_nodes: info.dht_nodes,
        })
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
            get_version,
            get_torrents,
            stop_torrents,
            start_torrents,
            delete_torrents,
            get_transfer_info,
            add_torrent_urls,
            add_torrent_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
