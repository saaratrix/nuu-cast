use std::path::PathBuf;
use tokio::process::Command;
use serde::Deserialize;
use crate::io::temp_files_directory::TempFilesDirectory;

/// We extract the subtitle as is, it can be .srt, .ass and more and then ffmpeg will convert it to vtt.
pub async fn extract_subtitle_files_from_mkv_with_track_ids(
    mkv_file: &str,
    mkv_filestem: &str,
    // track_ids: &[u16],
    tracks: &[SubtitleTrack],
    temp_files_directory: &TempFilesDirectory,
) -> Result<Vec<PathBuf>, String> {
    let mut paths = Vec::new();
    let mut args = vec!["tracks".to_string(), mkv_file.to_string()];

    for track in tracks {
        if !matches!(track.language.as_str(), "en" | "fi" | "sv") {
            continue;
        }

        let srt_path = temp_files_directory
            .path
            .join(format!("{}.{}.sub", mkv_filestem, track.language));

        println!("Track {} -> {}", track.track_id, srt_path.display());

        let srt_str = srt_path
            .to_str()
            .ok_or_else(|| format!("Invalid output path for track {}", track.track_id))?;

        args.push(format!("{}:{}", track.track_id, srt_str));
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

#[derive(Debug, Deserialize)]
struct MkvMergeJson {
    tracks: Vec<Track>,
}

#[derive(Debug, Deserialize)]
struct Track {
    id: u16,

    #[serde(rename = "type")]
    kind: String,

    properties: Properties,
}

#[derive(Debug, Deserialize)]
struct Properties {
    language_ietf: Option<String>,
}

#[derive(Debug)]
pub struct SubtitleTrack {
    track_id: u16,
    language: String,
}

pub async fn extract_subtitle_tracks_with_language(
    mkv_file: &str,
) -> Result<Vec<SubtitleTrack>, String> {
    let output = Command::new("mkvmerge")
        .args(["-J", mkv_file])
        .output()
        .await
        .map_err(|e| format!("Could not run mkvmerge - {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "mkvmerge failed: {}",
            String::from_utf8_lossy(&output.stderr)
        )
            .into());
    }

    let parsed: MkvMergeJson = serde_json::from_slice(&output.stdout).unwrap();

    let subtitles = parsed
        .tracks
        .into_iter()
        .filter(|track| track.kind == "subtitles")
        .filter_map(|track| {
            track.properties.language_ietf.map(|language| SubtitleTrack {
                track_id: track.id,
                language,
            })
        })
        .collect();

    Ok(subtitles)
}
