mod browser;
mod html;
mod modules;
mod data_utility;
mod database;
mod nuucast_api;
mod media;

use tokio::fs::{create_dir_all};
use std::path::{Path};
use std::sync::Arc;
use axum::{Router};
use axum::routing::{get};
use tower_http::services::ServeDir;
use sqlx::{SqlitePool};
use crate::data_utility::data_utility::DATA_ROOT;
use crate::database::db::init_db;
use crate::modules::anime::anilist::anilist::AniList;
use crate::modules::anime::api_shared::anime_api::{AnimeApiClient, AnimeApiKind};
use crate::modules::anime::jikan::jikan::Jikan;
use crate::nuucast_api::nuucast_client::NuucastClient;



#[derive(Clone)]
struct AppState {
    db: SqlitePool,
    anime_api: AnimeApiClient,
    nuucast: NuucastClient,
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    ensure_data_folders_existing().await;

    let db = init_db().await?;

    let active_api = AnimeApiKind::AniList;

    let anime_api = match active_api {
        AnimeApiKind::AniList => AnimeApiClient::AniList(AniList::new(AniList::create_shared_client())),
        AnimeApiKind::Jikan => AnimeApiClient::Jikan(Jikan::new(Jikan::create_shared_client(false))),
    };

    let nuucast_client = NuucastClient::new(NuucastClient::create_client());
    let state = AppState { db, anime_api, nuucast: nuucast_client };

    let app = Router::new()
        .nest_service("/static", ServeDir::new("static"))
        .route("/", get(browser::browse))
        .merge(modules::anime::anime_module_router::get_anime_routes())
        .merge(modules::modules_router::get_modules_routes())
        .merge(media::media_router::get_media_routes())
        .merge(html::html_page_layouts::get_html_routes())
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
