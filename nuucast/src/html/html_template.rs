use std::path::PathBuf;
use crate::io::file_utility::{get_mime_type, DirectoryChildren, MediaType, UrlAndFilePath};

pub fn get_html(title: &str, body_class: &str, scripts_url: Option<&str>, url: &PathBuf, content: &str) -> String {
    let scripts = scripts_url.map_or(String::new(), |url| {
        format!(r#"<script src="/static/{url}" type="module"></script>"#)
    });

    let navbar = get_navbar(url);

    format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="stylesheet" href="/static/style.css">
    <script src="/static/js/app.js" type="module" ></script>
</head>
<body class="{body_class}">
    {navbar}
    {content}
    {scripts}
</body>
</html>"#)
}

pub fn get_navbar(url: &PathBuf) -> String {
    let mut breadcrumbs = String::new();
    let mut accumulated_path = PathBuf::new();

    breadcrumbs.push_str(r#"<a class="breadcrumb-link" href="/">Home</a>"#);
    for component in url.components() {
        if let std::path::Component::Normal(segment) = component {
            accumulated_path.push(segment);
            let segment_str = segment.to_string_lossy();
            let path_str = accumulated_path.display();

            breadcrumbs.push_str(&format!(r#" / <a class="breadcrumb-link" href="/{path_str}">{segment_str}</a>"#));
        }
    }

    format!(r#"<nav class="navbar">{breadcrumbs}</nav>"#)
}

pub fn get_file_html(paths: &UrlAndFilePath, media_type: &MediaType) -> String {
    let content = get_file_content_html(paths, media_type);
    let title = paths.url.display().to_string();

    let html = get_html(&title, "viewer", Some("js/file-viewer.js"), &paths.url, &content);
    html
}

fn get_file_content_html(paths: &UrlAndFilePath, media_type: &MediaType) -> String {
    let stream_path = format!("/stream/{}", paths.url.display());
    let item_html = match media_type {
        MediaType::Image => format!(r#"<img src="{stream_path}" >"#),
        MediaType::Video => {
            let mime_type = get_mime_type(&paths.filepath);
            format!(r#"<video autoplay="true" controls><source src="{stream_path}" type=""{mime_type}></video>"#)
        },
        MediaType::Audio => format!("Not implemented"),
        MediaType::Text => format!("Not implemented."),
        MediaType::Attachment => format!("Not implemented")
    };

    item_html
}

pub fn get_directory_html(paths: &UrlAndFilePath, directory_items: &DirectoryChildren) -> String {
    let title = paths.url.display().to_string();
    let content = get_directory_content_html(paths, directory_items);
    let html = get_html(&title, "explorer", Some("js/directories.js"), &paths.url, &content);
    html
}

fn get_directory_content_html(paths: &UrlAndFilePath, directory_items: &DirectoryChildren) -> String {
    let mut output = String::from(r#"<ul class="item-list">"#);

    // Render directories
    for dir in &directory_items.directories {
        let item_html = render_directory_file_item_html(
            &dir.url.display().to_string(),
            &dir.filepath.display().to_string(),
            "directory"
        );
        output.push_str(&item_html);
    }

    // Render files
    for file in &directory_items.files {
        let item_html = render_directory_file_item_html(
            &file.url.display().to_string(),
            &file.filepath.display().to_string(),
            "file"
        );
        output.push_str(&item_html);
    }

    output.push_str("</ul>");

    let upload_form_html = get_directory_upload_form_html(paths);
    output.push_str(&upload_form_html);

    output
}

fn render_directory_file_item_html(url: &str, filepath: &str, item_type: &str) -> String {
    format!(r#"<li class="item-card item-{item_type}">
        <a class="item-body" href="{url}" data-file-path="{filepath}">
            <img src="static/img/{item_type}.svg" alt="{item_type} image for {url}">
            {url}
        </a>
        <div class="item-actions">
            <form class="delete-form" method="POST" action="delete_path/{url}">
                <input type="hidden" name="_method" value="DELETE">
                <input type="submit" value="Delete">
            </form>
        </div>
    </li>
"#
    )
}

fn get_directory_upload_form_html(paths: &UrlAndFilePath) -> String {
    let url = paths.url.display();
    format!(r#"
<form id="upload-form" method="POST" enctype="multipart/form-data" class="upload-form hidden">
    <input id="upload-root" type="hidden" name="root" value="{url}">
    <input type="hidden" name="_method" value="PUT">
    <div class="upload-file upload-group" title="Select file to add to upload.">
        <label for="upload-file-input">File:</label>
        <input id="upload-file-input" type="file" name="file" required>
    </div>
    <div class="upload-name upload-group">
        <label for="upload-name-input">Name:</label>
        <input id="upload-name-input" type="text" name="name" placeholder="filename" required>
    </div>
    <p class="upload-information hidden"></p>
    <button class="upload-button" type="submit">Upload</button>
</form>"#)
}