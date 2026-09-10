use axum::extract::{Path, State};
use axum::response::IntoResponse;
use axum::{Router};
use axum::http::StatusCode;
use axum::routing::{get, patch, post, put};
use crate::AppState;
use crate::html::html_template::get_home_html;

pub fn get_html_routes() -> Router<AppState> {
    let html_routes = Router::new()
        .route("/html/{layout}", get(get_html_layout));

    Router::new().merge(html_routes)
}

async fn get_html_layout(State(state): State<AppState>,
                   Path(layout): Path<String>
) -> impl IntoResponse {
    let html = match layout.as_str() {
        "home" => get_home_html(),
        "anime" => String::new(),
        _ => String::new(),
    };

    (StatusCode::OK, html).into_response()
}