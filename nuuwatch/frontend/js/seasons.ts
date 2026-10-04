export enum Season {
  // January 1 – March 31
  Winter,
  // April 1 – June 30
  Spring,
  // July 1 – September 30
  Summer,
  // October 1 – December 31
  Fall,
}

export interface AnimeSeason {
  season: Season;
  year: number;
}

export const animeSeasonStorageKey = 'anime-season';
export function seasonStringToSeason(season: string | null) : Season | null {
  switch (season?.toLowerCase()) {
    case 'winter':
      return Season.Winter;
    case 'spring':
      return Season.Spring;
    case 'summer':
      return Season.Summer;
    case 'fall':
      return Season.Fall;
  }

  return null;
}

export function getCurrentAnimeSeason(): AnimeSeason {
  const now = new Date();
  let season = Math.floor(now.getMonth() / 3);

  return {
    season,
    year: now.getFullYear(),
  };
}

/**
 * Priority:
 * 1. Query URL
 * 2. Local Storage
 * 3. CurrentSeason based on year & month.
 */
export function getSelectedSeason(): AnimeSeason {
  const query = new URLSearchParams(location.search);
  const queryYear = parseInt(query.get('year') ?? '', 10);
  const querySeason = seasonStringToSeason(query.get('season'));
  if (!Number.isNaN(queryYear) && querySeason) {
    return {
      year: queryYear,
      season: querySeason
    };
  }

  const storedSeason = getStoredAnimeSeason();
  return storedSeason != null ? storedSeason : getCurrentAnimeSeason();
}

export function setStoredAnimeSeason(season: AnimeSeason | null) {
  try {
    if (season) {
      localStorage.setItem(animeSeasonStorageKey, JSON.stringify(season));
    } else {
      localStorage.removeItem(animeSeasonStorageKey);
    }
  }
}

export function getStoredAnimeSeason(): AnimeSeason | null {
  try {
    const selectedSeason = localStorage.getItem(animeSeasonStorageKey);
    if (selectedSeason) {
      const item = JSON.parse(selectedSeason) as AnimeSeason;
      return {
        year: item.year,
        season: item.season,
      };
    }
  } catch { }

  return null;
}