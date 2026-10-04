import type { AnimeItem } from './app-state';
import type { AniListAnime } from './api/ani-list/ani-list-types';
import type { MALAnime } from './api/jikan/types/jikan';
import { getParsedSynopsisHTML } from './utility.js';

export function isAniListItem(item: AnimeItem | undefined): item is AnimeItem<AniListAnime> {
  return item?.apiType === 'anilist';
}

export function isMalItem(item: AnimeItem | undefined): item is AnimeItem<MALAnime> {
  return item?.apiType === 'anilist';
}

/** Gets score from 0 --> 10 */
export function getScore(animeItem: AnimeItem): number {
  if (isAniListItem(animeItem)) {
    return animeItem.data.averageScore / 10;
  } else if (isMalItem(animeItem)) {
    return 0;
  }
  return 0;
}

export function getSynopsisHTML(animeItem: AnimeItem): string {
  if (animeItem.parts.synopsisHTML) {
    return animeItem.parts.synopsisHTML;
  }

  let synopsisRaw = '';
  if (isAniListItem(animeItem)) {
    synopsisRaw = animeItem.data.description;
  } else if (isMalItem(animeItem)) {
    synopsisRaw = animeItem.data.synopsis || animeItem.data.background || '';
  }

  const synopsis = getParsedSynopsisHTML(synopsisRaw);
  animeItem.parts.synopsisHTML = synopsis;
  return synopsis;
}

export function getCurrentEpisode(animeItem: AnimeItem): number | null {
  if (isAniListItem(animeItem)) {
    if (animeItem.data.nextAiringEpisode) {
      return animeItem.data.nextAiringEpisode.episode;
    } else {
      return Number(animeItem.data.episodes);
    }
  } else if (isMalItem(animeItem)) {
    // Some way to find current episode.
  }

  return null;
}

export function getTotalEpisodes(animeItem: AnimeItem): number {
  if (isAniListItem(animeItem)) {
    return Number(animeItem.data.episodes);
  } else if (isMalItem(animeItem)) {
    return Number(animeItem.data.episodes);
  }

  return 0;
}

export function getAiringAt(animeItem: AnimeItem): string {
  if (isAniListItem(animeItem)) {
    if (animeItem.data.nextAiringEpisode) {
      const airingAt = animeItem.data.nextAiringEpisode.airingAt;
      const formatted = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(airingAt * 1000));
      return formatted;
    }
  }

  return '';
}