use std::io;
use std::path::PathBuf;
use std::sync::LazyLock;
use std::time::{Duration, SystemTime};
use axum::body::Body;
use axum::http::{header};
use axum::response::{IntoResponse, Response};
use tokio::fs::File;
use tokio_util::io::ReaderStream;
use url::Url;
use crate::data_utility::data_utility::{DATA_ROOT,};

pub static DATA_ANIME_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| PathBuf::from(&*DATA_ROOT).join("anime"));

pub static DATA_ANI_LIST_IMAGE_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| PathBuf::from(&*DATA_ROOT).join("anime").join("images").join("ani_list"));

#[derive(Debug, Clone, Default)]
pub struct CacheOptions {
    pub cache_prefix: Option<String>,
    pub ignore_cache: bool,
    pub ttl: Option<Duration>,
}

pub fn get_cache_key(url: &Url) -> Option<String> {
    let segments = url.path_segments()?;

    let mut segments_key = segments.map(|s| s.to_string())
        .collect::<Vec<_>>()
        .join("");

    let sanitized_query = url.query().unwrap_or_else(||"").replace(&['&', '[', '?', '<', '>', ':', '*', '/', '\\', '|', '"'][..], "");

    segments_key.push_str(&sanitized_query);

    Some(
        segments_key
    )
}

pub fn get_cache_key_path_from_url(url: &Url, prefix: Option<&str>) -> Option<PathBuf> {
    let cache_key = get_cache_key(url)?;
    get_cache_key_path(&cache_key, prefix)
}

pub fn get_cache_key_path(cache_key: &str, prefix: Option<&str>) -> Option<PathBuf> {
    match prefix {
        Some(prefix) if !prefix.is_empty() => {
            Some(DATA_ANIME_ROOT.join(prefix).join(cache_key))
        }
        _ => Some(DATA_ANIME_ROOT.join(cache_key)),
    }
}

pub async fn try_get_cached_request_json(url: &Url, options: &CacheOptions) -> Option<String> {
    let cache_key = get_cache_key(url);
    println!("cache key: {:?}", cache_key);
    try_get_cached_result(cache_key, options).await
}

pub async fn try_get_cached_result(cache_key: Option<String>, options: &CacheOptions) -> Option<String> {
    if let Some(key) = cache_key {
        let path = get_cache_key_path(&key, options.cache_prefix.as_deref())?;

        let metadata = match tokio::fs::metadata(&path).await {
            Ok(metadata) => metadata,
            Err(_) => return None,
        };


        if let Some(ttl) = options.ttl {
            if let Ok(modified) = metadata.modified() {
                if let Ok(age) = SystemTime::now().duration_since(modified) {
                    if age > ttl {
                        return None;
                    }
                }
            }
        }

        return match tokio::fs::read_to_string(path.clone()).await {
            Ok(content) => Some(content),
            Err(e) => {
                println!("Failed to read cache file for path: {} error {}", &path.display(), e);
                None
            },
        };
    }
    None
}

pub async fn add_cached_request_json(url: &Url, cache_prefix: Option<&str>, response: &str) -> io::Result<()> {
    println!("add cached request {}", &url);

    let path = get_cache_key_path_from_url(&url, cache_prefix).unwrap_or_else(|| PathBuf::new());
    println!("add_cached_request cache file path {}", path.display());

    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await.map_err(|e| {
            io::Error::new(e.kind(), format!("Parent directory creation failed: {:?}", e))
        })?;
    }

    tokio::fs::write(path, response).await?;
    Ok(())
}

pub async fn add_cached_result_json(cache_key: &str, cache_prefix: Option<&str>, response: &str) -> io::Result<()> {
    println!("add cached result {}", &cache_key);

    let path = get_cache_key_path(&cache_key, cache_prefix).unwrap_or_else(|| PathBuf::new());
    println!("add_cached_result_json cache file path {}", path.display());

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
        (header::CONTENT_LENGTH, &file_size.to_string()),
        (header::CACHE_CONTROL, "public, max-age=31536000, immutable"),
    ];

    let response = (header, body).into_response();
    Some(response)
}

pub fn get_ani_list_image_path_from_url(id: u32, url: &Url) -> Option<(PathBuf, &str)> {
    let host = url.host_str()?;
    if !host.ends_with("anilist.co") {
        return None;
    }

    let path = url.path();
    let image_type = if path.contains("/anime/banner/") {
        "banner"
    } else if path.contains("/anime/cover/medium/") {
        "medium"
    } else if path.contains("/anime/cover/large/") {
        "large"
    } else {
        return None;
    };

    let extension = path.rsplit('.').next()?;

    let path = DATA_ANI_LIST_IMAGE_ROOT
        .join(id.to_string())
        .join(format!("{image_type}.{extension}"));

    Some((path, extension))
}

pub async fn try_get_cached_ani_list_image(
    id: u32,
    url: &Url,
) -> Option<Response> {
    let (path, extension) = match get_ani_list_image_path_from_url(id, &url) {
        Some(val) => val,
        None => return None,
    };
    
    let file = match File::open(path).await {
        Ok(f) => f,
        Err(_) => return None,
    };

    let file_size = match file.metadata().await {
        Ok(meta) => meta.len(),
        Err(_) => return None,
    };

    let stream = ReaderStream::new(file);
    let body = Body::from_stream(stream);

    let mime_type = match extension {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp",
        _ => return None,
    };

    Some(
        (
            [
                (header::CONTENT_TYPE, mime_type.to_owned()),
                (header::ACCEPT_RANGES, "bytes".to_owned()),
                (header::CONTENT_LENGTH, file_size.to_string()),
                (
                    header::CACHE_CONTROL,
                    "public, max-age=31536000, immutable".to_owned(),
                ),
            ],
            body,
        )
            .into_response(),
    )
}

