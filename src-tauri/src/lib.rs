mod commands;
mod crc32;
mod vdf;

use commands::steam_integration::{add_games_to_steam, detect_steam_config};
use commands::steamgriddb::{fetch_steamgriddb_images, search_steamgriddb};
use commands::xcloud_games::fetch_xcloud_games;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            fetch_xcloud_games,
            search_steamgriddb,
            fetch_steamgriddb_images,
            detect_steam_config,
            add_games_to_steam,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
