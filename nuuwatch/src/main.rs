mod browser;
mod html;
mod modules;
mod data_utility;

use axum::{Router};
use axum::routing::{get};
use tower_http::services::ServeDir;
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use crate::modules::anime::anime_module;

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let db = SqlitePoolOptions::new()
        .max_connections(5)
        .connect("sqlite://data/app.db?mode=rwc")
        .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            data TEXT NOT NULL
        )
        "#,
    )
        .execute(&db)
        .await?;

    let state = AppState { db };

    let app = Router::new()
        .nest_service("/static", ServeDir::new("static"))
        .route("/", get(browser::browse));

    let anime_routes = anime_module::get_routes();
    let app = app.merge(anime_routes).with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
