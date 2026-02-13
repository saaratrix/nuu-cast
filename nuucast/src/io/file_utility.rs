use std::{env, fs};
use std::path::PathBuf;
use std::sync::LazyLock;
use crate::io::file_lookup_cache::PathCache;

pub static PROJECT_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| {
        env::var("PROJECT_ROOT")
            .map(PathBuf::from)
            .unwrap_or_else(|_| env::current_dir().unwrap())
    });

pub static MEDIA_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| PathBuf::from(&*PROJECT_ROOT).join("media"));

pub static STATIC_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| PathBuf::from(&*PROJECT_ROOT).join("static"));

static PATH_CACHE: LazyLock<PathCache> = LazyLock::new(|| PathCache::new());

pub fn get_path_from_url(url: String) -> Option<PathBuf> {
    let clean_url = url.trim_matches('/');
    let full_path = MEDIA_ROOT.join(clean_url);
    if !full_path.starts_with(MEDIA_ROOT.as_path()) {
        return None;
    }

    let result = PathBuf::from(clean_url);
    Some(result)
}

#[derive(Debug)]
#[derive(Copy, Clone)]
pub enum PathType {
    NotFound,
    Unknown,
    File,
    Directory,
}

pub fn get_path_details(path: &PathBuf) -> PathType {
    PATH_CACHE.get_path_details(path)
}

#[derive(Debug)]
pub struct DirectoryChildren {
    pub directories: Vec<PathBuf>,
    pub files: Vec<PathBuf>,
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
            directories.push(entry_path);
        } else if matches!(path_type, PathType::File) {
            files.push(entry_path);
        }
    }

    DirectoryChildren { directories, files }
}