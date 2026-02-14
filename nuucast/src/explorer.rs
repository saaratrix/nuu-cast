use std::path::{ PathBuf, Path };
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

use crate::io::file_utility::{get_url_and_filepath_from_url, get_path_details, get_directory_children, PathType, MediaType, UrlAndFilePath, get_media_type, get_mime_type, MEDIA_ROOT};
use crate::html::html_template::get_directory_html;

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
    let stream_path = format!("/stream/{}", paths.url.display());
    let media_type = get_media_type(&paths.filepath);

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

    let html = format!(
        r#"<html>
<body>
    <h1>File: {}</h1>
    {}
</body>
</html>"#,
        paths.url.display(),
        item_html
    );

    Html(html).into_response()
}

async fn explore_directory(paths: &UrlAndFilePath) -> Response {
    let directory_items = get_directory_children(&paths.filepath);

    let title = paths.url.to_str().unwrap_or("");
    let output = get_directory_html(title, &directory_items);
    println!("{}", output);
    (StatusCode::OK, Html(output)).into_response()
}