use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct XCloudGame {
    pub id: String,
    pub name: String,
    #[serde(rename = "imageUrl")]
    pub image_url: String,
    #[serde(rename = "launchUrl")]
    pub launch_url: String,
}

#[derive(Debug, Deserialize)]
struct SiglsEntry {
    id: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct DisplayCatalogResponse {
    products: Option<Vec<Product>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct Product {
    product_id: String,
    localized_properties: Option<Vec<LocalizedProperty>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct LocalizedProperty {
    product_title: Option<String>,
    images: Option<Vec<ProductImage>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct ProductImage {
    image_purpose: Option<String>,
    uri: Option<String>,
}

const SIGLS_URL: &str = "https://catalog.gamepass.com/sigls/v2";
const DISPLAY_CATALOG_URL: &str = "https://displaycatalog.mp.microsoft.com/v7.0/products";
const CLOUD_GAMING_SIGLS_ID: &str = "f6f1f99f-9b49-4ccd-b3bf-4d9767a77f5e";
const BATCH_SIZE: usize = 20;

#[tauri::command]
pub async fn fetch_xcloud_games(market: String) -> Result<Vec<XCloudGame>, String> {
    let client = reqwest::Client::new();

    // Step 1: Fetch game IDs from sigls
    let sigls_url = format!(
        "{}?id={}&language=en-us&market={}",
        SIGLS_URL, CLOUD_GAMING_SIGLS_ID, market
    );

    let entries: Vec<SiglsEntry> = client
        .get(&sigls_url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch game list: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Failed to parse game list: {}", e))?;

    let ids: Vec<String> = entries.into_iter().filter_map(|e| e.id).collect();

    if ids.is_empty() {
        return Ok(vec![]);
    }

    // Step 2: Fetch product details in batches
    let mut games: Vec<XCloudGame> = Vec::new();
    let mut seen_ids = std::collections::HashSet::new();

    for batch in ids.chunks(BATCH_SIZE) {
        let big_ids = batch.join(",");
        let details_url = format!(
            "{}?bigIds={}&market={}&languages=en-us&MS-CV=DGU1mcuYo0WMMp",
            DISPLAY_CATALOG_URL, big_ids, market
        );

        let response = client
            .get(&details_url)
            .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            .header("Accept", "application/json")
            .send()
            .await;

        let response = match response {
            Ok(r) => r,
            Err(e) => {
                eprintln!("Failed to fetch batch: {}", e);
                continue;
            }
        };

        let catalog: DisplayCatalogResponse = match response.json().await {
            Ok(c) => c,
            Err(e) => {
                eprintln!("Failed to parse batch: {}", e);
                continue;
            }
        };

        if let Some(products) = catalog.products {
            for product in products {
                if seen_ids.contains(&product.product_id) {
                    continue;
                }
                seen_ids.insert(product.product_id.clone());

                let localized = match product.localized_properties.as_ref().and_then(|lp| lp.first()) {
                    Some(lp) => lp,
                    None => continue,
                };

                let title = localized
                    .product_title
                    .clone()
                    .unwrap_or_else(|| product.product_id.clone());

                let images = localized.images.as_deref().unwrap_or(&[]);
                let image_url = find_best_image(images);

                let slug = title.to_lowercase().replace(' ', "-");
                let launch_url = format!(
                    "https://www.xbox.com/play/launch/{}/{}",
                    slug, product.product_id
                );

                games.push(XCloudGame {
                    id: product.product_id,
                    name: title,
                    image_url,
                    launch_url,
                });
            }
        }
    }

    Ok(games)
}

fn find_best_image(images: &[ProductImage]) -> String {
    let priorities = ["BoxArt", "Poster", "Tile", "SuperHeroArt"];

    for purpose in &priorities {
        if let Some(img) = images.iter().find(|i| {
            i.image_purpose.as_deref() == Some(purpose)
        }) {
            if let Some(uri) = &img.uri {
                return normalize_image_url(uri);
            }
        }
    }

    // Fall back to first image with a URI
    if let Some(img) = images.iter().find(|i| i.uri.is_some()) {
        return normalize_image_url(img.uri.as_ref().unwrap());
    }

    String::new()
}

fn normalize_image_url(uri: &str) -> String {
    if uri.starts_with("//") {
        format!("https:{}", uri)
    } else {
        uri.to_string()
    }
}
