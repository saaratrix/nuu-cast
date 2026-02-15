mod explorer;
mod uploader;
mod io;
mod file_fetcher;
mod html;
mod deleter;

use std::collections::HashMap;
use axum::{Form, Router};
use axum::extract::{DefaultBodyLimit, Path};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, delete, put, post};
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .nest_service("/static", ServeDir::new("static"))
        .route("/stream/{*path}", get(file_fetcher::stream_file))
        .route("/{*path}", get(explorer::explore_path_wildcard))
        .route("/{*path}", put(uploader::handle_upload).layer(DefaultBodyLimit::max(100 * 1024 * 1024 * 1024)))
        .route("/{*path}", delete(deleter::delete_path))
        .route("/delete_path/{*path}", post(delete_form_method_override))
        .route("/", get(explorer::explore_path_root));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn delete_form_method_override(
    axum_path: Path<String>,
    Form(form): Form<HashMap<String, String>>,
) -> impl IntoResponse {
    if form.get("_method") == Some(&"DELETE".to_string()) {
        deleter::delete_path(axum_path).await.into_response()
    } else {
        StatusCode::METHOD_NOT_ALLOWED.into_response()
    }
}