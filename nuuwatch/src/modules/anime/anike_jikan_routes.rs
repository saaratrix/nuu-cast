use std::path::{Component, Path as StdPath};
use axum::extract::{Path, Query};
use axum::http::StatusCode;
use axum::Json;
use axum::response::{IntoResponse, Response};
use serde::Deserialize;
use crate::modules::anime::anime_request_cacher::{try_get_cached_mal_image, DATA_ANIME_ROOT};
use crate::modules::anime::jikan::jikan::Jikan;

#[derive(Debug, Clone, Deserialize)]
pub struct AnimeParams {
    #[serde(default = "default_page")]
    page: u16
}

#[derive(Debug, Clone, Deserialize)]
pub struct AnimeSearchParams {
    #[serde(default = "default_query")]
    query: String,
    #[serde(default = "default_limit")]
    limit: u16,
}

fn default_page() -> u16 {
    1
}

fn default_limit() -> u16 { 20 }
fn default_query() -> String { "".to_string() }

pub async fn handle_get_current_season(Query(params): Query<AnimeParams>) -> impl IntoResponse {
    // params.page will be 1 by default (via serde default) or from URL ?page=2
    let jikan = Jikan::new();
    let response = jikan.load_current_season(params.page).await.unwrap();
    (StatusCode::OK, Json(response)).into_response()
}

pub async fn handle_get_season(
    Path(year): Path<u32>,
    Path(season): Path<u32>,
    Query(params): Query<AnimeParams>) -> impl IntoResponse {
    (StatusCode::INTERNAL_SERVER_ERROR, "Not Implemented.").into_response()
}

pub async fn handle_load_anime_full(Path(mal_id): Path<u32>,) -> impl IntoResponse {
    // return this.request.send(['anime', id, request], parameters);
    (StatusCode::INTERNAL_SERVER_ERROR, "Not Implemented.").into_response()
}

pub async fn handle_search_anime(Query(params): Query<AnimeSearchParams>) -> impl IntoResponse {
    (StatusCode::INTERNAL_SERVER_ERROR, "Not Implemented.").into_response()
}

/// Fetch image from local server cache if it exists, else fetch it from MAL.
pub async fn handle_mal_image(Path(url) : Path<String>
) -> Response {
    println!("handle_mal_image: {}", url);

    if !StdPath::new(&url)
        .components()
        .all(|c| matches!(c, Component::Normal(_))) {
        return (StatusCode::NOT_FOUND, "Image not found").into_response()
    }

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
    let image_url = format!("https://myanimelist.net/images/anime/{}", url);
    let response = reqwest::get(image_url).await.unwrap();
    if !response.status().is_success() {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Unexpected error fetching MAL image.").into_response();
    }

    std::fs::create_dir_all(image_path.parent().unwrap()).ok();

    let bytes = response.bytes().await.unwrap();
    std::fs::write(&image_path, &bytes).expect("Failed to write image");

    if let Some(cached_response) = try_get_cached_mal_image(&url).await {
        return cached_response;
    }

    (StatusCode::INTERNAL_SERVER_ERROR, "Failed to properly get image").into_response()
}