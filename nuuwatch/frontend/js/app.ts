import { JikanAPI } from './jikan/jikan.js';
import { MALAnime } from './jikan/types/jikan';

import { showPopover, hidePopover } from './popover.js';

interface AnimeItem {
  data: MALAnime,
  type: 'anime',
  element: HTMLElement,
}

const jikan = new JikanAPI();
jikan.settings.setBaseURLAbsolute('/anime/');


let animes: MALAnime[] = [];
let currentPage: number = 1;

let tvItems: AnimeItem[] = [];
let movieItems: AnimeItem[] = [];

async function fetchCurrentSeason() {
  const res = await jikan.loadCurrentSeason(currentPage);
  console.log(res);
  const { pagination, data } = res;

  animes.push(...data);
  if (!Array.isArray(data)) {
    document.body.innerHTML += 'no current season found';
    return;
  }

  if (currentPage < pagination.last_visible_page) {
    currentPage++;
    setTimeout(() => {
      fetchCurrentSeason().then();
    }, 0.5);
  } else {
    onCurrentSeasonLoaded();
    sortItems();
    renderAllItems();
  }
}

function onCurrentSeasonLoaded() {

  const addedAnimes = new Set();

  const shows = [];
  const movies = [];

  for (const anime of animes) {
    if (addedAnimes.has(anime.mal_id)) {
      continue;
    }

    addedAnimes.add(anime.mal_id);

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
    tvItems.push(animeItem);
  }

  for (const show of movies) {
    const animeItem = createAnimeItem(show);
    movieItems.push(animeItem);
  }
}

function createAnimeItem(item: MALAnime): AnimeItem {
  // Background exists along with synopsis for a shorter description.
  const { title, title_english, url, images, broadcast, background, synopsis, score, scored_by, episodes } = item;

  const airing = getAiring(broadcast, 'Europe/Helsinki');
  const airingHtml = airing ? `<div class="airing">${airing}</div>` : '';

  const titleHtml = `<div class="meta-title">${title_english || title}</div>`
  const ratingHtml = score ? `<div class="rating">★ ${score} ${scored_by ? `(${scored_by})` : ''}</div>` : '';
  const episodesHtml = episodes ? `<div class="episodes">${episodes} Episodes</div>` : '';
  const synopsisText = (synopsis || background || '').replace(/\r?\n/g, '<br>');

  // const englishTitle = title === title_english ? '' : title_english;

  const image_url = images.webp.image_url.replace("https://myanimelist.net/images/anime/", "/anime/malimage/");

  const metalinebreakHtml = (!!ratingHtml || !!episodesHtml || !!airingHtml) ? '<hr>' : '';

  const itemCardElement = document.createElement('div');
  itemCardElement.className = 'item-card';
  itemCardElement.innerHTML = `
  <a href="${url}">
      <span class="title">${title_english || title}</span>
      <img src="${image_url}" width="128" height="128">
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
              ${synopsisText}
          </div>
        </div>
  </a>`;

  itemCardElement.addEventListener('pointerenter', () => showPopover(itemCardElement));
  itemCardElement.addEventListener('pointerleave', () => hidePopover());

  return {
    data: item,
    type: 'anime',
    element: itemCardElement,
  }
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
  tvItems.sort(
    (a: AnimeItem, b: AnimeItem): number => {
      return a.data.title.localeCompare(b.data.title);
    });
}

function renderAllItems() {
  const itemsContainer = document.querySelector('.items-container');
  if (!itemsContainer) {
    return;
  }

  console.log('items', tvItems);

  const fragment = document.createDocumentFragment();
  const tvElement = tryRenderItems(tvItems, false);
  tvElement && fragment.appendChild(tvElement);

  const moviesElement = tryRenderItems(movieItems, !!tvElement);
  moviesElement && fragment.appendChild(moviesElement);

  itemsContainer.appendChild(fragment);
}

function tryRenderItems(items: AnimeItem[], addLinebreak: boolean): DocumentFragment | undefined {
  if (items.length === 0) {
    return undefined;
  }

  const fragment = new DocumentFragment();

  const itemsElement = document.createElement('div');
  itemsElement.className = 'items';

  if (addLinebreak) {
    const linebreak = document.createElement('hr');
    fragment.appendChild(linebreak);
  }

  for (const item of items) {
    itemsElement.appendChild(item.element);
  }

  fragment.appendChild(itemsElement);
  return fragment;
}

fetchCurrentSeason().then();

