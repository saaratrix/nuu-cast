use std::path::{PathBuf};
use std::time::Instant;
use axum::body::Bytes;
use crate::converters::subtitles_utility::{convert_srt_to_vtt, extract_srt_files_from_mkv_with_track_ids, extract_subtitle_track_ids_from_mkv};
use crate::io::file_copier::copy_converted_files;
use crate::io::file_utility::UrlAndFilePath;
use crate::io::temp_files_directory::TempFilesDirectory;

pub async fn convert_mkv(paths: &UrlAndFilePath, body: &Bytes) -> Result<Vec<PathBuf>, String> {
    let temp_directory = TempFilesDirectory::new()?;
    let start = Instant::now();
    let mkv_file = save_mkv_file(paths, &temp_directory, body).await?;
    let mkv_file_time = Instant::now();
    println!("save mkv file took {:?}", mkv_file_time.duration_since(start));
    let mp4_file = convert_mkv_to_mp4(&mkv_file, &temp_directory).await?;
    let video_fileconvert_time = Instant::now();
    println!("convert mkv to mp4 {:?}", video_fileconvert_time.duration_since(mkv_file_time));


    if !mp4_file.exists() {
        return Err("MP4 conversion failed, file does not exist".to_string());
    }

    let subtitle_paths = extract_subtitles(&mkv_file, &temp_directory).await?;
    let subtitle_paths_time = Instant::now();
    println!("extract subtitles to srt files took {:?}", subtitle_paths_time.duration_since(video_fileconvert_time));

    let vtt_paths = convert_subtitles_srt_to_vtt(&subtitle_paths).await?;
    let vtt_paths_time = Instant::now();
    println!("convert srt to vtt took {:?}", vtt_paths_time.duration_since(subtitle_paths_time));

    // Copy mp4_file and vtt_paths to the real folder.
    let mut converted_paths = vec![mp4_file];
    converted_paths.extend(vtt_paths);

    copy_converted_files(paths, &converted_paths).await?;

    let copy_converted_files_time = Instant::now();
    println!("copy files from temp to media folder took {:?}", copy_converted_files_time.duration_since(vtt_paths_time));
    // Set some kind of relations? So they can find each others.

    Ok(converted_paths)
}

async fn save_mkv_file(paths: &UrlAndFilePath, temp_files_directory: &TempFilesDirectory, body: &Bytes) -> Result<PathBuf, String> {
    let filename = paths.url.file_name().ok_or("Could not extract mkv from url")?;

    // e.g. /tmp/abc123/video.mkv
    let temp_path = temp_files_directory.path.join(filename);

    std::fs::write(&temp_path, body)
        .map_err(|e| format!("Uploaded file was not a valid mkv file. - {}", e))?;

    Ok(temp_path)
}

async fn convert_mkv_to_mp4(mkv_file: &PathBuf, temp_files_directory: &TempFilesDirectory) -> Result<PathBuf, String> {
    let stem = mkv_file.file_stem()
        .ok_or("Could not extract filename stem")?;

    let mp4_path = temp_files_directory.path.join(format!("{}.mp4", stem.to_string_lossy()));

    let output = std::process::Command::new("ffmpeg")
        // Browsers can't play DTS, TrueHD, AC3 etc.
        .args(["-i", mkv_file.to_str().unwrap(), "-map", "0:v", "-map", "0:a", "-c:v", "copy", "-c:a", "aac", mp4_path.to_str().unwrap()])
        .output()
        .map_err(|e| format!("Could not run ffmpeg - {}", e))?;

    if !output.status.success() {
        return Err("Could not convert mkv to mp4.".to_string());
    }

    Ok(mp4_path)
}

async fn extract_subtitles(mkv_file: &PathBuf, temp_files_directory: &TempFilesDirectory) -> Result<Vec<PathBuf>, String> {
    let mkv_file_str = mkv_file.to_str().unwrap();
    let filestem =  mkv_file.file_stem().unwrap().to_str().unwrap();
    let track_ids = extract_subtitle_track_ids_from_mkv(mkv_file_str).await?;

    let subtitle_paths = extract_srt_files_from_mkv_with_track_ids(mkv_file_str, filestem, &track_ids, &temp_files_directory).await?;
    Ok(subtitle_paths)
}

async fn convert_subtitles_srt_to_vtt(srt_files: &Vec<PathBuf>) -> Result<Vec<PathBuf>, String> {
    let mut result = Vec::new();
    for srt_file in srt_files.iter() {
        let output_file = srt_file.with_extension("vtt");
        let vtt_file = convert_srt_to_vtt(srt_file, &output_file)?;
        result.push(vtt_file);
    }
    Ok(result)
}