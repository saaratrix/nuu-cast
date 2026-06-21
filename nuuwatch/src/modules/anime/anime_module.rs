use axum::{
    routing::{get},
    Router,
};
use axum::routing::put;
use crate::AppState;
use crate::modules::anime::anime_routes::{get_anime_status, handle_get_current_season, handle_mal_image, update_viewing_anime};

/// Initialize the module by binding routes to an existing Axum Router
pub fn get_routes() -> Router<AppState> {
    let mod_routes = Router::new()
    .route(
        "/anime/seasons/now",
        get(handle_get_current_season),
    )
    .route(
        "/anime/malimage/{*image_url}",
        get(handle_mal_image)
    )
    //     .route(
    //         "/anime/{year}/{season}/{page}",
    //         put(handle_put_anime),
    //     );
    .route(
        "/anime/view/{mal_id}",
        put(update_viewing_anime),
    )
        .route("/anime/status/{mal_id}", get(get_anime_status));

    mod_routes
}