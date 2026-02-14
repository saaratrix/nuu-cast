use axum::body::Body;
use axum::extract::Path;
use axum::response::{IntoResponse, Response, };
use axum::http::{header, HeaderMap, HeaderValue, StatusCode};
use tokio_util::io::ReaderStream;
use tokio::fs::File;
use tokio::io::{AsyncReadExt, AsyncSeekExt};
use crate::io::file_utility::{get_url_and_filepath_from_url, get_mime_type };

pub async fn stream_file(Path(url): Path<String>, headers: HeaderMap) -> Response {
    let Some(paths) = get_url_and_filepath_from_url(&url) else {
        return (StatusCode::NOT_FOUND, "File not found").into_response();
    };

    let mut file = match File::open(&paths.filepath).await {
        Ok(f) => f,
        Err(_) => return (StatusCode::NOT_FOUND, "File not found").into_response(),
    };

    let file_size = match file.metadata().await {
        Ok(meta) => meta.len(),
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR).into_response(),
    };
    let mime_type = get_mime_type(&paths.filepath);

    if let Some(range) = headers.get(header::RANGE) {
        if let Some(response) = stream_file_range(range, &mut file, file_size, mime_type).await {
            return response;
        }
        if file.seek(std::io::SeekFrom::Start(0)).await.is_err() {
            return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to reset file position").into_response();
        }
    }

    let stream = ReaderStream::new(file);
    let body = Body::from_stream(stream);
    let header = [
        (header::CONTENT_TYPE, mime_type),
        (header::ACCEPT_RANGES, "bytes"),
        (header::CONTENT_LENGTH, &file_size.to_string())
    ];


    (header, body).into_response()
}

async fn stream_file_range(range: &HeaderValue, file: &mut File, file_size: u64, mime_type: &str) -> Option<Response> {
    let range_str = range.to_str().ok()?;
    let range_val = range_str.strip_prefix("bytes=")?;
    let (start, end) = parse_range(range_val, file_size)?;

    file.seek(std::io::SeekFrom::Start(start)).await.ok()?;
    let length = end - start + 1;
    let mut buffer = vec![0; length as usize];
    file.read_exact(&mut buffer).await.ok()?;

    Some((
        StatusCode::PARTIAL_CONTENT,
        [
            (header::CONTENT_TYPE, mime_type),
            (header::CONTENT_LENGTH, length.to_string().as_str()),
            (header::CONTENT_RANGE, format!("bytes {}-{}/{}", start, end, file_size).as_str()),
            (header::ACCEPT_RANGES, "bytes"),
        ],
        buffer,
    ).into_response())
}

fn parse_range(range: &str, file_size: u64) -> Option<(u64, u64)> {
    let parts: Vec<&str> = range.split('-').collect();
    if parts.len() != 2 {
        return None;
    }

    let start: u64 = parts[0].parse().ok()?;
    let end: u64 = if parts[1].is_empty() {
        file_size - 1
    } else {
        parts[1].parse().ok()?
    };

    Some((start, end))
}