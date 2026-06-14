use std::path::{Component, PathBuf};
use askama::Template;
use crate::explorer::Subtitle;
use crate::html::html::{build_breadcrumbs, DirectoryTemplate, FileTemplate, Item};
use crate::io::file_utility::{get_mime_type, DirectoryChildren, MediaType, UrlAndFilePath};

pub fn get_directory_html(
    paths: &UrlAndFilePath,
    directory_items: &DirectoryChildren,
) -> String {
    let template = DirectoryTemplate {
        title: paths.url.display().to_string(),
        body_class: "explorer".to_string(),
        script_url: Some("js/directories.js".to_string()),
        breadcrumbs: build_breadcrumbs(&paths.url),
        directories: directory_items.directories.iter().map(|dir| Item {
            url: dir.url.display().to_string(),
            filepath: dir.filepath.display().to_string(),
        }).collect(),
        files: directory_items.files.iter().map(|file| Item {
            url: file.url.display().to_string(),
            filepath: file.filepath.display().to_string(),
        }).collect(),
        upload_root: paths.url.display().to_string(),
    };

    template.render().unwrap()
}

pub fn get_explore_file_html(paths: &UrlAndFilePath, subtitles: &Vec<Subtitle>, media_type: &MediaType) -> String {
    let stream_path = format!("/stream/{}", paths.url.display());

    let media_type = match media_type {
        MediaType::Image => "image",
        MediaType::Video => "video",
        MediaType::Audio => "audio",
        MediaType::Text => "text",
        MediaType::Attachment => "attachment",
    };

    let mime_type = get_mime_type(&paths.filepath);

    let subtitle_data = subtitles
        .iter()
        .flat_map(|subtitle| [
            format!("/file/{}", subtitle.path.url.display()),
            subtitle.label.clone(),
            subtitle.srclang.clone(),
        ])
        .collect::<Vec<_>>()
        .join("|");

    let template = FileTemplate {
        title: paths.url.display().to_string(),
        body_class: "viewer".to_string(),
        script_url: Some("js/file-viewer.js".to_string()),
        breadcrumbs: build_breadcrumbs(&paths.url),
        subtitles: subtitle_data,

        media_type,
        stream_path: stream_path.to_string(),
        mime_type: mime_type.to_string(),
    };

    template.render().unwrap()
}