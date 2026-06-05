use std::path::PathBuf;
use axum::{extract::Path as AxumPath, body::Bytes, http::StatusCode, Json};
use crate::converters::conversion::{convert_file, should_convert};
use crate::io::file_utility::{get_url_and_filepath_from_url, invalidate_path_details, UrlAndFilePath, MEDIA_ROOT};

pub async fn handle_upload(
    AxumPath(url): AxumPath<String>,
    body: Bytes,
) -> Result<Json<Vec<PathBuf>>, (StatusCode, String)> {
    let paths = get_url_and_filepath_from_url(&url)
        .ok_or((StatusCode::BAD_REQUEST, "Could not parse upload url".to_string()))?;

    let extension = paths.filepath
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    let added_files = if should_convert(extension) {
        convert_file(&paths, &extension, &body).await
            .map_err(|e| {
                println!("Conversion error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, e)
            })?
    } else {
        tokio::fs::write(&paths.filepath, &body).await
            .map_err(|e| {
                println!("write error: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
            })?;
        vec![paths.url.clone()]
    };

    if added_files.is_empty() {
        return Err((StatusCode::INTERNAL_SERVER_ERROR, "No files uploaded".to_string()));
    }
    // This doesn't invalidate directories but a future problem.
    for path in &added_files {
        invalidate_path_details(path);
    }

    Ok(Json(added_files))
}