use std::env;
use std::net::IpAddr;
use std::path::PathBuf;
use std::sync::LazyLock;
use local_ip_address::local_ip;

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

pub static NUUCAST_API_URL: LazyLock<String> = LazyLock::new(|| {
    env::var("NUUCAST_API_URL")
        .ok()
        .filter(|url| !url.is_empty())
        .unwrap_or_else(|| {
            let ip_addr = match local_ip().expect("Failed to determine local IP") {
                IpAddr::V4(ip) => ip.to_string(),
                IpAddr::V6(_) => panic!("No local IPv4 address found"),
            };
            format!("http://{}:3000", ip_addr)
        })
});

pub static NUUWATCH_API_URL: LazyLock<String> = LazyLock::new(|| {
    env::var("NUUWATCH_API_URL")
        .ok()
        .filter(|url| !url.is_empty())
        .unwrap_or_else(|| {
            let ip_addr = match local_ip().expect("Failed to determine local IP") {
                IpAddr::V4(ip) => ip.to_string(),
                IpAddr::V6(_) => panic!("No local IPv4 address found"),
            };
            format!("http://{}:3001", ip_addr)
        })
});


