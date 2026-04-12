use std::io::Cursor;
use std::path::PathBuf;
use axum::extract::{Path, Query, };
use axum::http::{StatusCode};
use axum::Json;
use axum::response::{Html, IntoResponse, Response};
use serde::Deserialize;
use crate::modules::anime::jikan::jikan::Jikan;
use crate::modules::anime::anime_request_cacher::{try_get_cached_mal_image, DATA_ANIME_ROOT};

#[derive(Debug, Clone, Deserialize)]
pub struct AnimeParams {
    #[serde(default = "default_page")]
    page: u16
}

fn default_page() -> u16 {
    1
}

pub async fn handle_get_current_season(Query(params): Query<AnimeParams>) -> impl IntoResponse {
    // params.page will be 1 by default (via serde default) or from URL ?page=2
    let jikan = Jikan::new();
    let response = jikan.load_current_season(params.page).await.unwrap();
    (StatusCode::OK, Json(response)).into_response()
}

pub async fn handle_mal_image(Path(url) : Path<String>
) -> Response {
    println!("handle_mal_image: {}", url);

    if let Some(cached_response) = try_get_cached_mal_image(&url).await {
        return cached_response;
    }

    let root = DATA_ANIME_ROOT.clone();
    println!("root {:?}", root);
    let image_path = root.join("images").join(&url);

    println!("image_path: {:?}", image_path);

    if !image_path.starts_with(&root) {
        return (StatusCode::NOT_FOUND, "Image not found").into_response();
    }
    // Build full external URL for fetching from MAL
    let image_url = format!("https://myanimelist.net/images/anime/{}", url);
    // Fetch the image using reqwest in blocking mode
    let mut response = reqwest::get(image_url).await.unwrap();
    if !response.status().is_success() {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Unexpected error fetching MAL image.").into_response();
    }

    // Create the image file (ensure parent directories exist)
    std::fs::create_dir_all(image_path.parent().unwrap()).ok();

    let bytes = response.bytes().await.unwrap();
    std::fs::write(&image_path, &bytes).expect("Failed to write image");

    if let Some(cached_response) = try_get_cached_mal_image(&url).await {
        return cached_response;
    }

    (StatusCode::INTERNAL_SERVER_ERROR, "Failed to properly get image").into_response()
}

