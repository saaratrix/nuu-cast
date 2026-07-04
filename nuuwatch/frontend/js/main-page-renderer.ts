import { showPopover, hidePopover } from './popover.js';
import { jikan, appState, addItem, AnimeItem, ItemsKey } from './app-state.js';
import { MALAnime } from './jikan/types/jikan.js';
import { openEditor } from './item-editor.js';
import { escapeHtml } from './utility.js';

export function loadMainPage() {
  let currentPage = 1;

  const pageContainer = document.querySelector('.page-container');
  if (!pageContainer) {
    return;
  }
  pageContainer.innerHTML = `<div class="items-container"></div>`;
  fetchCurrentSeason(currentPage).then();
}

async function fetchCurrentSeason(currentPage: number) {
  const res = await jikan.loadCurrentSeason(currentPage);
  console.log(res);
  const { pagination, data } = res;

  if (!Array.isArray(data)) {
    document.body.innerHTML += 'no current season found';
    return;
  }

  for (const d of data as MALAnime[]) {
    appState.animes.set(d.mal_id, d);
  }

  if (currentPage < pagination.last_visible_page) {
    setTimeout(() => {
      fetchCurrentSeason(++currentPage).then();
    }, 0.5);
  } else {
    onCurrentSeasonLoaded();
    sortItems();
    renderAllItems();
  }
}

function onCurrentSeasonLoaded() {

  const shows = [];
  const movies = [];

  const animes = appState.animes.values();

  for (const anime of animes) {
    if (appState.itemsByMalId.has(anime.mal_id)) {
      continue;
    }

    const type = anime.type;
    switch (type.toLowerCase()) {
      case 'tv':
      case 'ova':
      case 'ona':
      case 'tv special':
        shows.push(anime);
        break;
      case 'movie':
        movies.push(anime);
        break;
      default:
        console.log('unknown type found', type);
    }
  }

  for (const show of shows) {
    const animeItem = createAnimeItem(show);
    addItem('TV', animeItem);
  }

  for (const show of movies) {
    const animeItem = createAnimeItem(show);
    addItem('Movie', animeItem);
  }
}

function createAnimeItem(item: MALAnime): AnimeItem {
  // Background exists along with synopsis for a shorter description.
  const { mal_id, title, title_english, url, images, broadcast, background, synopsis, score, scored_by, episodes } = item;

  const id = Number(mal_id);
  const airing = getAiring(broadcast, 'Europe/Helsinki');
  const airingHtml = airing ? `<div class="airing">${airing}</div>` : '';

  const visualTitle = escapeHtml(title_english || title || '');
  const titleHtml = `<div class="meta-title">${visualTitle}</div>`
  const ratingHtml = score ? `<div class="rating">★ ${Number(score)} ${scored_by ? `(${Number(scored_by)})` : ''}</div>` : '';
  const episodesHtml = episodes ? `<div class="episodes">${Number(episodes)} Episodes</div>` : '';
  const synopsisText = (synopsis || background || '').replace(/\r?\n/g, '<br>');

  const image_url = images.webp.image_url.replace("https://myanimelist.net/images/anime/", "/anime/malimage/");

  const metalinebreakHtml = (!!ratingHtml || !!episodesHtml || !!airingHtml) ? '<hr>' : '';

  const viewAnimeUrl = `#/view/${id}`;

  const itemCardElement = document.createElement('div');
  itemCardElement.className = 'item-card';
  itemCardElement.innerHTML = `
  <a href="${viewAnimeUrl}">
      <span class="title">${visualTitle}</span>
      <img src="${escapeHtml(image_url)}" width="128" height="128">            
  </a>
  <div class="item-synopsis" hidden>
        <div class="synopsis-metadata">
          ${titleHtml}
          ${metalinebreakHtml}
          ${ratingHtml}
          ${episodesHtml}            
          ${airingHtml}
        </div>
        <hr>
        <div class="synopsis-text">
            ${escapeHtml(synopsisText)}
        </div>
      </div>
  <div class="item-actions">
    <span class="item-action mal-link" title="Goto MAL"><a href="${escapeHtml(url)}">🔗</a></span>
    <span class="item-action edit-anime" title="Edit anime">✎⋮</span>
  </div>
`;

  const animeItem: AnimeItem = {
    id,
    data: item,
    title: visualTitle,
    type: 'anime',
    parts: {
      visualTitle,
      rating: ratingHtml,
      airing: airingHtml,
      imageUrl: image_url,
    },
    cardElement: itemCardElement,
  };

  itemCardElement.addEventListener('pointerenter', () => showPopover(itemCardElement));
  itemCardElement.addEventListener('pointerleave', () => hidePopover());

  const editAnimeBtn = itemCardElement.querySelector<HTMLElement>('.edit-anime');
  editAnimeBtn?.addEventListener('click', () => openEditor(animeItem));

  return animeItem;
}

const weekdayMap = {
  sundays: 0,
  mondays: 1,
  tuesdays: 2,
  wednesdays: 3,
  thursdays: 4,
  fridays: 5,
  saturdays: 6,
} as const;

const weekdayFromDay = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: "Fri",
  6: 'Sat',

} as const;

function getAiring(broadcast: MALAnime['broadcast'] | undefined, targetTimeZone: string): string | undefined {
  const dayKey = broadcast?.day?.toLowerCase() as keyof typeof weekdayMap;
  let day = weekdayMap[dayKey];

  if (!day) {
    return undefined;
  }

  const [hourStr, minuteStr] = broadcast!.time?.split(':') ?? [];
  const hours = Number(hourStr);
  const minutes = Number(minuteStr);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return undefined;
  }

  const probe = new Date(2000, 0, 2, 0, 0, 0);

  // Eg '22:00'
  const probeOffset =  new Intl.DateTimeFormat('en', {
    timeZone: broadcast!.timezone,
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(probe);
  const [probeDayHours, _] = probeOffset.split(':');
  const [probeDay, probeHours] = probeDayHours!.split(' ');

  const hoursDelta = probeDay!.includes('2') ? -parseInt(probeHours!) : 24 - parseInt(probeHours!);

  let totalHours = hours + hoursDelta;
  if (totalHours < 0) {
    day--;
    totalHours += 24;
    if (day < 0) {
      day = 6;
    }
  } else if (totalHours >= 24) {
    day++;
    totalHours -= 24;
    if (day > 6) {
      day = 0;
    }
  }

  const dayStr = weekdayFromDay[day as keyof typeof weekdayFromDay];
  return `${dayStr} ${totalHours < 9 ? '0' + totalHours : totalHours}:${minuteStr}`;
}

function sortItems() {
  for (const itemsKey of Object.keys(appState.items)) {
    const items = appState.items[itemsKey as ItemsKey];
    if (items) {
      items.sort((a: AnimeItem, b: AnimeItem): number => {
        return a.title.localeCompare(b.title);
      });
    }
  }
}

function renderAllItems() {
  const itemsContainer = document.querySelector('.items-container');
  if (!itemsContainer) {
    return;
  }

  let isFirst = true;
  const fragment = document.createDocumentFragment();
  for (const itemsKey of Object.keys(appState.items)) {
    const items = appState.items[itemsKey as ItemsKey];
    if (!items) {
      continue;
    }

    const element = tryRenderItems(items, itemsKey, !isFirst);
    isFirst = false;
    element && fragment.appendChild(element);
  }

  itemsContainer.appendChild(fragment);
}

function tryRenderItems(items: AnimeItem[], type: string, addLinebreak: boolean): DocumentFragment | undefined {
  if (items.length === 0) {
    return undefined;
  }

  const fragment = new DocumentFragment();

  const itemsElement = document.createElement('div');
  itemsElement.className = 'items';
  itemsElement.dataset['type'] = type;

  if (addLinebreak) {
    const linebreak = document.createElement('hr');
    fragment.appendChild(linebreak);
  }

  for (const item of items) {
    itemsElement.appendChild(item.cardElement);
  }

  fragment.appendChild(itemsElement);
  return fragment;
}