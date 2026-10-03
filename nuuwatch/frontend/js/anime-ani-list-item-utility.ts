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
  const titleHtml = `<div class="meta-title">${escapedTitle}</div>`
  const ratingHtml = averageScore ? `<div class="rating">★ ${Number(averageScore / 10)}</div>` : '';
  const episodesHtml = episodes ? `<div class="episodes">${Number(episodes)} Episodes</div>` : '';
  const synopsisText = (description || '').replace(/\r?\n/g, '<br>');
  const airingHtml = '';

  const imageUrl = `/anime/anilist-image/${id}/${encodeURIComponent(coverImage.large)}`;
  const siteUrl = `https://anilist.co/anime/${id}`;


//   const metalinebreakHtml = (!!ratingHtml || !!episodesHtml || !!airingHtml) ? '<hr>' : '';
//
//   const itemCardElement = document.createElement('div');
//   itemCardElement.className = 'item-card';
//   itemCardElement.innerHTML = `
//   <a class="item-body" href="${viewAnimeUrl}">
//       <img src="${escapeHtml(imageUrl)}" width="128" height="128">
//       <div class="item-footer">
//         <span class="item-title">${visualTitle}</span>
//         <p>Ep ${aniListItem}</p>
//       </div>
//
//
//   </a>
//   <div class="item-synopsis" hidden>
//         <div class="synopsis-metadata">
//           ${titleHtml}
//           ${metalinebreakHtml}
//           ${ratingHtml}
//           ${episodesHtml}
//           ${airingHtml}
//         </div>
//         <hr>
//         <div class="synopsis-text">
//             ${escapeHtml(synopsisText)}
//         </div>
//       </div>
//   <div class="item-actions">
//     <span class="item-action rating">♥</span>
//     <span class="item-action mal-link" title="Goto MAL"><a href="${siteUrl}">🔗</a></span>
//     <span class="item-action edit-anime" title="Edit anime">✎⋮</span>
//   </div>
// `;

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

  // cardElement.addEventListener('pointerenter', () => showPopover(cardElement, '.item-synopsis'));
  // cardElement.addEventListener('pointerleave', () => hidePopover());

  // initRatingEvents(animeItem, itemCardElement);

  // const editAnimeBtn = itemCardElement.querySelector<HTMLElement>('.edit-anime');
  // editAnimeBtn?.addEventListener('click', () => openEditor(animeItem));

  return animeItem;
}