use serde::{Deserialize, Serialize};

#[derive(Debug, serde::Deserialize)]
pub struct AniListResponse<T> {
    pub data: Option<T>,
    pub errors: Option<Vec<AniListError>>,
}

#[derive(Debug, serde::Deserialize)]
pub struct AniListError {
    pub message: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct Page<T> {
    #[serde(rename = "Page")]
    pub page: T,
}

#[derive(Debug, serde::Deserialize)]
pub struct Media<T> {
    #[serde(rename = "Media")]
    pub media: T,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SeasonPage {
    pub page_info: PageInfo,
    pub media: Vec<AniListAnime>,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PageInfo {
    pub has_next_page: bool,
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AniListAnime {
    pub id: u32,
    pub title: AnimeTitle,
    pub site_url: Option<String>,
    pub banner_image: Option<String>,
    pub cover_image: Option<CoverImage>,
    pub average_score: Option<u8>,
    pub country_of_origin: Option<String>,
    pub description: Option<String>,
    pub episodes: Option<u32>,
    pub format: Option<String>,
    pub is_adult: bool,
    pub popularity: Option<u32>,
    pub next_airing_episode: Option<AiringEpisode>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct AnimeTitle {
    pub romaji: Option<String>,
    pub english: Option<String>,
    pub native: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CoverImage {
    pub large: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiringEpisode {
    pub airing_at: i64,
    pub time_until_airing: i64,
    pub episode: u32,
}

