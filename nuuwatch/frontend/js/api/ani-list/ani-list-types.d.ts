export interface Season {
  animes: AniListAnime[];
  hasError: boolean;
}

export interface AniListAnime {
  id: number,
  "title": {
    romaji: string;
    english: string;
    native: string;
  },
  bannerImage: string | null,
  coverImage: {
    large: string;
  },
  /** 0 -> 100 */
  averageScore: number,
  countryOfOrigin: 'JP' | string,
  description: string,
  episodes: number | null,
  format: 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC' | 'MANGA' | 'NOVEL' | 'ONE_SHOT'
  isAdult: boolean,
  popularity: number,
  nextAiringEpisode: {
    airingAt: number,
    timeUntilAiring: number,
    episode: number,
  } | null,
}