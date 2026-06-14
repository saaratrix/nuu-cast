use std::path::{Path, PathBuf};
use axum::{
    extract::Path as AxumPath,
    http::StatusCode,
    response::{
        IntoResponse,
        Response,
        Html,
        Redirect
    }
};

use crate::io::file_utility::{get_url_and_filepath_from_url, get_path_details, get_directory_children, PathType, MediaType, UrlAndFilePath, get_media_type, get_mime_type, MEDIA_ROOT, get_files_of_types};
use crate::html::html_template::{get_directory_html, get_explore_file_html};

pub async fn explore_path_root() -> impl IntoResponse {
    let paths = UrlAndFilePath { url: PathBuf::new(), filepath: MEDIA_ROOT.clone() };
    explore_path(paths).await
}

pub async fn explore_path_wildcard(AxumPath(url) : AxumPath<String>
) -> impl IntoResponse {
    let result = get_url_and_filepath_from_url(&url).unwrap_or_else(|| UrlAndFilePath { url: PathBuf::new(), filepath: MEDIA_ROOT.clone() });
    explore_path(result).await
}

async fn explore_path(paths: UrlAndFilePath) -> impl IntoResponse {
    // Check if at index/root
    if paths.url.as_os_str().is_empty() || paths.url == PathBuf::from("/") {
        return explore_directory(&paths).await;
    }

    // Check cache/filesystem
    match get_path_details(&paths.filepath) {
        PathType::File => explore_file(&paths).await,
        PathType::Directory => return explore_directory(&paths).await,
        PathType::Unknown | PathType::NotFound => {
            // Path doesn't exist, redirect to index
            Redirect::temporary("/").into_response()
        }
    }
}

async fn explore_file(paths: &UrlAndFilePath) -> Response {
    let media_type = get_media_type(&paths.filepath);
    let subtitles =  try_get_subtitles(paths, &media_type);
    let html = get_explore_file_html(paths, &subtitles, &media_type);

    Html(html).into_response()
}

async fn explore_directory(paths: &UrlAndFilePath) -> Response {
    let directory_items = get_directory_children(&paths.filepath);

    let html = get_directory_html(paths, &directory_items);
    (StatusCode::OK, Html(html)).into_response()
}

#[derive(Debug, Clone)]
pub struct Subtitle {
    pub path: UrlAndFilePath,
    pub srclang: String,
    pub label: String,
}

fn language_label(code: &str) -> String {
    match code {
        "en" => "English",
        "fi" => "Finnish",
        "sv" => "Swedish",
        other => other,
    }
        .to_string()
}

fn parse_subtitle_lang(path: &Path) -> Option<(String, String)> {
    let filename = path.file_name()?.to_str()?;

    if !filename.ends_with(".vtt") {
        return None;
    }

    // "movie.en.vtt" -> ["movie", "en", "vtt"]
    let parts: Vec<&str> = filename.split('.').collect();

    if parts.len() < 3 {
        return None;
    }

    let srclang = parts[parts.len() - 2].to_lowercase();
    let label = language_label(&srclang);

    Some((srclang, label))
}

pub fn try_get_subtitles(
    paths: &UrlAndFilePath,
    media_type: &MediaType,
) -> Vec<Subtitle> {
    if *media_type != MediaType::Video {
        return Vec::new();
    }

    let Some(dir) = paths.filepath.parent() else {
        return Vec::new();
    };

    let files = get_files_of_types(&dir.to_path_buf(), &["vtt"]);
    let video_stem = paths.filepath.file_stem().and_then(|s| s.to_str());

    let matching = |path: &UrlAndFilePath| {
        video_stem.is_some_and(|media_stem| {
            path.filepath
                .file_stem()
                .and_then(|s| s.to_str())
                .is_some_and(|sub_stem| sub_stem.starts_with(media_stem))
        })
    };

    let has_matching_subtitles = files.iter().any(matching);

    files
        .into_iter()
        .filter(|path| !has_matching_subtitles || matching(path))
        .filter_map(|path| {
            let (srclang, label) = parse_subtitle_lang(&path.filepath)?;

            let label = if has_matching_subtitles {
                label
            } else {
                path.filepath
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .map(|stem| format!("{stem} - {label}"))
                    .unwrap_or(label)
            };

            Some(Subtitle {
                path,
                srclang,
                label,
            })
        })
        .collect()
}