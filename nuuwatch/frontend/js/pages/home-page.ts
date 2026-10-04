import { addItem, animeApi, AnimeItem, appState, changeItem, ItemsKey } from '../app-state.js';
import { addItemModel, AnimeModel, Rating } from '../anime-model.js';
import { loadHTML } from '../routing/layout-loader.js';
import { AniListAnime } from '../api/ani-list/ani-list-types';
import { createAnimeItemFromAniList } from '../anime-ani-list-item-utility.js';
import { getSelectedSeason, Season } from '../seasons.js';

const loadedAnimes = new Map<number, AniListAnime>();

export function loadMainPage() {
  const animeListContainer = document.querySelector('.animes-list');
  document.title = 'Nuuwatch';
  document.body.className = 'home-page';

  console.log('starting to load page!');
  const promise = !animeListContainer ? loadHTML('home', null, '.page-container') : Promise.resolve();

  console.log('promise', promise);

  promise.then(() => onPageLoaded()).catch((err) => {
    console.log('Failed to load home page', err);
  });
}

function onPageLoaded() {
  console.log('page loaded');
  let currentPage = 1;
  changeItem(undefined);
  fetchSeason(currentPage).then();

  setSeasonInfoHeader();
}

function setSeasonInfoHeader() {
  const season = getSelectedSeason();
  const seasonInfo = document.querySelector('.season-info') as HTMLElement;
  const title = seasonInfo.querySelector('h2') as HTMLElement;
  const timespan = seasonInfo?.querySelector('.season-timespan') as HTMLElement;

  title.textContent = `${Season[season.season]} ${season.year}`;
  let timespanText: string;
  switch (season.season) {
    case Season.Winter:
      timespanText = `01 Jan - 31 Mar`;
      break;
    case Season.Spring:
      timespanText = `01 Apr - 30 Jun`;
      break;
    case Season.Summer:
      timespanText = `01 Jul - 30 Sep`;
      break;
    case Season.Fall:
      timespanText = `1 Oct - 31 Dec`;
      break;
  }
  timespan.textContent = timespanText;
}

async function fetchSeason(currentPage: number) {
  let animes = Array.from(loadedAnimes.values());

  if (animes.length == 0) {
    const res = await animeApi.getSeason();
    animes = res.animes;
    if (res.hasError) {
      console.log('there was an error fetching animes from anilist.');
    }
  }

  if (!Array.isArray(animes)) {
    document.body.innerHTML += 'no current season found';
    return;
  }

  for (const anime of animes) {
    loadedAnimes.set(anime.id, anime);
  }

  onCurrentSeasonLoaded();
  sortItems();
  renderAllItems();
}

function onCurrentSeasonLoaded() {

  const shows = [];
  const movies = [];

  const animes = loadedAnimes.values();

  const ids = new Set<number>();

  for (const anime of animes) {
    // It could be anything if type is null but movies have less items, so it would stand out more there.
    const type = anime.format || 'Movie';
    switch (type.toLowerCase()) {
      case 'tv':
      case 'tv_short':
      case 'tv special':
      case 'ova':
      case 'ona':
        shows.push(anime);
        break;
      case 'movie':
        movies.push(anime);
        break;
      default:
        console.log('unknown type found', type);
    }
  }

  for (const anime of shows) {
    const animeItem = createAnimeItemFromAniList(anime);
    ids.add(anime.id);
    addItem('tv', animeItem);
  }

  for (const anime of movies) {
    const animeItem = createAnimeItemFromAniList(anime);
    ids.add(anime.id);
    addItem('movie', animeItem);
  }

  fetchAllModels(ids).then().catch(e => console.error('Fetching all anime models failed', e));
}

const ratingSortValues = {
  [Rating.Bad]: 0,
  [Rating.NoRating]: 1,
  [Rating.Okay]: 2,
  [Rating.Good]: 3,
}
function sortItems() {
  for (const itemsKey of Object.keys(appState.items)) {
    const items = appState.items[itemsKey as ItemsKey];
    if (!items) {
      continue;
    }

    items.sort((a: AnimeItem<AniListAnime>, b: AnimeItem<AniListAnime>): number => {
      const modelA = a.model;
      const modelB = b.model;

      const ratingA = modelA?.rating ?? Rating.NoRating;
      const ratingB = modelB?.rating ?? Rating.NoRating;

      if (ratingA !== ratingB) {
        return ratingSortValues[ratingB] > ratingSortValues[ratingA] ? 1 : -1;
      }

      return a.title.localeCompare(b.title);
    });
  }
}

function renderAllItems() {
  const itemsContainer = document.querySelector('.animes-list');
  if (!itemsContainer) {
    return;
  }

  itemsContainer.innerHTML = '';

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

function tryRenderItems(items: AnimeItem<AniListAnime>[], type: string, addLinebreak: boolean): DocumentFragment | undefined {
  if (items.length === 0) {
    return undefined;
  }

  const fragment = new DocumentFragment();

  // const itemsElement = document.createElement('div');
  // itemsElement.className = 'items';
  // itemsElement.dataset['type'] = type;

  // if (addLinebreak) {
  //   const linebreak = document.createElement('hr');
  //   fragment.appendChild(linebreak);
  // }

  for (const item of items) {
    // itemsElement.appendChild(item.cardElement);
    fragment.appendChild(item.cardElement);
  }

  // fragment.appendChild(itemsElement);
  return fragment;
}

async function fetchAllModels(ids: Set<number>): Promise<void> {
  const existing = new Set<number>(appState.animeModels.keys());
  const toFetchIds = new Set<number>();
  for (const id of ids) {
    if (!existing.has(id)) {
      toFetchIds.add(id);
    }
  }

  if (toFetchIds.size === 0) {
    return;
  }

  const payload = { ids: Array.from(toFetchIds.values()) };
  const request = await fetch('/anime/view/query', {
    method: 'post',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!request.ok) {
    console.error('Failed to fetch all models from ids', request.statusText);
  }

  const models: AnimeModel[] = await request.json();
  for (const model of models) {
    const animeItem = appState.itemsById.get(model.id);
    if (!animeItem) {
      console.log(`Did not find an anime api item for ${model.id}`, model);
      continue;
    }

    addItemModel(animeItem, model);
  }

  sortItems();
  renderAllItems();
}