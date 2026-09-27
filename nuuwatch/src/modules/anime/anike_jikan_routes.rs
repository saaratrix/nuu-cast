use std::path::{Component, Path as StdPath};
use std::str::FromStr;
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::Json;
use axum::response::{IntoResponse, Response};
use serde::Deserialize;
use crate::AppState;
use crate::modules::anime::anime_request_cacher::{try_get_cached_mal_image, DATA_ANIME_ROOT, try_get_cached_ani_list_image, get_ani_list_image_path_from_url};
use crate::modules::anime::api_shared::anime_api::AnimeApi;
use crate::modules::anime::api_shared::anime_api_models::Season;

#[derive(Debug, Clone, Deserialize)]
pub struct AnimeParams {
    #[serde(default = "default_page")]
    year: u16,
    season: String,
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

pub async fn handle_get_current_season(
    Query(params): Query<AnimeParams>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    // params.page will be 1 by default (via serde default) or from URL ?page=2
    let season = Season::from_str(&params.season).unwrap();
    let response = state.anime_api.load_season(params.year, season).await.unwrap();
    (StatusCode::OK, Json(response)).into_response()
}

pub async fn handle_get_season(
    Path((year, season)): Path<(u16, String)>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let season = Season::from_str(&season).unwrap();
    let response = state.anime_api.load_season(year, season).await.unwrap();
    (StatusCode::OK, Json(response)).into_response()
}

pub async fn handle_load_anime_full(Path(id): Path<u32>, State(state): State<AppState>,) -> impl IntoResponse {
    let response = state.anime_api.load_anime(id).await.unwrap();
    (StatusCode::OK, Json(response)).into_response()
}

pub async fn handle_search_anime(
    Query(params): Query<AnimeSearchParams>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    (StatusCode::INTERNAL_SERVER_ERROR, "Not Implemented.").into_response()
}

/// Fetch image from local server cache if it exists, else fetch it from MAL.
pub async fn handle_mal_image(Path(url) : Path<String>
) -> Response {
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
    let image_url = format!("https://cdn.myanimelist.net/images/anime/{}", url);
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

pub async fn handle_ani_list_image(Path((id, url)) : Path<(u32, String)>
) -> Response {
    let url = match url::Url::parse(&url) {
        Ok(url) => url,
        Err(_) => {
            return (StatusCode::NOT_FOUND, "Image not found").into_response();
        }
    };

    if let Some(cached_response) = try_get_cached_ani_list_image(id, &url).await {
        return cached_response;
    }

    let (image_path, extension) = match get_ani_list_image_path_from_url(id, &url) {
        Some(val) => val,
        None => {
            return (StatusCode::NOT_FOUND, "Could not parse AniList url").into_response();
        }
    };

    println!("image_path: {:?}", image_path.display());
    let response = reqwest::get(url.clone()).await.unwrap();
    if !response.status().is_success() {
        return (StatusCode::INTERNAL_SERVER_ERROR, "Unexpected error fetching AniList image.").into_response();
    }

    std::fs::create_dir_all(image_path.parent().unwrap()).ok();

    let bytes = response.bytes().await.unwrap();
    std::fs::write(&image_path, &bytes).expect("Failed to write image.");

    if let Some(cached_response) = try_get_cached_ani_list_image(id, &url).await {
        return cached_response;
    }

    (StatusCode::INTERNAL_SERVER_ERROR, "Failed to properly get image").into_response()
}