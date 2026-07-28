use axum::Router;
use axum::routing::get;
use crate::AppState;
use crate::media::media_routes::get_media_files;

pub fn get_media_routes() -> Router<AppState> {
    let routes = Router::new()
        .route("/media/files/{*path}", get(get_media_files));
    routes
}