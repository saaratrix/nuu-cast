use std::env;
use std::path::PathBuf;
use axum::http::{HeaderMap, HeaderValue};

#[derive(Clone)]
pub struct NuucastClient {
    pub client: reqwest::Client,
    pub base_url: String,
}

impl NuucastClient {
    pub fn new(client: reqwest::Client) -> Self {
        let base_url = env::var("NUUCAST_API_BASE").unwrap_or("http://localhost:3000".into());

        Self {
            client,
            base_url
        }
    }

    pub fn create_client() -> reqwest::Client {
        let headers = HeaderMap::new();
        let http_client = reqwest::Client::builder().default_headers(headers).build().unwrap();
        http_client
    }

    pub fn get_upload_url(&self, file_path: &str) -> String {
        format!("{}/{}", self.base_url, file_path)
    }

    pub fn get_files_url(&self, directory_path: &PathBuf) -> String {
        format!("{}/api/files/{}", self.base_url, directory_path.display())
    }
}