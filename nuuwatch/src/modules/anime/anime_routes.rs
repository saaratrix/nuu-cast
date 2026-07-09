use axum::extract::{Path, Query, State};
use axum::http::{StatusCode};
use axum::response::{Json, IntoResponse, Response};
use serde::Deserialize;
use crate::AppState;
use crate::database::anime_queries::{get_status, get_status_all, patch_status, AnimeStatusPatch};

pub async fn patch_anime_status(
    State(state): State<AppState>,
    Path(mal_id): Path<i32>,
    Json(patch): Json<AnimeStatusPatch>,
) -> impl IntoResponse {
    match patch_status(&state.db, mal_id, patch).await {
        Ok(rows) if rows > 0 => StatusCode::OK,
        Ok(_) => StatusCode::NOT_FOUND,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

pub async fn get_anime_status(
    State(state): State<AppState>,
    Path(mal_id): Path<i32>,
) -> impl IntoResponse {
    match get_status(&state.db, mal_id).await {
        Ok(Some(anime)) => (StatusCode::OK, Json(anime)).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(err) => {
            eprintln!("Database error: {err}");
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct AnimeStatusQuery {
    pub mal_ids: Vec<i32>,
}

pub async fn post_anime_status_query(
    State(state): State<AppState>,
    Json(query): Json<AnimeStatusQuery>,
) -> impl IntoResponse {
    match get_status_all(&state.db, query.mal_ids).await {
        Ok(animes) => (StatusCode::OK, Json(animes)).into_response(),
        Err(err) => {
            eprintln!("Database error: {err}");
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}

