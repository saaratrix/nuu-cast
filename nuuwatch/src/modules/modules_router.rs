use axum::{extract::{Path}, http::StatusCode, Json, Router};
use axum::routing::{get};
use tokio::fs;
use crate::AppState;
use crate::data_utility::data_utility::STATIC_ROOT;

pub fn get_modules_routes() -> Router<AppState> {
    let mod_routes = Router::new()
        .route(
            "/module/{*name}",
            get(get_module_assets),
        );
    mod_routes
}

async fn get_module_assets(
    Path(module_type): Path<String>,
) -> Result<Json<Vec<String>>, StatusCode> {
    let modules_root = STATIC_ROOT.join("modules").join("local");

    let dir = modules_root
        .join(&module_type)
        .canonicalize()
        .map_err(|_| StatusCode::NOT_FOUND)?;

    if !dir.starts_with(&modules_root) {
        return Err(StatusCode::BAD_REQUEST);
    }

    let mut entries = fs::read_dir(&dir)
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    let mut files = Vec::new();

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    {
        let path = entry.path();

        match path.extension().and_then(|s| s.to_str()) {
            Some("js") | Some("css") => {
                if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                    files.push(format!("/static/modules/local/{}/{}", module_type, name));
                }
            }
            _ => {}
        }
    }

    files.sort();

    Ok(Json(files))
}