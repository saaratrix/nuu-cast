use std::path::{ PathBuf, Path };
use axum::{
    extract::Path as AxumPath,
    http::StatusCode,
    response::IntoResponse,
};
use crate::file_utility::get_path_from_url;

pub async fn explore_path_root() -> impl IntoResponse {
    let path = PathBuf::new();
    explore_path(path).await
}

pub async fn explore_path_wildcard(AxumPath(url) : AxumPath<String>
) -> impl IntoResponse {
    let path = get_path_from_url(url);

    let result = path.unwrap_or_else(|| PathBuf::new());
    explore_path(result).await
}

async fn explore_path(path: PathBuf) -> impl IntoResponse {
    (StatusCode::OK, format!("Path: {}", path.display()))
}