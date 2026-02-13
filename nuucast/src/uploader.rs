use axum::{
    extract::Path as AxumPath,
    body::Bytes,
    http::StatusCode,
};

pub async fn handle_upload(
    path: Option<AxumPath<String>>,
    body: Bytes,
) -> StatusCode {

    return StatusCode::OK;
}