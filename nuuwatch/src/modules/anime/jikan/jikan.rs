use std::collections::HashMap;
use std::time::Duration;
use axum::http::{HeaderMap, HeaderValue};
use crate::modules::anime::anime_request_cacher::CacheOptions;
use crate::modules::anime::jikan::jikan_request::Request;

#[derive(Clone)]
pub struct Jikan {
    request: Request,
}

impl Jikan {
    pub fn new(http_client: reqwest::Client) -> Self {
        Self {
            request: Request::new(http_client),
        }
    }

    pub async fn load_current_season(&self, page: u16) -> Result<String, reqwest::Error> {
        let args = vec![
            "seasons".to_string(),
            "now".to_string()
        ];

        let params = HashMap::from([("page".into(), page.to_string())]);
        self.request.send(args, Some(params), CacheOptions {
            cache_prefix: None,
            ttl: None,
            ignore_cache: false,
        }).await
    }

    pub async fn load_anime(&self, mal_id: u32) -> Result<String, reqwest::Error> {
        let args = vec![
            "anime".to_string(),
            mal_id.to_string(),
            "full".to_string()
        ];

        self.request.send(args, None, CacheOptions {
            ttl: Some(Duration::from_hours(7 * 24)),
            cache_prefix: None,
            ignore_cache: false,
        }).await
    }

    pub fn create_shared_client(mal: bool) -> reqwest::Client {
        let mut headers = HeaderMap::new();
        if mal {
            headers.insert("X-MAL-CLIENT-ID", HeaderValue::from_static("6114d00ca681b7701d1e15fe11a4987e"));
        }

        let http_client = reqwest::Client::builder().default_headers(headers).build().unwrap();
        http_client
    }
}