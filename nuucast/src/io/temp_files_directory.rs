use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use rand::distr::{Alphanumeric, SampleString};
use crate::io::file_utility::TEMP_FILES_ROOT;

#[derive(Debug, Clone)]
pub struct TempFilesDirectory {
    pub path: PathBuf,
}

impl TempFilesDirectory {
    pub fn new() -> Result<Self, String> {
        let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        let random_part = Alphanumeric.sample_string(&mut rand::rng(), 8);
        let name = format!("{}{}", ts, random_part);
        let path = TEMP_FILES_ROOT.join(name);
        fs::create_dir_all(&path).map_err(|e| format!("Could not create temp dir: {}", e))?;
        Ok(Self { path })
    }

    /// Set the key directly from temp files folder.
    pub fn set_path(key: &str) -> Result<Self, String> {
        let path = TEMP_FILES_ROOT.join(key);
        fs::create_dir_all(&path).map_err(|e| format!("Could not create temp dir: {}", e))?;
        Ok(Self { path })
    }
}

impl Drop for TempFilesDirectory {
    fn drop(&mut self) {
        if let Err(e) = fs::remove_dir_all(&self.path) {
            eprintln!("Failed to clean up temp dir {:?}: {}", self.path, e);
        }
    }
}