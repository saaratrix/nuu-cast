use std::path::{Path, PathBuf};
use std::time::Instant;
use axum::body::Bytes;
use crate::converters::subtitles_utility::{extract_subtitle_files_from_mkv_with_track_ids, extract_subtitle_tracks_with_language, MkvMergeMetadataJson};
use crate::io::file_copier::copy_converted_files;
use crate::io::file_utility::{UrlAndFilePath, MEDIA_ROOT};
use crate::io::temp_files_directory::TempFilesDirectory;
use tokio::process::Command;

#[derive(Debug)]
struct AudioSelection {
    pub audio_tracks: Vec<u8>,
    pub can_copy: bool,
}

pub async fn convert_mkv(paths: &UrlAndFilePath, body: &Bytes) -> Result<Vec<PathBuf>, String> {
    let temp_directory = TempFilesDirectory::new(None)?;
    let start = Instant::now();
    let mkv_file = save_mkv_file(paths, &temp_directory, body).await?;
    let mkv_file_time = Instant::now();
    println!("save mkv file took {:?}", mkv_file_time.duration_since(start));

    let metadata = get_metadata(&mkv_file).await?;
    let metadata_file_time = Instant::now();
    println!("get metadata took {:?}", metadata_file_time.duration_since(mkv_file_time));

    let mp4_file = convert_mkv_to_mp4(&mkv_file, &metadata, &temp_directory).await?;
    let video_fileconvert_time = Instant::now();
    println!("convert mkv to mp4 {:?}", video_fileconvert_time.duration_since(metadata_file_time));

    if !mp4_file.exists() {
        return Err("MP4 conversion failed, file does not exist".to_string());
    }

    let subtitle_paths = extract_subtitles(&mkv_file, &metadata, &temp_directory).await?;
    let subtitle_paths_time = Instant::now();
    println!("extract subtitles ({}) to srt files took {:?}", subtitle_paths.len() , subtitle_paths_time.duration_since(video_fileconvert_time));

    let vtt_paths = convert_subtitles_to_vtt(&subtitle_paths).await?;
    let vtt_paths_time = Instant::now();
    println!("convert srt to vtt took {:?}", vtt_paths_time.duration_since(subtitle_paths_time));

    // Copy mp4_file and vtt_paths to the real folder.
    let mut converted_paths = vec![mp4_file];
    converted_paths.extend(vtt_paths);

    copy_converted_files(paths, &converted_paths).await?;

    let copy_converted_files_time = Instant::now();
    println!("copy files from temp to media folder took {:?}", copy_converted_files_time.duration_since(vtt_paths_time));
    // Set some kind of relations? So they can find each others.

    let directory = paths.url.parent().unwrap_or_else(|| {
        panic!("paths.url {} should have a parent", paths.url.display())
    });

    let output_paths: Vec<PathBuf> = converted_paths
        .iter()
        .map(|p| {
            directory.join(
                p.file_name().unwrap_or_else(|| {
                    panic!("converted path {} should have a filename", p.display())
                })
            )
        })
        .collect();

    Ok(output_paths)
}

async fn save_mkv_file(paths: &UrlAndFilePath, temp_files_directory: &TempFilesDirectory, body: &Bytes) -> Result<PathBuf, String> {
    let filename = paths.url.file_name().ok_or("Could not extract mkv from url")?;

    // e.g. /tmp/abc123/video.mkv
    let temp_path = temp_files_directory.path.join(filename);

    std::fs::write(&temp_path, body)
        .map_err(|e| format!("Uploaded file was not a valid mkv file. - {}", e))?;

    Ok(temp_path)
}

async fn convert_mkv_to_mp4(mkv_file: &PathBuf, metadata: &MkvMergeMetadataJson, temp_files_directory: &TempFilesDirectory) -> Result<PathBuf, String> {
    println!("starting converting {} to mp4...", mkv_file.display());

    let stem = mkv_file.file_stem()
        .ok_or("Could not extract filename stem")?;

    let mp4_path = temp_files_directory.path.join(format!("{}.mp4", stem.to_string_lossy()));
    let audio_metadata = get_audio_tracks_metadata(metadata, &["en", "ja"])?;

    let mut args: Vec<String> = vec![
        "-i".to_string(),
        mkv_file.to_str().unwrap().to_string(),
        "-map".to_string(),
        "0:v:0".to_string(),
    ];

    // Removing unwanted audio tracks can reduce file size significantly
    if !audio_metadata.audio_tracks.is_empty() {
        for audio_track in &audio_metadata.audio_tracks {
            let audio_track_arg = format!("0:a:{audio_track}");
            args.extend(["-map".to_string(), audio_track_arg]);
        }
    }

    if !should_convert_video_codec(metadata)? {
        // ffmpeg -y -i "input.mkv" -map 0:v -map 0:a -c:v copy -c:a copy
        args.extend([
            "-c:v".to_string(),
            "copy".to_string()
        ]);
    } else {
        // ffmpeg -y -i "input.mkv" -map 0:v:0 -map '0:a' -c:v libx264 -preset fast -crf 25 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "output-h264.mp4"
        args.extend([
            "-c:v".to_string(),
            "libx264".to_string(),
            "-preset".to_string(),
            "fast".to_string(),
            "-crf".to_string(),
            "25".to_string(),
            "-pix_fmt".to_string(),
            "yuv420p".to_string(),
            "-movflags".to_string(),
            "+faststart".to_string()
        ]);
    }
    if !audio_metadata.audio_tracks.is_empty() {
        if audio_metadata.can_copy {
            args.extend(["-c:a".to_string(), "copy".to_string()]);
        } else {
            args.extend([
                "-c:a".to_string(),
                "aac".to_string(),
                "-b:a".to_string(),
                "128k".to_string()
            ]);
        }
    }


    args.push(mp4_path.to_str().unwrap().to_string());

    let output = std::process::Command::new("ffmpeg")
        // Browsers can't play DTS, TrueHD, AC3 etc.
        .args(&args)
        .output()
        .map_err(|e| format!("Could not run ffmpeg - {}", e))?;

    if !output.status.success() {
        return Err("Could not convert mkv to mp4.".to_string());
    }

    Ok(mp4_path)
}

fn should_convert_video_codec(metadata: &MkvMergeMetadataJson) -> Result<bool, String> {
    let video_track = metadata
        .tracks
        .iter()
        .find(|track| track.kind == "video")
        .ok_or_else(|| "No video track found".to_string())?;

    Ok(video_track.codec == "V_MPEGI/ISO/VVC")
}

pub fn get_audio_tracks_metadata(
    metadata: &MkvMergeMetadataJson,
    wanted_languages: &[&str],
) -> Result<AudioSelection, String> {
    let mut audio_tracks = Vec::new();
    let mut can_copy = true;
    let mut audio_index: u8 = 0;

    for track in &metadata.tracks {
        if track.kind != "audio" {
            continue;
        }

        let language = track
            .properties
            .language_ietf
            .as_deref()
            .unwrap_or("");

        if wanted_languages.contains(&language) {
            audio_tracks.push(audio_index);

            // AAC is safe to copy into MP4.
            // Extend this list if you want to support more codecs.
            if !is_mp4_audio_codec(&track.codec) {
                can_copy = false;
            }
        }

        audio_index += 1;
    }

    Ok(AudioSelection {
        audio_tracks,
        can_copy,
    })
}

fn is_mp4_audio_codec(codec: &str) -> bool {
    matches!(
        codec,
        "AAC"
            | "MP3"
            | "AC-3"
            | "E-AC-3"
            | "ALAC"
    )
}

async fn get_metadata(mkv_file: &PathBuf) -> Result<MkvMergeMetadataJson, String> {
    let mkv_file_str = mkv_file.to_str().unwrap();

    let output = Command::new("mkvmerge")
        .args(["-J", mkv_file_str])
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

    let metadata: MkvMergeMetadataJson = serde_json::from_slice(&output.stdout).unwrap();
    Ok(metadata)
}

async fn extract_subtitles(mkv_file: &PathBuf, metadata: &MkvMergeMetadataJson, temp_files_directory: &TempFilesDirectory) -> Result<Vec<PathBuf>, String> {
    let mkv_file_str = mkv_file.to_str().unwrap();
    let filestem =  mkv_file.file_stem().unwrap().to_str().unwrap();
    // let track_ids = extract_subtitle_track_ids_from_mkv(mkv_file_str).await?;
    let tracks = extract_subtitle_tracks_with_language(metadata).await?;

    println!("found {} track_ids from mkv file: {}", tracks.len(), mkv_file_str);

    let subtitle_paths = extract_subtitle_files_from_mkv_with_track_ids(mkv_file_str, filestem, &tracks, &temp_files_directory).await?;

    Ok(subtitle_paths)
}

pub async fn convert_subtitles_to_vtt(
    subtitle_files: &Vec<PathBuf>,
) -> Result<Vec<PathBuf>, String> {
    let mut vtt_files = Vec::new();

    for input_file in subtitle_files {
        let output_file = input_file.with_extension("vtt");

        let output = Command::new("ffmpeg")
            .arg("-y")
            .arg("-i")
            .arg(input_file)
            .arg(&output_file)
            .output()
            .await
            .map_err(|e| {
                format!(
                    "Failed to start ffmpeg for {}: {}",
                    input_file.display(),
                    e
                )
            })?;

        if !output.status.success() {
            return Err(format!(
                "ffmpeg failed converting {}\nstderr:\n{}",
                input_file.display(),
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        vtt_files.push(output_file);
    }

    Ok(vtt_files)
}