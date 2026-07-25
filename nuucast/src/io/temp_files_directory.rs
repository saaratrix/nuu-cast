use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use rand::distr::{Alphanumeric, SampleString};
use crate::io::file_utility::TEMP_FILES_ROOT;

#[derive(Debug, Clone)]
pub struct TempFilesDirectory {
    pub key: String,
    pub path: PathBuf,
}

impl TempFilesDirectory {
    pub fn new(root: Option<&Path>) -> Result<Self, String> {
        let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        let random_part = Alphanumeric.sample_string(&mut rand::rng(), 8);
        let key = format!("{}{}", ts, random_part);
        let root = root.unwrap_or(TEMP_FILES_ROOT.as_path());
        let path = root.join(&key);
        fs::create_dir_all(&path).map_err(|e| format!("Could not create temp dir: {}", e))?;
        Ok(Self { path, key })
    }

    /// Set the key directly from temp files folder.
    pub fn set_path(key: &str) -> Result<Self, String> {
        let key = key.to_string();
        let path = TEMP_FILES_ROOT.join(&key);
        fs::create_dir_all(&path).map_err(|e| format!("Could not create temp dir: {}", e))?;
        Ok(Self { path, key })
    }

    pub fn get_files(&self) -> Result<Vec<PathBuf>, String> {
        let mut files = Vec::new();

        let entries = fs::read_dir(&self.path)
            .map_err(|e| format!("get_files(): Could not read temp dir: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("get_files(): Error reading entry: {}", e))?;
            let path = entry.path();

            if path.is_file() {
                files.push(path);
            }
        }

        Ok(files)
    }
}

impl Drop for TempFilesDirectory {
    fn drop(&mut self) {
        if let Err(e) = fs::remove_dir_all(&self.path) {
            eprintln!("Failed to clean up temp dir {:?}: {}", self.path, e);
        }
    }
}