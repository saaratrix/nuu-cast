import { jikan, appState, addItem, AnimeItem, ItemsKey, changeItem } from './app-state.js';
import { MALAnime } from './jikan/types/jikan.js';
import { createAnimeItem } from './anime-item-utility.js';
import { addItemModel, AnimeModel } from './anime-model.js';

export function loadMainPage() {
  let currentPage = 1;

  const pageContainer = document.querySelector('.page-container');
  if (!pageContainer) {
    return;
  }

  changeItem(undefined);
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

  const malIds = new Set<number>();

  for (const anime of animes) {
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

  for (const anime of shows) {
    const animeItem = createAnimeItem(anime);
    malIds.add(anime.mal_id);
    addItem('TV', animeItem);
  }

  for (const anime of movies) {
    const animeItem = createAnimeItem(anime);
    malIds.add(anime.mal_id);
    addItem('Movie', animeItem);
  }

  fetchAllModels(malIds).then().catch(e => console.error('Fetching all anime models failed', e));
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

async function fetchAllModels(malIds: Set<number>): Promise<void> {
  const existing = new Set<number>(appState.animeModels.keys());
  const toFetchIds = new Set<number>();
  for (const id of malIds) {
    if (!existing.has(id)) {
      toFetchIds.add(id);
    }
  }

  if (toFetchIds.size === 0) {
    return;
  }

  const payload = { mal_ids: Array.from(toFetchIds.values()) };
  const request = await fetch('/anime/view/query', {
    method: 'post',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!request.ok) {
    console.error('Failed to fetch all models from malIds', request.statusText);
  }

  const models: AnimeModel[] = await request.json();
  for (const model of models) {
    const animeItem = appState.itemsByMalId.get(model.mal_id);
    if (!animeItem) {
      console.log(`Did not find a MAL item for ${model.mal_id}`, model);
      continue;
    }

    addItemModel(animeItem, model);
  }
}