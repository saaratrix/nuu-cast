use std::io;
use std::path::PathBuf;
use std::sync::LazyLock;
use axum::body::Body;
use axum::http::{header};
use axum::response::{IntoResponse, Response};
use tokio::fs::File;
use tokio_util::io::ReaderStream;
use url::Url;
use crate::data_utility::data_utility::{DATA_ROOT,};

pub static DATA_ANIME_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| PathBuf::from(&*DATA_ROOT).join("anime"));

pub fn get_cache_key(url: &Url) -> Option<String> {
    let segments = url.path_segments()?;

    let segments_key = segments.map(|s| s.to_string())
        .collect::<Vec<_>>()
        .join("");

    let query = &url.query().unwrap_or_else(||"").to_owned();
    let sanitized_query = query.replace(&['&', '[', '?', '<', '>', ':', '*', '/', '\\', '|', '"'][..], "");

    Some(
        segments_key + &sanitized_query
    )
}

pub fn get_cache_key_path(url: &Url) -> Option<PathBuf> {
    let cache_key = get_cache_key(url)?;
    let path = PathBuf::from(&*DATA_ANIME_ROOT.join(&cache_key));
    Some(path)
}

pub async fn try_get_cached_request_json(url: &Url) -> Option<String> {
    let cache_key = get_cache_key(url);
    println!("cache key: {:?}", cache_key);

    if let Some(_) = cache_key {
        let path = get_cache_key_path(&url)?;

        if tokio::fs::metadata(path.clone()).await.is_ok() {
            return match tokio::fs::read_to_string(path.clone()).await {
                Ok(content) => Some(content),
                Err(e) => {
                    println!("Failed to read cache file for path: {} error {}", &path.display(), e);
                    None
                },
            };
        }
    }
    None
}

pub async fn add_cached_request_json(url: &Url, response: &str) -> io::Result<()> {
    println!("add cached request {}", &url);

    let path = get_cache_key_path(&url).unwrap_or_else(|| PathBuf::new());
    println!("add_cached_request cache file path {}", path.display());

    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await.map_err(|e| {
            io::Error::new(e.kind(), format!("Parent directory creation failed: {:?}", e))
        })?;
    }

    tokio::fs::write(path, response).await?;
    Ok(())
}

pub async fn try_get_cached_mal_image(url: &str) -> Option<Response> {
    let root = DATA_ANIME_ROOT.clone();
    let path = root.join("images").join(&url);
    let canonical = path.canonicalize().ok()?;
    if !canonical.starts_with(root) {
        return None;
    }

    let file = match File::open(path).await {
        Ok(f) => f,
        Err(_) => return None,
    };

    let file_size = match file.metadata().await {
        Ok(meta) => meta.len(),
        Err(_) => return None,
    };

    let mime_type = "image/webp";
    let stream = ReaderStream::new(file);
    let body = Body::from_stream(stream);
    let header = [
        (header::CONTENT_TYPE, mime_type),
        (header::ACCEPT_RANGES, "bytes"),
        (header::CONTENT_LENGTH, &file_size.to_string())
    ];

    println!("header: {:?}", header);

    let response = (header, body).into_response();
    Some(response)
}

