use url::Url;

pub struct JikanSettings {
    base_url: Url,
}

impl JikanSettings {
    pub fn new(url: &str) -> Self {
        let url = Url::parse(url).unwrap();
        // Default to v4 if not set in constructor, or pass version arg
        JikanSettings { base_url: url}
    }

    pub fn get_base_url(&self) -> Url {
        self.base_url.clone()
    }
}

impl Default for JikanSettings {
    fn default() -> Self {
        JikanSettings::new("https://api.jikan.moe/v4")
    }
}