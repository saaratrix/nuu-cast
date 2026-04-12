use std::fs;
use rsubs_lib::SRT;
use std::path::PathBuf;
use tokio::process::Command;
use crate::io::temp_files_directory::TempFilesDirectory;

// Convert SRT into VTT for <video> support.
pub fn convert_srt_to_vtt(srt_file: &PathBuf, output_path: &PathBuf) -> Result<PathBuf, String> {
    let srt_content = fs::read_to_string(srt_file)
        .map_err(|e| format!("Could not read srt file: {} - error: {}", srt_file.display(), e))?;

    let vtt_content = SRT::parse(&srt_content)
        .map_err(|e| format!("Failed to convert srt file: {}", e))?
        .to_vtt()
        .to_string();

    fs::write(output_path, vtt_content)
        .map_err(|e| format!("Could not write vtt file: {} - error: {}", output_path.display(), e))?;

    Ok(output_path.clone())
}

pub async fn extract_subtitle_track_ids_from_mkv(mkv_file: &str) -> Result<Vec<u16>, String> {
    let result = Vec::new();
    let output = Command::new("mkvmerge")
        .args(["-J", mkv_file])
        .output()
        .await
        .map_err(|e| format!("Could not run mkvmerge - {}", e))?;

    // Now parse the ids into integers.

    Ok(result)
}

pub async fn extract_srt_files_from_mkv_with_track_ids(mkv_file: &str, mkv_filestem: &str, track_ids: &Vec<u16>, temp_files_directory: &TempFilesDirectory) -> Result<Vec<PathBuf>, String> {
    let mut result = Vec::new();

    for id in track_ids {
        let srt_path = temp_files_directory.path.join(format!("{}.{}.srt", mkv_filestem, id));
        let track_arg = format!("{}:{}", id, srt_path.to_str().unwrap());

        let output = std::process::Command::new("mkvextract")
            .args(["tracks", mkv_file, &track_arg])
            .output()
            .map_err(|e| format!("Could not extract subtitle track {} - {}", id, e))?;

        if output.status.success() {
            result.push(srt_path);
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            eprintln!("Failed to extract subtitle track {}: {}", id, stderr);
        }
    }

    Ok(result)
}
