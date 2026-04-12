mod browser;
mod html;
mod modules;
mod data_utility;

use axum::{Form, Router};
use axum::response::IntoResponse;
use axum::routing::{get, delete, put, post};
use tower_http::services::ServeDir;
use crate::modules::anime::anime_module;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .nest_service("/static", ServeDir::new("static"))
        .route("/", get(browser::browse));

    let anime_routes = anime_module::get_routes();
    let app = app.merge(anime_routes);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
