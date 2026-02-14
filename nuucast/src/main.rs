mod explorer;
mod uploader;
mod io;
mod file_fetcher;
mod html;

use axum::{Router, routing::get};
use axum::routing::put;
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .nest_service("/static", ServeDir::new("static"))
        .route("/stream/{*path}", get(file_fetcher::stream_file))
        .route("/{*path}", put(uploader::handle_upload))
        .route("/{*path}", get(explorer::explore_path_wildcard))
        .route("/", get(explorer::explore_path_root));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}