use std::str::FromStr;

#[derive(Debug, Clone, Copy)]
pub enum Season {
    // January 1 – March 31
    Winter,
    // April 1 – June 30
    Spring,
    // July 1 – September 30
    Summer,
    // October 1 – December 31
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