use axum::{
    extract::Path as AxumPath,
    http::StatusCode,
    response::{
        IntoResponse,
        Response,
    }
};


pub async fn delete_path(AxumPath(url) : AxumPath<String>) -> impl IntoResponse {
    println!("Deleting {url}");

    StatusCode::NOT_IMPLEMENTED
}