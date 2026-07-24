mod browser;
mod html;
mod modules;
mod data_utility;
mod database;

use tokio::fs::{create_dir_all};
use std::path::{Path};
use axum::{Router};
use axum::routing::{get};
use tower_http::services::ServeDir;
use sqlx::{SqlitePool};
use crate::data_utility::data_utility::DATA_ROOT;
use crate::database::db::init_db;
use crate::modules::anime::anime_module;

#[derive(Clone)]
struct AppState {
    db: SqlitePool,
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    ensure_data_folders_existing().await;

    let db = init_db().await?;
    let state = AppState { db };

    let app = Router::new()
        .nest_service("/static", ServeDir::new("static"))
        .route("/", get(browser::browse))
        .merge(anime_module::get_routes())
        .merge(modules::modules_fetcher::get_modules_routes())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}

async fn ensure_data_folders_existing() {
    let paths = vec![
        DATA_ROOT.clone(),
        DATA_ROOT.join("anime"),
    ];

    for path_buf in paths {
        let path = Path::new(&path_buf);
        if let Err(e) = create_dir_all(path).await {
            println!("Failed to create {} directory: {e}", path.display());
            std::process::exit(1);
        }
    }
}
