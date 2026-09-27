use crate::modules::anime::anilist::anilist::AniList;
use crate::modules::anime::api_shared::anime_api_models::Season;
use crate::modules::anime::jikan::jikan::Jikan;

pub enum AnimeApiKind {
    AniList,
    Jikan,
}

pub trait AnimeApi: Send + Sync {
    async fn load_season(
        &self,
        year: u16,
        season: Season,
    ) -> Result<String, reqwest::Error>;

    async fn load_anime(
        &self,
        id: u32,
    ) -> Result<String, reqwest::Error>;
}

#[derive(Clone)]
pub enum AnimeApiClient {
    Jikan(Jikan),
    AniList(AniList),
}

impl AnimeApi for AnimeApiClient {
    async fn load_season(
        &self,
        year: u16,
        season: Season,
    ) -> Result<String, reqwest::Error> {
        match self {
            Self::Jikan(api) => api.load_season(year, season).await,
            Self::AniList(api) => api.load_season(year, season).await,
        }
    }

    async fn load_anime(
        &self,
        id: u32,
    ) -> Result<String, reqwest::Error> {
        match self {
            Self::Jikan(api) => api.load_anime(id).await,
            Self::AniList(api) => api.load_anime(id).await,
        }
    }
}