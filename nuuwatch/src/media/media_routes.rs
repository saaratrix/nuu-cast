use std::path::PathBuf;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use axum::response::IntoResponse;
use crate::AppState;
use crate::nuucast_api::nuucast_api::get_files_in_directory;

pub async fn get_media_files(
    Path(url): Path<String>,
    State(state): State<AppState>,
// ) -> Result<Json<Vec<String>>, (StatusCode, String)> {
) -> impl IntoResponse {
    let path = PathBuf::from(url);
    let files = get_files_in_directory(&state.nuucast, &path).await.map_err(|e| e.to_string()).unwrap_or(Vec::new());
    (StatusCode::OK, Json(files)).into_response()
}