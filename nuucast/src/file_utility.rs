use std::env;
use std::path::PathBuf;
use std::sync::LazyLock;

pub static PROJECT_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| {
        env::var("PROJECT_ROOT")
            .map(PathBuf::from)
            .unwrap_or_else(|_| env::current_dir().unwrap())
    });

pub static MEDIA_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| PathBuf::from(&*PROJECT_ROOT).join("media"));

pub static STATIC_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| PathBuf::from(&*PROJECT_ROOT).join("static"));

pub fn get_path_from_url(url: String) -> Option<PathBuf> {
    let clean_url = url.trim_matches('/');
    let full_path = MEDIA_ROOT.join(clean_url);
    if !full_path.starts_with(MEDIA_ROOT.as_path()) {
        return None;
    }

    let result = PathBuf::from(clean_url);
    Some(result)
}