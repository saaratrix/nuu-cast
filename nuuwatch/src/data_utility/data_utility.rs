use std::env;
use std::path::PathBuf;
use std::sync::LazyLock;

pub static NUUWATCH_PROJECT_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| {
        env::var("NUUWATCH_PROJECT_ROOT")
            .map(PathBuf::from)
            .unwrap_or_else(|_| env::current_dir().unwrap()).canonicalize().unwrap()
    });

pub static DATA_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| PathBuf::from(&*NUUWATCH_PROJECT_ROOT).join("data"));

pub static STATIC_ROOT: LazyLock<PathBuf> =
    LazyLock::new(|| PathBuf::from(&*NUUWATCH_PROJECT_ROOT).join("static"));
