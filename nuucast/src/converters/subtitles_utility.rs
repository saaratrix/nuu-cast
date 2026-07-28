use std::collections::HashMap;
use std::path::PathBuf;
use tokio::process::Command;
use serde::Deserialize;
use crate::io::temp_files_directory::TempFilesDirectory;

/// We extract the subtitle as is, it can be .srt, .ass and more and then ffmpeg will convert it to vtt.
pub async fn extract_subtitle_files_from_mkv_with_track_ids(
    mkv_file: &str,
    mkv_filestem: &str,
    // track_ids: &[u16],
    tracks: &[SubtitleTrack<'_>],
    temp_files_directory: &TempFilesDirectory,
) -> Result<Vec<PathBuf>, String> {
    let mut paths = Vec::new();
    let mut args = vec!["tracks".to_string(), mkv_file.to_string()];

    let mut found_tracks: HashMap<&str, u8> = HashMap::new();

    let mut should_convert = 0;
    let mut checked = tracks.len();
    for track in tracks {
        checked -= 1;
        if !matches!(track.language, "en" | "fi" | "sv") {
            continue;
        }

        should_convert += 1;

        *found_tracks.entry(&track.language).or_insert(0) += 1;

        let collisions = *found_tracks
            .get(track.language)
            .unwrap();

        let track_collision = if collisions == 1 {
            String::new()
        } else {
            format!(".{collisions}")
        };

        let srt_path = temp_files_directory
            .path
            .join(format!("{}.{}{}.sub", mkv_filestem, track.language, track_collision));

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

    let status_code = output.status.code();
    match output.status.code() {
        Some(0) => Ok(paths),
        // Mkvextract can be successful but return error code giving warnings.
        Some(1) => {
            println!("mkvextract succeeded but had warnings: {}", mkv_file);
            Ok(paths)
        }
        _ => Err(format!(
            "mkvextract failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}

#[derive(Debug, Deserialize)]
pub struct MkvMergeMetadataJson {
    pub tracks: Vec<Track>,
}

#[derive(Debug, Deserialize)]
pub struct Track {
    pub id: u16,

    pub codec: String,

    #[serde(rename = "type")]
    pub kind: String,

    pub properties: Properties,
}

#[derive(Debug, Deserialize)]
pub struct Properties {
    pub language_ietf: Option<String>,
}

#[derive(Debug)]
pub struct SubtitleTrack<'a> {
    track_id: u16,
    language: &'a str,
}

pub async fn extract_subtitle_tracks_with_language(
    metadata: &MkvMergeMetadataJson,
) -> Result<Vec<SubtitleTrack>, String> {


    let subtitles = metadata
        .tracks
        .iter()
        .filter(|track| track.kind == "subtitles")
        .filter_map(|track| {
            track.properties.language_ietf.as_ref().map(|language| SubtitleTrack {
                track_id: track.id,
                language,
            })
        })
        .collect();

    Ok(subtitles)
}
