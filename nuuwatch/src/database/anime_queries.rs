use serde::Deserialize;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use crate::database::db::Anime;

pub async fn get_status(
    pool: &SqlitePool,
    mal_id: i32,
) -> Result<Option<Anime>, sqlx::Error> {
    sqlx::query_as::<_, Anime>(
        r#"
        SELECT
            mal_id,
            search_terms,
            tags,
            episodes_watched,
            rating,
            comment,
            status,
            modules_data
        FROM Anime
        WHERE mal_id = ?
        "#,
    )
        .bind(mal_id)
        .fetch_optional(pool)
        .await
}

#[derive(Deserialize)]
pub struct AnimeStatusPatch {
    pub search_terms: Option<String>,
    pub tags: Option<String>,
    pub episodes_watched: Option<i32>,
    pub rating: Option<i32>,
    pub comment: Option<String>,
    pub status: Option<i32>,
    pub modules_data: Option<String>,
}

pub async fn update_status(
    pool: &SqlitePool,
    mal_id: i32,
    patch: AnimeStatusPatch,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        r#"
        UPDATE Anime
        SET
            search_terms = COALESCE(?, search_terms),
            tags = COALESCE(?, tags),
            episodes_watched = COALESCE(?, episodes_watched),
            rating = COALESCE(?, rating),
            comment = COALESCE(?, comment),
            status = COALESCE(?, status),
            modules_data = COALESCE(?, modules_data)
        WHERE mal_id = ?
        "#,
    )
        .bind(patch.search_terms)
        .bind(patch.tags)
        .bind(patch.episodes_watched)
        .bind(patch.rating)
        .bind(patch.comment)
        .bind(patch.status)
        .bind(patch.modules_data)
        .bind(mal_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected())
}

pub async fn insert_status(
    pool: &SqlitePool,
    mal_id: i32,
    patch: AnimeStatusPatch,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        r#"
        INSERT INTO Anime (
            mal_id,
            search_terms,
            tags,
            episodes_watched,
            rating,
            comment,
            status,
            modules_data
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
        .bind(mal_id)
        .bind(patch.search_terms)
        .bind(patch.tags)
        .bind(patch.episodes_watched)
        .bind(patch.rating)
        .bind(patch.comment)
        .bind(patch.status)
        .bind(patch.modules_data)
        .execute(pool)
        .await?;

    Ok(result.rows_affected())
}

pub async fn get_status_all(pool: &SqlitePool, mal_ids: Vec<i32>) -> Result<Vec<Anime>, sqlx::Error> {
    let mut animes = Vec::new();
    if mal_ids.is_empty() {
        return Ok(animes);
    }

    let mut mal_ids = mal_ids;

    mal_ids.sort_unstable();
    mal_ids.dedup();

    for ids in mal_ids.chunks(500) {
        let mut qb = QueryBuilder::<Sqlite>::new(
            r#"
            SELECT
                mal_id,
                rating,
                comment,
                search_terms,
                tags,
                episodes_watched,
                status,
                modules_data
            FROM Anime
            WHERE mal_id IN (
            "#,
        );

        let mut separated = qb.separated(", ");

        for id in ids {
            separated.push_bind(*id);
        }

        separated.push_unseparated(")");

        let result: Vec<Anime> = qb
            .build_query_as()
            .fetch_all(pool)
            .await?;

        animes.extend(result);
    }

    Ok(animes)
}