use std::path::PathBuf;
use axum::{extract::Path as AxumPath, http::StatusCode, response::{
    IntoResponse,
}, Json};
use crate::io::file_utility::{get_directory_children, get_path_details, get_url_and_filepath_from_url, PathType, UrlAndFilePath, MEDIA_ROOT};

pub async fn get_files(AxumPath(url): AxumPath<String>) -> impl IntoResponse {
    let result = get_url_and_filepath_from_url(&url);
    if result.is_none() {
        return (StatusCode::NOT_FOUND, "Not found").into_response();
    }
    let paths = result.unwrap();

    match get_path_details(&paths.filepath) {
        PathType::Directory => {}
        PathType::File => {
            return (StatusCode::IM_A_TEAPOT, "Not a directory").into_response();
        }
        PathType::Unknown | PathType::NotFound => {
            // Only list files if directory
            return (StatusCode::NOT_FOUND, "Not found").into_response();
        }
    }

    let directory_items = get_directory_children(&paths.filepath);
    let files: Vec<PathBuf> = directory_items.files.iter().map(|f|f.url.clone()).collect();

    (StatusCode::OK, Json(files)).into_response()
}