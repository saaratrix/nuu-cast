use axum::{
    routing::{get, put},
    Router, Json,
};

use crate::modules::anime::anime_routes::{handle_get_current_season, handle_mal_image};

/// Initialize the module by binding routes to an existing Axum Router
pub fn get_routes() -> Router {
    let mod_routes = Router::new()
    .route(
        "/anime/seasons/now",
        get(handle_get_current_season),
    )
    .route(
        "/anime/malimage/{*image_url}",
        get(handle_mal_image)
    );
    //     .route(
    //         "/anime/{year}/{season}/{page}",
    //         put(handle_put_anime),
    //     );

    mod_routes
}