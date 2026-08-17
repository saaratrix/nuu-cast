use std::time::Instant;
use axum::body::Body;
use axum::extract::Path;
use axum::response::{IntoResponse, Response, };
use axum::http::{header, HeaderMap, HeaderValue, StatusCode};
use tokio_util::io::ReaderStream;
use tokio::fs::File;
use tokio::io::{AsyncReadExt, AsyncSeekExt};
use crate::io::file_lookup_cache::PathCache;
use crate::io::file_utility::{get_url_and_filepath_from_url, get_mime_type };

pub async fn get_file(Path(url): Path<String>, headers: HeaderMap) -> Response {
    let Some(paths) = get_url_and_filepath_from_url(&url) else {
        return (StatusCode::NOT_FOUND, "File not found").into_response();
    };

    let bytes = match tokio::fs::read(&paths.filepath).await {
        Ok(bytes) => bytes,
        Err(_) => return (StatusCode::NOT_FOUND, "File not found").into_response(),
    };

    let mime_type = get_mime_type(&paths.filepath);

    let header = [
        (header::CONTENT_TYPE, mime_type),
        (header::CONTENT_LENGTH, &bytes.len().to_string()),
    ];
    (header, bytes).into_response()
}

pub async fn stream_file(
    Path(url): Path<String>,
    headers: HeaderMap,
) -> Response {
    let Some(paths) = get_url_and_filepath_from_url(&url) else {
        return (StatusCode::NOT_FOUND, "File not found").into_response();
    };

    let mut file = match File::open(&paths.filepath).await {
        Ok(f) => f,
        Err(_) => {
            return (StatusCode::NOT_FOUND, "File not found").into_response();
        }
    };

    let file_size = match file.metadata().await {
        Ok(meta) => meta.len(),
        Err(_) => {
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        }
    };

    let mime_type = get_mime_type(&paths.filepath);
    // If range is requested, return the range they requested.
    if let Some(range) = headers.get(header::RANGE) {
        if let Some((start, end)) = parse_range_header(range, file_size) {
            return stream_file_range(
                file,
                start,
                end,
                file_size,
                mime_type,
            )
                .await;
        }
    }

    // No range: stream the entire file.
    let stream = ReaderStream::new(file);
    let body = Body::from_stream(stream);

    let mut response = Response::new(body);

    response.headers_mut().insert(
        header::CONTENT_TYPE,
        HeaderValue::from_str(mime_type).unwrap(),
    );

    response.headers_mut().insert(
        header::ACCEPT_RANGES,
        HeaderValue::from_static("bytes"),
    );

    response.headers_mut().insert(
        header::CONTENT_LENGTH,
        HeaderValue::from_str(&file_size.to_string()).unwrap(),
    );

    response
}

fn parse_range_header(
    range: &HeaderValue,
    file_size: u64,
) -> Option<(u64, u64)> {
    let range_str = range.to_str().ok()?;
    let range_val = range_str.strip_prefix("bytes=")?;

    parse_range(range_val, file_size)
}

async fn stream_file_range(
    mut file: File,
    start: u64,
    end: u64,
    file_size: u64,
    mime_type: &str,
) -> Response {
    // Seek to start position
    if file
        .seek(std::io::SeekFrom::Start(start))
        .await
        .is_err()
    {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to seek to file position.",
        )
            .into_response();
    }

    let length = end - start + 1;
    let reader = file.take(length);
    let stream = ReaderStream::new(reader);
    let body = Body::from_stream(stream);

    let mut response = Response::new(body);

    *response.status_mut() = StatusCode::PARTIAL_CONTENT;

    response.headers_mut().insert(
        header::CONTENT_TYPE,
        HeaderValue::from_str(mime_type).unwrap(),
    );

    response.headers_mut().insert(
        header::CONTENT_LENGTH,
        HeaderValue::from_str(&length.to_string()).unwrap(),
    );

    response.headers_mut().insert(
        header::CONTENT_RANGE,
        HeaderValue::from_str(
            &format!("bytes {}-{}/{}", start, end, file_size)
        )
            .unwrap(),
    );

    response.headers_mut().insert(
        header::ACCEPT_RANGES,
        HeaderValue::from_static("bytes"),
    );

    response
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