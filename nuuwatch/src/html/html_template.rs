use askama::Template;
use std::path::{Component, Path, PathBuf};

use crate::data_utility::data_utility::{
    NUUCAST_API_URL,
    NUUWATCH_API_URL,
};

pub struct Breadcrumb {
    pub name: String,
    pub url: String,
}

#[derive(Template)]
#[template(path = "home.html")]
pub struct HomeTemplate<'a> {
    pub title: &'a str,
    pub body_class: &'a str,
    pub scripts_url: Option<&'a str>,

    pub nuucast_api_url: &'a str,
    pub nuuwatch_api_url: &'a str,

    pub breadcrumbs: Vec<Breadcrumb>,
}

fn breadcrumbs(path: &PathBuf) -> Vec<Breadcrumb> {
    let mut result = Vec::new();
    let mut accumulated = String::new();

    for component in path.components() {
        if let Component::Normal(segment) = component {
            let name = segment.to_string_lossy();

            accumulated.push('/');
            accumulated.push_str(&name);

            result.push(Breadcrumb {
                name: name.into_owned(),
                url: accumulated.clone(),
            });
        }
    }

    result
}

pub fn get_browser_html() -> String {
    HomeTemplate {
        title: "Nuuwatch",
        body_class: "browser",
        scripts_url: None,

        nuucast_api_url: &NUUCAST_API_URL,
        nuuwatch_api_url: &NUUWATCH_API_URL,

        breadcrumbs: breadcrumbs(&PathBuf::from("")),
    }
        .render().unwrap()
}