use std::path::{ PathBuf, Path };
use axum::{
    extract::Path as AxumPath,
    http::StatusCode,
    response::IntoResponse,
    response::Response,
};
use axum::response::Redirect;
use crate::io::file_utility::{get_path_from_url, get_path_details, get_directory_children, PathType, MEDIA_ROOT};

pub async fn explore_path_root() -> impl IntoResponse {
    let path = PathBuf::new();
    explore_path(path).await
}

pub async fn explore_path_wildcard(AxumPath(url) : AxumPath<String>
) -> impl IntoResponse {
    let path = get_path_from_url(url);

    let result = path.unwrap_or_else(|| PathBuf::new());
    explore_path(result).await
}

async fn explore_path(path: PathBuf) -> impl IntoResponse {
    // Check if at index/root
    if path.as_os_str().is_empty() || path == PathBuf::from("/") {
        let joined_path = MEDIA_ROOT.join(path);
        return explore_directory(&joined_path).await;
    }

    let joined_path = MEDIA_ROOT.join(path);
    // Check cache/filesystem
    match get_path_details(&joined_path) {
        PathType::File => explore_file(&joined_path).await,
        PathType::Directory => return explore_directory(&joined_path).await,
        PathType::Unknown | PathType::NotFound => {
            // Path doesn't exist, redirect to index
            Redirect::temporary("/").into_response()
        }
    }
}

async fn explore_file(path: &PathBuf) -> Response {
    (StatusCode::OK, format!("File: {}", path.display())).into_response()
}

async fn explore_directory(path: &PathBuf) -> Response {
    let directory_items = get_directory_children(path);

    let mut output = format!("Directory: {}\n\n", path.display());
    output.push_str("Directories:\n");
    for dir in &directory_items.directories {
        output.push_str(&format!("  {}\n", dir.display()));
    }

    output.push_str("\nFiles:\n");
    for file in &directory_items.files {
        output.push_str(&format!("  {}\n", file.display()));
    }

    (StatusCode::OK, output).into_response()
}