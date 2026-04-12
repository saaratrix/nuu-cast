use std::path::PathBuf;
use axum::body::Bytes;
use crate::io::file_utility::UrlAndFilePath;
use crate::converters::mkv_converter::convert_mkv;

const CONVERT_THESE_FILE_TYPES: &[&str] = &["mkv"];

pub fn should_convert(extension: &str) -> bool {
    CONVERT_THESE_FILE_TYPES.contains(&extension.to_lowercase().as_str())
}

pub async fn convert_file(
    paths: &UrlAndFilePath,
    extension: &str,
    body: &Bytes,
) -> Result<Vec<PathBuf>, String> {
    if !should_convert(extension) {
        return Ok(Vec::new());
    }

    match extension.to_lowercase().as_str() {
        "mkv" => Ok(convert_mkv(paths, body).await?),
        _ => {
            Err("Not implemented.".to_string())
        }
    }
}
