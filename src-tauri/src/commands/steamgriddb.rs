use serde::{Deserialize, Serialize};

const STEAMGRIDDB_API_URL: &str = "https://www.steamgriddb.com/api/v2";

#[derive(Debug, Serialize, Deserialize)]
pub struct SteamGridDBSearchResult {
    pub id: u64,
    pub name: String,
    pub types: Vec<String>,
    pub verified: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SteamGridDBImage {
    pub id: u64,
    pub url: String,
    pub thumb: String,
    pub style: String,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Deserialize)]
struct ApiResponse<T> {
    data: Option<T>,
}

#[tauri::command]
pub async fn search_steamgriddb(
    api_key: String,
    query: String,
) -> Result<Vec<SteamGridDBSearchResult>, String> {
    let client = reqwest::Client::new();
    let url = format!(
        "{}/search/autocomplete/{}",
        STEAMGRIDDB_API_URL,
        urlencoding::encode(&query)
    );

    let response: ApiResponse<Vec<SteamGridDBSearchResult>> = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("SteamGridDB search failed: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Failed to parse search results: {}", e))?;

    Ok(response.data.unwrap_or_default())
}

#[tauri::command]
pub async fn fetch_steamgriddb_images(
    api_key: String,
    game_id: u64,
    art_type: String,
) -> Result<Vec<SteamGridDBImage>, String> {
    let endpoint = match art_type.as_str() {
        "grid" => "grids",
        "hero" => "heroes",
        "logo" => "logos",
        "icon" => "icons",
        _ => "grids",
    };

    let client = reqwest::Client::new();
    let url = format!("{}/{}/game/{}", STEAMGRIDDB_API_URL, endpoint, game_id);

    let response: ApiResponse<Vec<SteamGridDBImage>> = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("SteamGridDB images failed: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Failed to parse images: {}", e))?;

    Ok(response.data.unwrap_or_default())
}
