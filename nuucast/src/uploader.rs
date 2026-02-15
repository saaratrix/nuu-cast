use std::path::PathBuf;
use axum::{
    extract::Path as AxumPath,
    body::Bytes,
    http::StatusCode,
};
use crate::io::file_utility::{get_url_and_filepath_from_url, UrlAndFilePath, MEDIA_ROOT};

pub async fn handle_upload(
    AxumPath(url) : AxumPath<String>,
    body: Bytes,
) -> StatusCode {
    let paths = get_url_and_filepath_from_url(&url).unwrap_or_else(|| UrlAndFilePath { url: PathBuf::new(), filepath: MEDIA_ROOT.clone() });

    match tokio::fs::write(&paths.filepath, &body).await {
        Ok(_) => {
            StatusCode::OK
        }
        Err(e) => {
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}