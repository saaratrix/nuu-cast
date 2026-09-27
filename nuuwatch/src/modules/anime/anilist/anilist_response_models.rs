use serde::{Deserialize, Serialize};
use crate::modules::anime::anilist::anilist_models::AniListAnime;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AniListSeasonResult {
    pub animes: Vec<AniListAnime>,
    pub has_error: bool,
}