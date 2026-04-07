use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use tokio::fs;

use crate::crc32::generate_shortcut_id;
use crate::vdf::{self, VdfValue};

const STEAMGRIDDB_API_KEY: &str = "f80f92019254471cca9d62ff91c21eee";
const STEAMGRIDDB_API_URL: &str = "https://www.steamgriddb.com/api/v2";

// ============================================================================
// Types
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct GameToAdd {
    pub name: String,
    #[serde(rename = "launchUrl")]
    pub launch_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SteamUser {
    pub id: String,
    pub persona: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SteamConfig {
    #[serde(rename = "steamPath")]
    pub steam_path: String,
    pub users: Vec<SteamUser>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameResult {
    pub name: String,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AddToSteamResult {
    #[serde(rename = "totalGames")]
    pub total_games: usize,
    #[serde(rename = "successCount")]
    pub success_count: usize,
    #[serde(rename = "failCount")]
    pub fail_count: usize,
    pub results: Vec<GameResult>,
}

#[derive(Debug, Deserialize)]
struct SteamGridSearchResponse {
    data: Option<Vec<SteamGridSearchResult>>,
}

#[derive(Debug, Deserialize)]
struct SteamGridSearchResult {
    id: u64,
}

#[derive(Debug, Deserialize)]
struct SteamGridImagesResponse {
    data: Option<Vec<SteamGridImage>>,
}

#[derive(Debug, Deserialize)]
struct SteamGridImage {
    url: String,
}

// ============================================================================
// Detect Steam Installation
// ============================================================================

#[tauri::command]
pub async fn detect_steam_config() -> Result<SteamConfig, String> {
    let steam_path = find_steam_path()
        .ok_or_else(|| "Could not find Steam installation".to_string())?;

    let userdata_path = steam_path.join("userdata");
    let mut users = Vec::new();

    if userdata_path.exists() {
        let mut entries = fs::read_dir(&userdata_path)
            .await
            .map_err(|e| format!("Failed to read userdata: {}", e))?;

        while let Some(entry) = entries
            .next_entry()
            .await
            .map_err(|e| format!("Failed to read entry: {}", e))?
        {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }

            let id = match path.file_name().and_then(|n| n.to_str()) {
                Some(name) if name.chars().all(|c| c.is_ascii_digit()) => name.to_string(),
                _ => continue,
            };

            // Try to read persona name from localconfig.vdf (text vdf)
            let persona = read_persona_name(&path).await.unwrap_or_default();
            let display = if persona.is_empty() {
                id.clone()
            } else {
                persona
            };

            users.push(SteamUser {
                id,
                persona: display,
            });
        }
    }

    Ok(SteamConfig {
        steam_path: steam_path.to_string_lossy().to_string(),
        users,
    })
}

fn find_steam_path() -> Option<PathBuf> {
    let os = std::env::consts::OS;
    let home = dirs::home_dir()?;

    let candidates: Vec<PathBuf> = match os {
        "windows" => vec![
            PathBuf::from(r"C:\Program Files (x86)\Steam"),
            PathBuf::from(r"C:\Program Files\Steam"),
            PathBuf::from(r"D:\Steam"),
        ],
        "linux" => vec![
            home.join(".local/share/Steam"),
            home.join(".steam/steam"),
            home.join(".steam/root"),
            // Steam Deck / Flatpak
            home.join(".var/app/com.valvesoftware.Steam/.local/share/Steam"),
        ],
        "macos" => vec![
            home.join("Library/Application Support/Steam"),
        ],
        _ => vec![],
    };

    candidates.into_iter().find(|p| p.exists())
}

async fn read_persona_name(userdata_dir: &Path) -> Option<String> {
    let localconfig = userdata_dir.join("config").join("localconfig.vdf");
    let content = fs::read_to_string(&localconfig).await.ok()?;

    // Simple text parse: look for "PersonaName" "value"
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.contains("PersonaName") {
            // Format: "PersonaName"		"SomeUser"
            let parts: Vec<&str> = trimmed.split('"').collect();
            if parts.len() >= 4 {
                return Some(parts[3].to_string());
            }
        }
    }
    None
}

// ============================================================================
// Add Games to Steam
// ============================================================================

#[tauri::command]
pub async fn add_games_to_steam(
    games: Vec<GameToAdd>,
    chrome_path: String,
    steam_path: String,
    steam_user_id: String,
) -> Result<AddToSteamResult, String> {
    let os = std::env::consts::OS;
    let steam_base = PathBuf::from(&steam_path);
    let userdata = steam_base.join("userdata").join(&steam_user_id);
    let config_dir = userdata.join("config");
    let grid_dir = config_dir.join("grid");
    let shortcuts_path = config_dir.join("shortcuts.vdf");

    // Ensure directories exist
    fs::create_dir_all(&grid_dir)
        .await
        .map_err(|e| format!("Failed to create grid directory: {}", e))?;

    // Create launchers directory
    let launchers_dir = userdata.join("config").join("xcloud-launchers");
    fs::create_dir_all(&launchers_dir)
        .await
        .map_err(|e| format!("Failed to create launchers directory: {}", e))?;

    // Read existing shortcuts.vdf or create empty
    let mut shortcuts_root = if shortcuts_path.exists() {
        let data = fs::read(&shortcuts_path)
            .await
            .map_err(|e| format!("Failed to read shortcuts.vdf: {}", e))?;
        vdf::parse_shortcuts(&data)
    } else {
        BTreeMap::new()
    };

    // Get or create the "shortcuts" map
    let shortcuts_map = shortcuts_root
        .entry("shortcuts".to_string())
        .or_insert_with(|| VdfValue::Map(BTreeMap::new()));

    let inner_map = match shortcuts_map.as_map_mut() {
        Some(m) => m,
        None => return Err("shortcuts.vdf has invalid format".to_string()),
    };

    // Find next available index
    let mut next_index: u32 = inner_map
        .keys()
        .filter_map(|k| k.parse::<u32>().ok())
        .max()
        .map(|m| m + 1)
        .unwrap_or(0);

    let client = reqwest::Client::new();
    let mut results = Vec::new();
    let mut success_count = 0;

    for game in &games {
        match process_game(
            &client,
            game,
            &chrome_path,
            &launchers_dir,
            &grid_dir,
            inner_map,
            next_index,
            os,
        )
        .await
        {
            Ok(()) => {
                results.push(GameResult {
                    name: game.name.clone(),
                    success: true,
                    error: None,
                });
                success_count += 1;
                next_index += 1;
            }
            Err(e) => {
                results.push(GameResult {
                    name: game.name.clone(),
                    success: false,
                    error: Some(e),
                });
            }
        }
    }

    // Write updated shortcuts.vdf
    let vdf_bytes = vdf::write_shortcuts(&shortcuts_root);
    fs::write(&shortcuts_path, &vdf_bytes)
        .await
        .map_err(|e| format!("Failed to write shortcuts.vdf: {}", e))?;

    let total = games.len();
    Ok(AddToSteamResult {
        total_games: total,
        success_count,
        fail_count: total - success_count,
        results,
    })
}

async fn process_game(
    client: &reqwest::Client,
    game: &GameToAdd,
    chrome_path: &str,
    launchers_dir: &Path,
    grid_dir: &Path,
    shortcuts: &mut BTreeMap<String, VdfValue>,
    index: u32,
    os: &str,
) -> Result<(), String> {
    // 1. Generate and write launcher script
    let sanitized = sanitize_filename(&game.name);
    let (script_name, script_content) = match os {
        "windows" => (
            format!("{}.bat", sanitized),
            generate_windows_launcher(&game.name, &game.launch_url, chrome_path),
        ),
        _ => (
            format!("{}.sh", sanitized),
            generate_linux_launcher(&game.name, &game.launch_url, chrome_path),
        ),
    };

    let script_path = launchers_dir.join(&script_name);
    fs::write(&script_path, &script_content)
        .await
        .map_err(|e| format!("Failed to write launcher: {}", e))?;

    // Make executable on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = std::fs::Permissions::from_mode(0o755);
        std::fs::set_permissions(&script_path, perms)
            .map_err(|e| format!("Failed to chmod: {}", e))?;
    }

    let exe_str = script_path.to_string_lossy().to_string();
    let start_dir = launchers_dir.to_string_lossy().to_string();

    // 2. Create shortcut entry
    let appid = generate_shortcut_id(&exe_str, &game.name);
    let mut entry = BTreeMap::new();
    entry.insert("appid".to_string(), VdfValue::Int32(appid));
    entry.insert("AppName".to_string(), VdfValue::String(game.name.clone()));
    entry.insert("exe".to_string(), VdfValue::String(format!("\"{}\"", exe_str)));
    entry.insert("StartDir".to_string(), VdfValue::String(format!("\"{}\"", start_dir)));
    entry.insert("icon".to_string(), VdfValue::String(String::new()));
    entry.insert("ShortcutPath".to_string(), VdfValue::String(String::new()));
    entry.insert("LaunchOptions".to_string(), VdfValue::String(String::new()));
    entry.insert("IsHidden".to_string(), VdfValue::Int32(0));
    entry.insert("AllowDesktopConfig".to_string(), VdfValue::Int32(1));
    entry.insert("AllowOverlay".to_string(), VdfValue::Int32(1));
    entry.insert("OpenVR".to_string(), VdfValue::Int32(0));
    entry.insert("Devkit".to_string(), VdfValue::Int32(0));
    entry.insert("DevkitGameID".to_string(), VdfValue::String(String::new()));
    entry.insert("DevkitOverrideAppID".to_string(), VdfValue::Int32(0));
    entry.insert("LastPlayTime".to_string(), VdfValue::Int32(0));
    entry.insert("FlatpakAppID".to_string(), VdfValue::String(String::new()));
    entry.insert("tags".to_string(), VdfValue::Map({
        let mut tags = BTreeMap::new();
        tags.insert("0".to_string(), VdfValue::String("XCloud".to_string()));
        tags
    }));

    shortcuts.insert(index.to_string(), VdfValue::Map(entry));

    // 3. Fetch and save artwork from SteamGridDB
    if let Err(e) = fetch_and_save_artwork(client, &game.name, &exe_str, grid_dir).await {
        eprintln!("Artwork fetch failed for {}: {}", game.name, e);
        // Non-fatal — game is still added
    }

    Ok(())
}

// ============================================================================
// SteamGridDB Artwork
// ============================================================================

async fn fetch_and_save_artwork(
    client: &reqwest::Client,
    game_name: &str,
    exe: &str,
    grid_dir: &Path,
) -> Result<(), String> {
    // Search for the game
    let search_url = format!(
        "{}/search/autocomplete/{}",
        STEAMGRIDDB_API_URL,
        urlencoding::encode(game_name)
    );

    let search_resp: SteamGridSearchResponse = client
        .get(&search_url)
        .header("Authorization", format!("Bearer {}", STEAMGRIDDB_API_KEY))
        .send()
        .await
        .map_err(|e| format!("Search request failed: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Search parse failed: {}", e))?;

    let game_id = search_resp
        .data
        .and_then(|d| d.first().map(|r| r.id))
        .ok_or_else(|| "No SteamGridDB results found".to_string())?;

    let shortcut_id = generate_shortcut_id(exe, game_name);

    // Fetch and save each artwork type
    let art_types = [
        ("grids", format!("{}p.png", shortcut_id)),
        ("heroes", format!("{}_hero.png", shortcut_id)),
        ("logos", format!("{}_logo.png", shortcut_id)),
        ("icons", format!("{}_icon.png", shortcut_id)),
    ];

    for (endpoint, filename) in &art_types {
        let url = format!("{}/{}/game/{}", STEAMGRIDDB_API_URL, endpoint, game_id);

        let resp = client
            .get(&url)
            .header("Authorization", format!("Bearer {}", STEAMGRIDDB_API_KEY))
            .send()
            .await;

        let resp = match resp {
            Ok(r) if r.status().is_success() => r,
            _ => continue,
        };

        let images: SteamGridImagesResponse = match resp.json().await {
            Ok(i) => i,
            Err(_) => continue,
        };

        if let Some(first) = images.data.and_then(|d| d.into_iter().next()) {
            // Download the image
            if let Ok(img_resp) = client.get(&first.url).send().await {
                if let Ok(bytes) = img_resp.bytes().await {
                    let dest = grid_dir.join(filename);
                    let _ = fs::write(&dest, &bytes).await;
                }
            }
        }
    }

    Ok(())
}

// ============================================================================
// Launcher Script Generation
// ============================================================================

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| if "<>:\"/\\|?*".contains(c) || c.is_whitespace() { '_' } else { c })
        .collect()
}

fn generate_windows_launcher(name: &str, launch_url: &str, chrome_path: &str) -> String {
    format!(
        r#"@echo off
REM XCloud Condenser - {}
REM Launch XCloud game in fullscreen Chrome app mode

start "" "{}" --app="{}" --start-fullscreen --disable-infobars --disable-session-crashed-bubble --disable-features=TranslateUI
"#,
        name, chrome_path, launch_url
    )
}

fn generate_linux_launcher(name: &str, launch_url: &str, chrome_path: &str) -> String {
    format!(
        r#"#!/bin/bash
# XCloud Condenser - {}
# Launch XCloud game in fullscreen Chrome app mode

"{}" --app="{}" --start-fullscreen --disable-infobars --disable-session-crashed-bubble --disable-features=TranslateUI
"#,
        name, chrome_path, launch_url
    )
}
