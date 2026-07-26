use std::path::{Path, PathBuf};
use crate::io::file_utility::UrlAndFilePath;

/// For example an mkv file is uploaded but since browsers can't play mkv files it's converted into mp4 and subtitle files.
/// And then the mkv path is used to place the mp4 and vtt files where mkv was meant to be.
pub async fn copy_converted_files(original_paths: &UrlAndFilePath, files_to_copy: &Vec<PathBuf>) -> Result<bool, String> {
    let dest_folder = Path::new(&original_paths.filepath)
        .parent()
        .ok_or(format!("No parent folder for {}", original_paths.filepath.display()))?;

    if !dest_folder.exists() {
        std::fs::create_dir_all(dest_folder).map_err(|e| format!("Could not create folder: {}", e))?;
    }

    for file in files_to_copy {
        let filename = file
            .file_name()
            .ok_or(format!("Failed to get filename for {}", file.display()))?;
        let dest = dest_folder.join(filename);
        tokio::fs::copy(file, &dest)
            .await
            .map_err(|e| format!("Failed to copy {} to {}: {}", file.display(), dest.display(), e))?;
    }

    Ok(true)
}