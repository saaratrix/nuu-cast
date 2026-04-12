use std::collections::HashMap;
use crate::modules::anime::jikan::jikan_request::Request;

pub struct Jikan {
    request: Request,
}

impl Jikan {
    pub fn new() -> Self {
        Self {
            request: Request::new(false),
        }
    }

    pub async fn load_current_season(&self, page: u16) -> Result<String, reqwest::Error> {
        let args = vec![
            "seasons".to_string(),
            "now".to_string()
        ];

        let params = HashMap::from([("page".into(), page.to_string())]);
        self.request.send(args, Some(params)).await
    }
}