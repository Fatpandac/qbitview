use once_cell::sync::Lazy;
use qbit_rs::model::{AddTorrentArg, Credential, GetTorrentListArg, Preferences, TorrentFile, TorrentFilter, TorrentSource};
use qbit_rs::Qbit;
use reqwest::header::{self, HeaderMap, HeaderValue};
use serde::Serialize;
use tauri::async_runtime::Mutex;
use std::sync::Arc;

struct AppClient {
    api: Qbit,
    http: reqwest::Client,
    base_url: String,
}

// global client
static CLIENT: Lazy<Arc<Mutex<Option<AppClient>>>> = Lazy::new(|| Arc::new(Mutex::new(None)));

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
        .no_proxy()
        .danger_accept_invalid_certs(true)
        .danger_accept_invalid_hostnames(true)
        .build()
        .map_err(|e| e.to_string())?;

    let actual_domain = {
        // Use a non-auth endpoint for the probe to avoid triggering qBittorrent's
        // failed-login rate limiter (which bans IPs after repeated failures).
        let probe_url = format!("{}/api/v2/app/webapiVersion", domain);
        match probe_client.get(&probe_url).send().await {
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
        .no_proxy()
        .danger_accept_invalid_certs(true)
        .danger_accept_invalid_hostnames(true)
        .build()
        .map_err(|e| e.to_string())?;

    let credential = Credential::new(username, password);
    let api = Qbit::new_with_client(actual_domain.as_str(), credential, http_client.clone());
    api.login(true).await.map_err(|e| e.to_string())?;

    let mut client = CLIENT.lock().await;
    *client = Some(AppClient { api, http: http_client, base_url: actual_domain });
    Ok("Login successful".to_string())
}

#[tauri::command]
async fn get_version() -> Result<String, String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        c.api.get_version().await.map_err(|e| e.to_string())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn get_torrents(filter: Option<String>) -> Result<serde_json::Value, String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
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
        let torrents = c.api.get_torrent_list(arg).await.map_err(|e| e.to_string())?;
        serde_json::to_value(torrents).map_err(|e| e.to_string())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

// Post hashes to a legacy endpoint (qBittorrent < 5.0 uses pause/resume instead of stop/start)
async fn post_hashes(http: &reqwest::Client, base_url: &str, endpoint: &str, cookie: &str, hashes: Vec<String>) -> Result<(), String> {
    let url = format!("{}/api/v2/{}", base_url, endpoint);
    let body = format!("hashes={}", hashes.join("|"));
    let resp = http
        .post(&url)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .header("Cookie", cookie)
        .body(body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if resp.status().is_success() {
        Ok(())
    } else {
        Err(format!("Request failed: {}", resp.status()))
    }
}

#[tauri::command]
async fn stop_torrents(hashes: Vec<String>) -> Result<(), String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        // Try the v5 endpoint first; fall back to v4 pause on failure
        if c.api.stop_torrents(hashes.clone()).await.is_ok() {
            Ok(())
        } else {
            let cookie = c.api.get_cookie().await.unwrap_or_default();
            post_hashes(&c.http, &c.base_url, "torrents/pause", &cookie, hashes).await
        }
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn start_torrents(hashes: Vec<String>) -> Result<(), String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        // Try the v5 endpoint first; fall back to v4 resume on failure
        if c.api.start_torrents(hashes.clone()).await.is_ok() {
            Ok(())
        } else {
            let cookie = c.api.get_cookie().await.unwrap_or_default();
            post_hashes(&c.http, &c.base_url, "torrents/resume", &cookie, hashes).await
        }
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn delete_torrents(hashes: Vec<String>, delete_files: bool) -> Result<(), String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        let cookie = c.api.get_cookie().await.unwrap_or_default();
        let url = format!("{}/api/v2/torrents/delete", c.base_url);
        let body = format!(
            "hashes={}&deleteFiles={}",
            hashes.join("|"),
            delete_files
        );
        let status = c.http
            .post(&url)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .header("Cookie", cookie)
            .body(body)
            .send()
            .await
            .map_err(|e| e.to_string())?
            .status();
        // 502 can occur when deleting files (Caddy timeout while qBittorrent processes the delete)
        // but the operation typically succeeds on the server side, so treat it as success.
        if status.is_success() || status.as_u16() == 502 {
            Ok(())
        } else {
            Err(format!("Delete failed with status: {}", status))
        }
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
    if let Some(ref c) = *client {
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
        c.api.add_torrent(arg).await.map_err(|e| e.to_string())
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
    if let Some(ref c) = *client {
        let arg = AddTorrentArg {
            source: TorrentSource::TorrentFiles {
                torrents: vec![TorrentFile { filename, data }],
            },
            savepath,
            category,
            paused: paused.map(|p| if p { "true".to_string() } else { "false".to_string() }),
            ..Default::default()
        };
        c.api.add_torrent(arg).await.map_err(|e| e.to_string())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn get_transfer_info() -> Result<TransferInfoResponse, String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        let info = c.api.get_transfer_info().await.map_err(|e| e.to_string())?;
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

#[tauri::command]
async fn get_torrent_properties(hash: String) -> Result<serde_json::Value, String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        let p = c.api.get_torrent_properties(&hash).await.map_err(|e| e.to_string())?;
        Ok(serde_json::json!({
            "save_path": p.save_path,
            "creation_date": p.creation_date,
            "piece_size": p.piece_size,
            "comment": p.comment,
            "total_wasted": p.total_wasted,
            "total_uploaded": p.total_uploaded,
            "total_uploaded_session": p.total_uploaded_session,
            "total_downloaded": p.total_downloaded,
            "total_downloaded_session": p.total_downloaded_session,
            "up_limit": p.up_limit,
            "dl_limit": p.dl_limit,
            "time_elapsed": p.time_elapsed,
            "seeding_time": p.seeding_time,
            "nb_connections": p.nb_connections,
            "nb_connections_limit": p.nb_connections_limit,
            "share_ratio": p.share_ratio,
            "addition_date": p.addition_date,
            "completion_date": p.completion_date,
            "created_by": p.created_by,
            "dl_speed_avg": p.dl_speed_avg,
            "dl_speed": p.dl_speed,
            "eta": p.eta,
            "last_seen": p.last_seen,
            "peers": p.peers,
            "peers_total": p.peers_total,
            "pieces_have": p.pieces_have,
            "pieces_num": p.pieces_num,
            "reannounce": p.reannounce,
            "seeds": p.seeds,
            "seeds_total": p.seeds_total,
            "total_size": p.total_size,
            "up_speed_avg": p.up_speed_avg,
            "up_speed": p.up_speed,
        }))
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn get_torrent_pieces_states(hash: String) -> Result<Vec<u8>, String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        let states = c.api.get_torrent_pieces_states(&hash).await.map_err(|e| e.to_string())?;
        Ok(states.iter().map(|s| *s as u8).collect())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
fn read_file(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn set_torrent_download_limit(hashes: Vec<String>, limit: u64) -> Result<(), String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        let cookie = c.api.get_cookie().await.unwrap_or_default();
        let url = format!("{}/api/v2/torrents/setDownloadLimit", c.base_url);
        let body = format!("hashes={}&limit={}", hashes.join("|"), limit);
        c.http.post(&url)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .header("Cookie", cookie)
            .body(body)
            .send().await.map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn set_torrent_upload_limit(hashes: Vec<String>, limit: u64) -> Result<(), String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        let cookie = c.api.get_cookie().await.unwrap_or_default();
        let url = format!("{}/api/v2/torrents/setUploadLimit", c.base_url);
        let body = format!("hashes={}&limit={}", hashes.join("|"), limit);
        c.http.post(&url)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .header("Cookie", cookie)
            .body(body)
            .send().await.map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn get_global_speed_limits() -> Result<serde_json::Value, String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        let cookie = c.api.get_cookie().await.unwrap_or_default();
        let dl_url = format!("{}/api/v2/transfer/downloadLimit", c.base_url);
        let up_url = format!("{}/api/v2/transfer/uploadLimit", c.base_url);
        let dl_resp = c.http.get(&dl_url)
            .header("Cookie", &cookie)
            .send().await.map_err(|e| e.to_string())?
            .text().await.map_err(|e| e.to_string())?;
        let up_resp = c.http.get(&up_url)
            .header("Cookie", &cookie)
            .send().await.map_err(|e| e.to_string())?
            .text().await.map_err(|e| e.to_string())?;
        let dl_limit: i64 = dl_resp.trim().parse().unwrap_or(0);
        let up_limit: i64 = up_resp.trim().parse().unwrap_or(0);
        Ok(serde_json::json!({ "dl_limit": dl_limit, "up_limit": up_limit }))
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn recheck_torrents(hashes: Vec<String>) -> Result<(), String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        c.api.recheck_torrents(hashes).await.map_err(|e| e.to_string())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn reannounce_torrents(hashes: Vec<String>) -> Result<(), String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        c.api.reannounce_torrents(hashes).await.map_err(|e| e.to_string())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn get_torrent_trackers(hash: String) -> Result<serde_json::Value, String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        let trackers = c.api.get_torrent_trackers(&hash).await.map_err(|e| e.to_string())?;
        let arr: Vec<serde_json::Value> = trackers.iter().map(|t| serde_json::json!({
            "url": t.url,
            "status": format!("{:?}", t.status),
            "tier": t.tier,
            "num_peers": t.num_peers,
            "num_seeds": t.num_seeds,
            "num_leeches": t.num_leeches,
            "num_downloaded": t.num_downloaded,
            "msg": t.msg,
        })).collect();
        Ok(serde_json::Value::Array(arr))
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn get_torrent_peers(hash: String) -> Result<serde_json::Value, String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        let cookie = c.api.get_cookie().await.unwrap_or_default();
        let url = format!("{}/api/v2/sync/torrentPeers?hash={}&rid=0", c.base_url, hash);
        let text = c.http.get(&url)
            .header("Cookie", cookie)
            .send().await.map_err(|e| e.to_string())?
            .text().await.map_err(|e| e.to_string())?;
        let val: serde_json::Value = serde_json::from_str(&text).unwrap_or(serde_json::json!({"peers": {}}));
        // peers is a map of "ip:port" -> peer object; convert to array
        let peers: Vec<serde_json::Value> = val["peers"]
            .as_object()
            .map(|m| m.values().cloned().collect())
            .unwrap_or_default();
        Ok(serde_json::Value::Array(peers))
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn get_torrent_web_seeds(hash: String) -> Result<Vec<String>, String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        let cookie = c.api.get_cookie().await.unwrap_or_default();
        let url = format!("{}/api/v2/torrents/webseeds?hash={}", c.base_url, hash);
        let text = c.http.get(&url)
            .header("Cookie", cookie)
            .send().await.map_err(|e| e.to_string())?
            .text().await.map_err(|e| e.to_string())?;
        let val: Vec<serde_json::Value> = serde_json::from_str(&text).unwrap_or_default();
        Ok(val.into_iter().filter_map(|v| v["url"].as_str().map(|s| s.to_string())).collect())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn get_torrent_contents(hash: String) -> Result<serde_json::Value, String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        let contents = c.api.get_torrent_contents(&hash, None).await.map_err(|e| e.to_string())?;
        serde_json::to_value(contents).map_err(|e| e.to_string())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn get_preferences() -> Result<Preferences, String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        c.api.get_preferences().await.map_err(|e| e.to_string())
    } else {
        Err("Client not initialized. Please login first.".to_string())
    }
}

#[tauri::command]
async fn set_preferences(preferences: Preferences) -> Result<(), String> {
    let client = CLIENT.lock().await;
    if let Some(ref c) = *client {
        c.api.set_preferences(preferences).await.map_err(|e| e.to_string())
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
            get_torrent_properties,
            get_torrent_pieces_states,
            read_file,
            get_torrent_trackers,
            get_torrent_peers,
            get_torrent_web_seeds,
            get_torrent_contents,
            set_torrent_download_limit,
            set_torrent_upload_limit,
            recheck_torrents,
            reannounce_torrents,
            get_global_speed_limits,
            get_preferences,
            set_preferences,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
