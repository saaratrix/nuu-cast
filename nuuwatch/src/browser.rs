use crate::html::html_template::{get_browser_html};
use axum::{
    extract::Path as AxumPath,
    http::StatusCode,
    response::{
        IntoResponse,
        Response,
        Html,
        Redirect
    }
};

pub async fn browse() -> Response {
    let html = get_browser_html();
    (StatusCode::OK, Html(html)).into_response()
}