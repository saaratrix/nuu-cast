use std::path::{Component, PathBuf};
use askama::Template;

#[derive(Debug)]
pub struct Breadcrumb {
    pub label: String,
    pub href: String,
}

pub struct Item {
    pub url: String,
    pub filepath: String,
}

#[derive(Template)]
#[template(path = "directory.html")]
pub struct DirectoryTemplate {
    pub title: String,
    pub body_class: String,
    pub script_url: Option<String>,
    pub breadcrumbs: Vec<Breadcrumb>,
    pub directories: Vec<Item>,
    pub files: Vec<Item>,
    pub upload_root: String,
}

#[derive(Template)]
#[template(path = "file.html")]
pub struct FileTemplate {
    pub title: String,
    pub body_class: String,
    pub script_url: Option<String>,
    pub breadcrumbs: Vec<Breadcrumb>,
    pub subtitles: Vec<String>,

    pub media_type: &'static str,
    pub stream_path: String,
    pub mime_type: String,
}

pub fn build_breadcrumbs(url: &PathBuf) -> Vec<Breadcrumb> {
    let mut breadcrumbs = vec![
        Breadcrumb {
            label: "Home".into(),
            href: "/".into(),
        }
    ];

    let mut accumulated_path = PathBuf::new();

    for component in url.components() {
        if let Component::Normal(segment) = component {
            accumulated_path.push(segment);

            breadcrumbs.push(Breadcrumb {
                label: segment.to_string_lossy().to_string(),
                href: format!("/{}", accumulated_path.display()),
            });
        }
    }

    breadcrumbs
}

