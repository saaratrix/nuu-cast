use std::fs;
use rsubs_lib::SRT;
use std::path::PathBuf;
use tokio::process::Command;
use crate::io::temp_files_directory::TempFilesDirectory;

// Convert SRT into VTT for <video> support.
pub fn convert_srt_to_vtt(srt_file: &PathBuf, output_path: &PathBuf) -> Result<PathBuf, String> {
    let srt_content = fs::read_to_string(srt_file)
        .map_err(|e| format!("Could not read srt file: {} - error: {}", srt_file.display(), e))?;

    println!("SRT size: {} bytes", srt_content.len());

    let vtt_content = SRT::parse(&srt_content)
        .map_err(|e| format!("Failed to convert srt file: {}", e))?
        .to_vtt()
        .to_string();

    fs::write(output_path, vtt_content)
        .map_err(|e| format!("Could not write vtt file: {} - error: {}", output_path.display(), e))?;

    Ok(output_path.clone())
}

pub async fn extract_subtitle_track_ids_from_mkv(
    mkv_file: &str,
) -> Result<Vec<u16>, String> {
    let output = Command::new("mkvmerge")
        .args(["--identify", mkv_file])
        .output()
        .await
        .map_err(|e| format!("Could not run mkvmerge - {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "mkvmerge failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    let ids = stdout
        .lines()
        .filter(|line| line.contains(": subtitles"))
        .filter_map(parse_track_id)
        .collect();

    Ok(ids)
}

fn parse_track_id(line: &str) -> Option<u16> {
    // Example:
    // Track ID 2: subtitles (Woof/SRT)

    let rest = line.strip_prefix("Track ID ")?;
    let id_part = rest.split_once(':')?.0;

    id_part.parse::<u16>().ok()
}

/// We extract the subtitle as is, it can be .srt, .ass and more and then ffmpeg will convert it to vtt.
pub async fn extract_subtitle_files_from_mkv_with_track_ids(
    mkv_file: &str,
    mkv_filestem: &str,
    track_ids: &[u16],
    temp_files_directory: &TempFilesDirectory,
) -> Result<Vec<PathBuf>, String> {
    let mut paths = Vec::new();
    let mut args = vec!["tracks".to_string(), mkv_file.to_string()];

    for id in track_ids {
        let srt_path = temp_files_directory
            .path
            .join(format!("{}.{}.sub", mkv_filestem, id));

        println!("Track {} -> {}", id, srt_path.display());

        let srt_str = srt_path
            .to_str()
            .ok_or_else(|| format!("Invalid output path for track {}", id))?;

        args.push(format!("{}:{}", id, srt_str));
        paths.push(srt_path);
    }

    let output = std::process::Command::new("mkvextract")
        .args(&args)
        .output()
        .map_err(|e| format!("Could not run mkvextract: {}", e))?;

    if output.status.success() {
        Ok(paths)
    } else {
        Err(format!(
            "mkvextract failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}
