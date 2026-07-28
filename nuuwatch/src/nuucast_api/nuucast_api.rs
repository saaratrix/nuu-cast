use std::path::PathBuf;
use axum::http::StatusCode;
use crate::nuucast_api::nuucast_client::NuucastClient;

pub async fn upload_file(nuucast_client: &NuucastClient, file_path: &str, file_bytes: Vec<u8>) -> Result<Vec<PathBuf>, String> {
    let upload_url = nuucast_client.get_upload_url(file_path);

    let response = match nuucast_client
        .client
        .put(upload_url.clone())
        .header(reqwest::header::CONTENT_TYPE, "application/octet-stream")
        .body(file_bytes)
        .send()
        .await
    {
        Ok(response) => response,
        Err(e) => {
            eprintln!("reqwest error: {:#?}", e);

            let mut source = std::error::Error::source(&e);
            while let Some(err) = source {
                eprintln!("caused by: {}", err);
                source = err.source();
            }

            return Err(e.to_string());
        }
    };

    let uploaded_paths = response.json::<Vec<PathBuf>>().await.map_err(|e| e.to_string())?;
    println!("uploaded_paths: {:?}", uploaded_paths);

    if uploaded_paths.is_empty() {
        return Err(format!("Failed to upload file, no files uploaded. - {}", file_path));
    }

    Ok(uploaded_paths)
}

pub async fn get_files_in_directory(nuucast_client: &NuucastClient, directory_path: &PathBuf) -> Result<Vec<String>, String> {
    let get_files_url = nuucast_client.get_files_url(directory_path);

    let response = match nuucast_client
        .client
        .get(get_files_url.clone())
        .header(reqwest::header::CONTENT_TYPE, "application/json")
        .send()
        .await
    {
        Ok(response) => response,
        Err(e) => {
            if e.is_connect() {
                println!("Fetching resources: Nuucast not running, turn it on!");
                return Err("Nuucast media server not currently running".to_string());
            }

            eprintln!("reqwest error: {:#?}", e);

            let mut source = std::error::Error::source(&e);
            while let Some(err) = source {
                eprintln!("caused by: {}", err);
                source = err.source();
            }

            return Err(e.to_string());
        }
    };

    let status = response.status();
    match status {
        StatusCode::OK => {
            let files = response.json::<Vec<String>>().await.map_err(|e| e.to_string())?;
            Ok(files)
        }
        _ => Ok(Vec::new())
    }
}