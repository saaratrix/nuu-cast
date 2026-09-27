use std::str::FromStr;

#[derive(Debug, Clone, Copy)]
pub enum Season {
    Winter,
    Spring,
    Summer,
    Fall,
}


impl FromStr for Season {
    type Err = ();

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value.to_ascii_lowercase().as_str() {
            "winter" => Ok(Season::Winter),
            "spring" => Ok(Season::Spring),
            "summer" => Ok(Season::Summer),
            "fall" => Ok(Season::Fall),
            _ => Err(()),
        }
    }
}

impl Season {
    pub fn as_anilist_str(self) -> &'static str {
        match self {
            Season::Winter => "WINTER",
            Season::Spring => "SPRING",
            Season::Summer => "SUMMER",
            Season::Fall => "FALL",
        }
    }
}