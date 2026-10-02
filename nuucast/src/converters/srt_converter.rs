use std::path::PathBuf;
use std::time::Instant;
use axum::body::Bytes;
use crate::converters::mkv_converter::convert_subtitles_to_vtt;
use crate::io::file_copier::{copy_converted_files, copy_converted_files_get_output};
use crate::io::file_utility::UrlAndFilePath;
use crate::io::temp_files_directory::TempFilesDirectory;

pub async fn convert_srt(paths: &UrlAndFilePath, body: &Bytes) -> Result<Vec<PathBuf>, String> {
    let temp_directory = TempFilesDirectory::new(None)?;
    let start = Instant::now();
    let srt_file = save_srt_file(paths, &temp_directory, body).await?;

    let srt_files = vec![srt_file];
    let vtt_paths = convert_subtitles_to_vtt(&srt_files).await?;
    let vtt_paths_time = Instant::now();
    println!("convert srt to vtt took {:?}", vtt_paths_time.duration_since(start));

    let output_paths: Vec<PathBuf> = copy_converted_files_get_output(&paths, &vtt_paths, vtt_paths_time).await?;
    Ok(output_paths)
}

async fn save_srt_file(paths: &UrlAndFilePath, temp_files_directory: &TempFilesDirectory, body: &Bytes) -> Result<PathBuf, String> {
    let filename = paths.url.file_name().ok_or("Could not extract mkv from url")?;

    // e.g. /tmp/abc123/subtitle.srt
    let temp_path = temp_files_directory.path.join(filename);

    std::fs::write(&temp_path, body)
        .map_err(|e| format!("Uploaded file was not a valid srt file. - {}", e))?;

    Ok(temp_path)
}