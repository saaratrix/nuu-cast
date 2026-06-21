mod browser;
mod html;
mod modules;
mod data_utility;
pub mod db;

use axum::{Router};
use axum::routing::{get};
use tower_http::services::ServeDir;
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use crate::db::init_db;
use crate::modules::anime::anime_module;

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let db = init_db().await?;
    let state = AppState { db };

    let app = Router::new()
        .nest_service("/static", ServeDir::new("static"))
        .route("/", get(browser::browse))
        .merge(anime_module::get_routes())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
