use crate::modules::anime::anilist::anilist_models::{AniListAnime, AniListResponse, Media, Page, SeasonPage};
use crate::modules::anime::anilist::anilist_query_builder::{ANIME_QUERY, SEASON_QUERY};
use crate::modules::anime::anilist::anilist_request::AniListRequest;
use crate::modules::anime::anilist::anilist_response_models::AniListSeasonResult;
use crate::modules::anime::anime_request_cacher::{add_cached_result_json, try_get_cached_result, CacheOptions};
use crate::modules::anime::api_shared::anime_api::AnimeApi;
use crate::modules::anime::api_shared::anime_api_models::Season;

#[derive(Clone)]
pub struct AniList {
    pub anilist_request: AniListRequest
}

impl AniList {
    pub fn new(http_client: reqwest::Client) -> Self {
        Self {
            anilist_request: AniListRequest::new(http_client)
        }
    }

    pub fn create_shared_client() -> reqwest::Client {

        let http_client = reqwest::Client::builder()
            .user_agent(concat!(
            "nuu/",
            env!("CARGO_PKG_VERSION"),
            " (+https://github.com/saaratrix/nuu-cast)"
            ))
            .build().unwrap();
        http_client
    }
}

impl AnimeApi for AniList {
    async fn load_season(&self, year: u16, season: Season) -> Result<String, reqwest::Error> {
        let season_str = season.as_anilist_str();
        let cache_key = format!("season_{}_{}", year, season_str);

        let cache_options = CacheOptions {
            cache_prefix: Some("ani_list".to_string()),
            ttl: None,
            ignore_cache: false,
        };

        if let Some(response) = try_get_cached_result(Some(cache_key.clone()), &cache_options).await {
            return Ok(response);
        }

        let mut page = 1;
        let mut all_animes = Vec::new();
        let mut has_error = false;
        loop {
            let body = serde_json::json!({
                "query": SEASON_QUERY,
                "variables": {
                    "page": page,
                    "season": season_str,
                    "year": year,
                }
            });
            let page_cache_key = format!("{}_{}", &cache_key, page);

            let json_response = self.anilist_request.send(&page_cache_key, &body, &cache_options).await?;
            let response: AniListResponse<Page<SeasonPage>> = match serde_json::from_str(&json_response) {
                Ok(response) => response,
                Err(err) => {
                    eprintln!("Failed to parse AniList season response: {err}");

                    has_error = true;
                    break;
                }
            };

            if response.errors.is_some() {
                has_error = true;
                break;
            }

            let Some(data) = response.data else {
                has_error = true;
                break;
            };

            let has_next_page = data.page.page_info.has_next_page;
            all_animes.extend(data.page.media);

            if !has_next_page {
                break;
            }

            page += 1;

            if (page > 5) {
                break;
            }
        }

        let result = AniListSeasonResult {
            animes: all_animes,
            has_error,
        };

        let json_result = serde_json::to_string(&result).expect("Failed to serialize AniList season response");
        add_cached_result_json(&cache_key, cache_options.cache_prefix.as_deref(), &json_result).await.expect("Failed to save combined seasons result.");

        Ok(json_result)
    }

    async fn load_anime(&self, id: u32) -> Result<String, reqwest::Error> {
        let cache_key = format!("anime_{}", id);
        let cache_options = CacheOptions {
            cache_prefix: Some("ani_list".to_string()),
            ttl: None,
            ignore_cache: false,
        };

        if let Some(response) = try_get_cached_result(Some(cache_key.clone()), &cache_options).await {
            return Ok(response);
        }

        let body = serde_json::json!({
            "query": ANIME_QUERY,
            "variables": {
                "id": id
            }
        });

        let json_response = self.anilist_request.send(&format!("{}_req", &cache_key), &body, &cache_options).await?;
        let response: AniListResponse<Media<AniListAnime>> =
            match serde_json::from_str(&json_response) {
                Ok(response) => response,
                Err(err) => {
                    eprintln!("Failed to parse AniList anime response: {err}");
                    return Ok(String::new());
                }
            };

        if response.errors.is_some() {
            return Ok(String::new());
        }

        let Some(data) = response.data else {
            return Ok(String::new());
        };

        let json_result = serde_json::to_string(&data.media).expect("Failed to serialize AniList anime response");
        add_cached_result_json(&cache_key, cache_options.cache_prefix.as_deref(), &json_result).await.expect("Failed to save anime cached result");

        Ok(json_result)
    }
}