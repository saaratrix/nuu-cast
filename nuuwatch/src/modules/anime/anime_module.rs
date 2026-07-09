use axum::{
    routing::{get},
    Router,
};
use axum::routing::{patch, post};
use crate::AppState;
use crate::modules::anime::anike_jikan_routes::{handle_get_current_season, handle_get_season, handle_load_anime_full, handle_mal_image, handle_search_anime};
use crate::modules::anime::anime_routes::{get_anime_status, patch_anime_status, post_anime_status_query};

/// Initialize the module by binding routes to an existing Axum Router
pub fn get_routes() -> Router<AppState> {
    let mod_routes = Router::new()
    .route("/anime/view/{mal_id}", patch(patch_anime_status))
    .route("/anime/view/{mal_id}", get(get_anime_status))
    .route("/anime/view/query", post(post_anime_status_query))
    // Jikan Proxy & cache routes
    .route("/anime/seasons/now",   get(handle_get_current_season))
    .route("/anime/seasons/{year}/{season}", get(handle_get_season))
    .route("/anime/load/{mal_id}/full", get(handle_load_anime_full))
    .route("/anime/search", get(handle_search_anime))
    .route("/anime/malimage/{*image_url}", get(handle_mal_image));

    mod_routes
}