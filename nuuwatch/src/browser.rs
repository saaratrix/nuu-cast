use crate::html::html_template::{get_browser_html};
use axum::{
    http::StatusCode,
    response::{
        IntoResponse,
        Response,
        Html,
    }
};

pub async fn browse() -> Response {
    let html = get_browser_html();
    (StatusCode::OK, Html(html)).into_response()
}