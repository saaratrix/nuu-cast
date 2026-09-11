use crate::html::html_template::{get_anime_page_html, get_home_page_html};
use axum::{
    http::StatusCode,
    response::{
        IntoResponse,
        Response,
        Html,
    }
};

pub async fn browse() -> Response {
    let html = get_home_page_html();
    (StatusCode::OK, Html(html)).into_response()
}