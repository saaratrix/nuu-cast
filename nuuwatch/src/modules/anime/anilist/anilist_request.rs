use serde_json::Value;
use crate::modules::anime::anime_request_cacher::{add_cached_result_json, try_get_cached_result, CacheOptions};

#[derive(Clone)]
pub struct AniListRequest {
    http_client: reqwest::Client,
}

const ANILIST_URL: &str = "https://graphql.anilist.co";

impl AniListRequest {
    pub fn new(http_client: reqwest::Client) -> Self {
        Self { http_client }
    }

    pub async fn send(&self, cache_key: &str, body: &Value, options: &CacheOptions) -> Result<String, reqwest::Error> {
        if !options.ignore_cache && let Some(cached_response) = try_get_cached_result(Some(cache_key.into()), &options).await {
            println!("returning cached request");
            return Ok(cached_response);
        }

        let response = self.http_client.post(ANILIST_URL)
            .json(&body)
            .send().await?;
        let is_success = response.status().is_success();
        let json_text = response.text().await?;

        if is_success {
            add_cached_result_json(cache_key.into(), options.cache_prefix.as_deref(), &json_text).await.ok();
        }
        Ok(json_text)
    }

    pub fn has_errors(response: &str) -> bool {
        response.find("\"errors\"").is_some()
    }

    pub fn has_next_page(response: &str) -> bool {
        let Some(pos) = response.find("\"hasNextPage\"") else {
            return false;
        };

        let rest = &response[pos + "\"hasNextPage\"".len()..];

        let Some(colon) = rest.find(':') else {
            return false;
        };

        rest[colon + 1..]
            .trim_start()
            .starts_with("true")
    }
}