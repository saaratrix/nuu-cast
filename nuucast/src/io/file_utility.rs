use std::{env, fs};
use std::path::{Component, PathBuf};
use std::sync::LazyLock;
use crate::io::file_lookup_cache::PathCache;

pub static PROJECT_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| {
        env::var("PROJECT_ROOT")
            .map(PathBuf::from)
            .unwrap_or_else(|_| env::current_dir().unwrap()).canonicalize().unwrap()
    });

pub static MEDIA_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| PathBuf::from(&*PROJECT_ROOT).join("media"));

pub static STATIC_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| PathBuf::from(&*PROJECT_ROOT).join("static"));

static PATH_CACHE: LazyLock<PathCache> = LazyLock::new(|| PathCache::new());

#[derive(Debug, Clone)]
pub struct UrlAndFilePath {
    pub url: PathBuf,
    pub filepath: PathBuf,
}

pub fn get_url_and_filepath_from_url(url: &str) -> Option<UrlAndFilePath> {
    let clean_url = url.trim_matches('/');

    let mut filepath = MEDIA_ROOT.clone();
    for component in PathBuf::from(clean_url).components() {
        if let Component::Normal(segment) = component {
            filepath.push(segment);
        } else {
            return None; // Reject anything suspicious
        }
    }

    Some(UrlAndFilePath {
        url: PathBuf::from(clean_url),
        filepath,
    })
}

pub fn get_url_and_filepath_from_path(path: &PathBuf) -> Option<UrlAndFilePath> {
    let canonical = path.canonicalize().ok()?;

    if !canonical.starts_with(MEDIA_ROOT.as_path()) {
        return None;
    }

    let relative = canonical.strip_prefix(MEDIA_ROOT.as_path()).ok()?;

    Some(UrlAndFilePath {
        url: relative.to_path_buf(),
        filepath: canonical,
    })
}

#[derive(Debug, Copy, Clone)]
pub enum PathType {
    NotFound,
    Unknown,
    File,
    Directory,
}

pub fn get_path_details(path: &PathBuf) -> PathType {
    PATH_CACHE.get_path_details(path)
}

#[derive(Debug, Clone)]
pub struct DirectoryChildren {
    pub directories: Vec<UrlAndFilePath>,
    pub files: Vec<UrlAndFilePath>,
}

pub fn get_directory_children(path: &PathBuf) -> DirectoryChildren {
    let mut directories = Vec::new();
    let mut files = Vec::new();

    if !path.is_dir() {
        return DirectoryChildren { directories, files }
    }

    let entries = match fs::read_dir(path) {
        Ok(e) => e,
        Err(_) => return DirectoryChildren { directories, files },
    };
    for entry in entries.flatten() {
        let entry_path = entry.path();
        let path_type = PATH_CACHE.get_path_details(&entry_path);
        if matches!(path_type, PathType::Directory) {
            if let Some(paths) = get_url_and_filepath_from_path(&entry_path) {
                directories.push(paths);
            }
        } else if matches!(path_type, PathType::File) {
            if let Some(paths) = get_url_and_filepath_from_path(&entry_path) {
                files.push(paths);
            }
        }
    }

    DirectoryChildren { directories, files }
}

#[derive(Debug, Clone)]
pub enum MediaType {
    Image,
    Video,
    Audio,
    Text,
    // File attachment, meaning it gets downloaded.
    Attachment,
}

pub fn get_media_type(path: &PathBuf) -> MediaType {
    match path.extension().and_then(|s| s.to_str()) {
        Some("jpg") | Some("jpeg") | Some("png") | Some("gif") | Some("webp") | Some("bmp") | Some("svg") | Some("avif") => MediaType::Image,
        Some("mp4") | Some("webm") | Some("mkv") | Some("avi") | Some("mov") => MediaType::Video,
        Some("mp3") | Some("wav") | Some("flac") | Some("ogg") | Some("m4a") | Some("aac") => MediaType::Audio,
        Some("txt") | Some("srt") | Some("vtt") => MediaType::Text,
        _ => MediaType::Attachment,
    }
}

pub fn get_mime_type(path: &PathBuf) -> &'static str {
    match path.extension().and_then(|s| s.to_str()) {
        // Images
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("png") => "image/png",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        Some("bmp") => "image/bmp",
        Some("svg") => "image/svg+xml",
        Some("avif") => "image/avif",
        // Videos
        Some("mp4") => "video/mp4",
        Some("webm") => "video/webm",
        Some("mkv") => "video/webm", //"video/x-matroska",
        Some("avi") => "video/x-msvideo",
        Some("mov") => "video/quicktime",
        // Audio
        Some("mp3") => "audio/mpeg",
        Some("wav") => "audio/wav",
        Some("flac") => "audio/flac",
        Some("ogg") => "audio/ogg",
        Some("m4a") => "audio/mp4",
        Some("aac") => "audio/aac",
        // Text
        Some("txt") => "text/plain",
        Some("srt") => "text/plain",
        Some("vtt") => "text/plain",
        _ => "application/octet-stream",
    }
}