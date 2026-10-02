pub const SEASON_QUERY: &str = r#"
query Season($page: Int!, $season: MediaSeason!, $year: Int!) {
    Page(page: $page, perPage: 50) {
        pageInfo {
            hasNextPage
        }

        media(
            type: ANIME
            season: $season
            seasonYear: $year
            sort: [POPULARITY_DESC]
        ) {
            id
            title {
                romaji
                english
                native
            }

            coverImage {
                large
            }
            averageScore
            countryOfOrigin
            description
            episodes
            format
            isAdult
            popularity

            nextAiringEpisode {
                airingAt
                timeUntilAiring
                episode
            }
        }
    }
}
"#;

pub const ANIME_QUERY: &str = r#"
query Anime($id: Int!) {
    Media(id: $id, type: ANIME) {
        id
        title {
            romaji
            english
            native
        }

        bannerImage
        coverImage {
            large
        }
        averageScore
        countryOfOrigin
        description
        episodes
        format
        isAdult
        popularity

        nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
        }
    }
}
"#;