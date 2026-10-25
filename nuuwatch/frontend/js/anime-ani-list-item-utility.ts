import { AnimeItem, appState } from './app-state.js';
import { escapeHtml } from './utility.js';
import { hidePopover, showPopover } from './popover.js';
import { openEditor } from './item-editor.js';
import { EventHandler } from './event-handler.js';
import { initRatingEvents } from './anime-item-utility.js';
import { AniListAnime } from './api/ani-list/ani-list-types.js';
import { AnimeCard } from './components/anime-card';

export function createAnimeItemFromAniList(aniListItem: AniListAnime): AnimeItem<AniListAnime> {
  // Background exists along with synopsis for a shorter description.
  const { title, averageScore, episodes, description, coverImage } = aniListItem;
  const id = Number(aniListItem.id);
  const existingItem = appState.itemsById.get(id);
  if (existingItem) {
    return existingItem;
  }

  const visualTitle = title.english || title.romaji || title.native || '';
  const escapedTitle = escapeHtml(visualTitle);
  const ratingHtml = averageScore ? `<div class="rating">★ ${Number(averageScore / 10)}</div>` : '';
  const airingHtml = '';

  const imageUrl = `/anime/anilist-image/${id}/${encodeURIComponent(coverImage.large)}`;
  const siteUrl = `https://anilist.co/anime/${id}`;

  const cardElement = document.createElement('anime-card') as AnimeCard<AniListAnime>;
  cardElement.setAttribute('ani-list-id', id.toString());

  const animeItem: AnimeItem<AniListAnime> = {
    id,
    data: aniListItem,
    title: visualTitle,
    titleEscaped: escapedTitle,
    type: 'anime',
    apiType: 'anilist',
    parts: {
      visualTitle,
      rating: ratingHtml,
      airing: airingHtml,
      imageUrl: imageUrl,
      siteUrl,
      hasEnglishTitle: !!title.english
    },
    cardElement,
    eventHandler: new EventHandler(),
  };
  cardElement.animeItem = animeItem;
  return animeItem;
}