use url::Url;

pub struct Settings {
    base_url: Url,
}

impl Settings {
    pub fn new(url: &str) -> Self {
        let mut url = Url::parse(url).unwrap();
        // Default to v4 if not set in constructor, or pass version arg
        Settings { base_url: url}
    }

    pub fn get_base_url(&self) -> Url {
        self.base_url.clone()
    }
}

impl Default for Settings {
    fn default() -> Self {
        Settings::new("https://api.jikan.moe/v4")
    }
}