// Define common sub-interfaces first to keep the main interface clean


interface PaginationItems {
  count: number;
  total: number;
  per_page: number;
}

export interface Pagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items: PaginationItems;
}


/**
 * Represents a set of image URLs (used in root images, trailer images, etc.)
 */
interface ImageUrls {
  image_url: string;
  small_image_url?: string;
  medium_image_url?: string | null;
  large_image_url?: string;
  maximum_image_url?: string | null;
}

/**
 * Specific interface for the main `images` object which has jpg/webp variants
 */
interface MainImages {
  jpg: ImageUrls;
  webp: ImageUrls;
}

/**
 * Represents a single title entry (e.g., Default, Synonym)
 */
interface TitleEntry {
  type: string; // e.g., "Default", "Synonym", "English"
  title: string;
}

/**
 * Represents an entity related to the anime that shares id/name/url structure
 * (Used for Producers, Studios, Genres, Themes)
 */
interface RelatedEntity {
  mal_id: number;
  type: string; // e.g., "anime"
  name: string;
  url: string;
}


interface AiredDataDate {
  day?: number; month?: number; year?: number;
}
/**
 * Represents the 'aired' section which includes dates and a detailed 'prop' object
 */
interface AiredData {
  from: string; // ISO8601 format example: "2026-04-08T00:00:00+00:00"
  to?: string | null; // Can be null if not finished/unknown

  prop: {
    from: AiredDataDate;
    to: AiredDataDate;
  };

  string?: string; // Example: "Apr 8, 2026 to ?"
}

/**
 * Represents the 'trailer' section of an Anime object
 */
interface TrailerData {
  youtube_id?: string | null;
  url?: string | null;
  embed_url?: string | null; // eg https://www.youtube-nocookie.com/embed/...
  images: ImageUrls;
}

/**
 * Main Anime Interface matching the provided JSON structure
 */
export interface MALAnime {
  mal_id: number;
  url: string; // https://myanimelist.net/anime/{id}/{title}
  images: MainImages;
  trailer: TrailerData;
  approved: boolean;

  // Titles & Metadata
  titles: TitleEntry[];
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  title_synonyms: string[];

  type: 'TV' | 'Movie' | 'OVA' | 'ONA' | 'TV Special'; // e.g., "TV", "Movie"
  source?: string; // e.g., "Light novel"

  episodes: number;
  status?: string; // e.g., "Currently Airing", "Finished Airing"
  airing?: boolean;
  aired?: AiredData;

  duration?: string; // e.g. "23 min per ep"
  rating?: string; // e.g., "R - 17+ (violence & profanity)"

  score: number;
  scored_by: number;
  rank: number;
  popularity: number;
  members: number;
  favorites: number;

  synopsis: string | null;
  background?: string | null;

  season?: string; // e.g., "spring"
  year?: number;

  broadcast?: {
    day: string; // Wednesdays
    time: string; // 22:00
    timezone: string; // Asia/Tokyo
    string: string; // Wednesdays at 22:000 (JST)
  };

  producers: RelatedEntity[];
  licensors: RelatedEntity[];
  studios: RelatedEntity[];

  genres: RelatedEntity[];
  explicit_genres?: RelatedEntity[];

  themes: RelatedEntity[];
  demographics?: RelatedEntity[];
}