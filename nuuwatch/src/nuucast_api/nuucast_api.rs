use std::path::PathBuf;
use crate::nuucast_api::nuucast_client::NuucastClient;

pub async fn upload_file(nuucast_client: &NuucastClient, file_path: &str, file_bytes: Vec<u8>) -> Result<Vec<PathBuf>, String> {
    let upload_url = nuucast_client.get_upload_url(file_path);

    let response = match nuucast_client
        .client
        .put(upload_url.clone())
        .header(reqwest::header::CONTENT_TYPE, "application/octet-stream")
        // .header(reqwest::header::CONTENT_TYPE, "video/x-matroska")
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