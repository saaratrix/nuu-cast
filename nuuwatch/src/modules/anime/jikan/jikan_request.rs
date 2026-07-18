use url::Url;
use std::collections::HashMap;
use axum::http::HeaderValue;
use reqwest::header::HeaderMap;
use crate::modules::anime::anime_request_cacher::{add_cached_request_json, try_get_cached_request_json, CacheOptions};
use crate::modules::anime::jikan::jikan_settings::{Settings};

#[derive(Clone)]
pub struct Request {
    mal: bool,
    http_client: reqwest::Client,
}

impl Request {
    pub fn new(mal: bool) -> Self {
        let mut headers = HeaderMap::new();
        if mal {
            headers.insert("X-MAL-CLIENT-ID", HeaderValue::from_static("6114d00ca681b7701d1e15fe11a4987e"));
        }

        let http_client = reqwest::Client::builder().default_headers(headers).build().unwrap();

        Request {
            http_client,
            mal,
        }
    }

    pub async fn send(&self, args: Vec<String>, params: Option<HashMap<String, String>>, options: CacheOptions) -> Result<String, reqwest::Error> {
        let url = self.build_url(args, params.as_ref());

        if !options.ignore_cache && let Some(cached_response) = try_get_cached_request_json(&url, &options).await {
            println!("returning cached request");
            return Ok(cached_response);
        }

        println!("Fetching {}", url);

        let response = self.http_client.get(url.as_str()).send().await?;
        let is_success = response.status().is_success();
        let json_text = response.text().await?;

        if is_success {
            add_cached_request_json(&url, None, &json_text).await.ok();
        }

        Ok(json_text)
    }

    fn build_url(&self, args: Vec<String>, params: Option<&HashMap<String, String>>) -> Url {
        let mut url = Settings::default().get_base_url();

        if !args.is_empty() {
            url.path_segments_mut().unwrap().extend(args);
        }

        if let Some(p) = params {
            for (k, v) in p {
                url.query_pairs_mut().append_pair(k, v);
            }
        }

        url
    }
}