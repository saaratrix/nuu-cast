use askama::Template;
use std::path::{Component, Path, PathBuf};

use crate::data_utility::data_utility::{
    NUUCAST_API_URL,
    NUUWATCH_API_URL,
};

#[derive(Template)]
#[template(path = "home_page.html")]
pub struct HomePageTemplate<'a> {
    pub title: &'a str,
    pub scripts_url: Option<&'a str>,

    pub nuucast_api_url: &'a str,
    pub nuuwatch_api_url: &'a str,
}

#[derive(Template)]
#[template(path = "home.html")]
pub struct HomeTemplate {
}

#[derive(Template)]
#[template(path = "anime_page.html")]
pub struct AnimePageTemplate<'a> {
    pub title: &'a str,
    pub scripts_url: Option<&'a str>,

    pub nuucast_api_url: &'a str,
    pub nuuwatch_api_url: &'a str,
}

#[derive(Template)]
#[template(path = "anime.html")]
pub struct AnimeTemplate {
}


pub fn get_home_page_html() -> String {
    HomePageTemplate {
        title: "Nuuwatch",
        scripts_url: None,

        nuucast_api_url: &NUUCAST_API_URL,
        nuuwatch_api_url: &NUUWATCH_API_URL,
    }
        .render().unwrap()
}

pub fn get_home_html() -> String {
    HomeTemplate {
        // 🐾
    }.render().unwrap()
}

pub fn get_anime_page_html() -> String {
    AnimePageTemplate {
        title: "An Anime",
        scripts_url: None,

        nuucast_api_url: &NUUCAST_API_URL,
        nuuwatch_api_url: &NUUWATCH_API_URL,
    }
        .render().unwrap()
}

pub fn get_anime_html() -> String {
    AnimeTemplate {
        // 🐾
    }.render().unwrap()
}