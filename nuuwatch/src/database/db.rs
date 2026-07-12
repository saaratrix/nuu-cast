use serde::Serialize;
use sqlx::{FromRow, Pool, Sqlite};
use sqlx::sqlite::SqlitePoolOptions;

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Anime {
    pub mal_id: i64,
    pub rating: Option<i64>,
    pub comment: String,
    pub search_terms: String,
    pub episodes_watched: i64,
    pub status: i64,
    pub tags: String,
    pub modules_data: String,
}

#[repr(i64)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Rating {
    NoRating = 0,
    Bad = 1,
    Okay = 2,
    Good = 3,
}

#[repr(i64)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Status {
    None = 0,
    Watching = 1,
    Completed = 2,
}

pub async fn init_db() -> Result<Pool<Sqlite>, sqlx::Error> {
    let db = SqlitePoolOptions::new()
        .max_connections(5)
        .connect("sqlite://data/app.db?mode=rwc")
        .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS anime (
            mal_id INTEGER PRIMARY KEY,

            rating INTEGER,
            comment TEXT NOT NULL,
            search_terms TEXT NOT NULL,

            episodes_watched INTEGER NOT NULL DEFAULT 0,

            status INTEGER NOT NULL DEFAULT 0,

            tags TEXT NOT NULL DEFAULT '',

            modules_data TEXT NOT NULL DEFAULT ''
        );
        "#,
    )
        .execute(&db)
        .await?;

    Ok(db)
}