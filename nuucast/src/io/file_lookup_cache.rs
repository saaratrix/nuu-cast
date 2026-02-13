use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use crate::io::file_utility::{get_path_details, PathType};

pub struct PathCache {
    cache: Arc<RwLock<HashMap<PathBuf, PathType>>>,
}

impl PathCache {
    pub fn new() -> Self {
        Self {
            cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub fn get_path_details(&self, path: &PathBuf) -> PathType {
        if let Ok(cache) = self.cache.read() {
            if let Some(&path_type) = cache.get(path) {
                return path_type;
            }
        }

        let result = self.get_details(path);
        if let Ok(mut cache) = self.cache.write() {
            cache.insert(path.clone(), result);
        }

        result
    }

    pub fn invalidate(&self, path: &PathBuf) {
        if let Ok(mut cache) = self.cache.write() {
            cache.remove(path);
        }
    }

    pub fn clear(&self) {
        if let Ok(mut cache) = self.cache.write() {
            cache.clear();
        }
    }

    fn get_details(&self, path: &PathBuf) -> PathType {
        match fs::metadata(&path) {
            Ok(metadata) => {
                if metadata.is_file() {
                    PathType::File
                } else if metadata.is_dir() {
                    PathType::Directory
                } else {
                    PathType::Unknown
                }
            }
            Err(_) => PathType::Unknown,
        }
    }
}