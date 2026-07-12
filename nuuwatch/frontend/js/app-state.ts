import { MALAnime } from './jikan/types/jikan.js';
import { JikanAPI } from './jikan/jikan.js';
import { AnimeModel } from './anime-model.js';

export interface AnimeItemParts {
  visualTitle: string;
  rating: string;
  airing: string;
  imageUrl: string;
}

export interface AnimeItem {
  id: number,
  data: MALAnime;
  title: string;
  type: 'anime';
  parts: AnimeItemParts;
  cardElement: HTMLElement;
  model?: AnimeModel | undefined;
}

export type ItemsKey = MALAnime['type'];
export interface AnimeAppState {
  animes: Map<number, MALAnime>;
  animeModels: Map<number, AnimeModel>;
  itemsByMalId: Map<number, AnimeItem>;
  items: Partial<Record<ItemsKey, AnimeItem[]>>;
  activeMalId: number | undefined;
}

export const jikan = new JikanAPI();
jikan.settings.setBaseURLAbsolute('/anime/');

export const appState: AnimeAppState = {
  animes: new Map(),
  animeModels: new Map(),
  itemsByMalId: new Map(),
  items: {},
  activeMalId: undefined,
}

export function changeItem(malId: AnimeAppState['activeMalId']): void {
  const before = appState.activeMalId;
  if (before === malId) {
    return;
  }

  appState.activeMalId = malId;
  document.dispatchEvent(new CustomEvent('anime:itemChanged', { detail: malId }));
}

export const addItem = (type: ItemsKey, item: AnimeItem) => {
  appState.itemsByMalId.set(item.id, item);

  if (!appState.items[type]) {
    appState.items[type] = [];
  }

  appState.items[type].push(item);
}

export function addItemModel(item: AnimeItem, model: AnimeModel | undefined): void {
  if (!model) {
    return;
  }
  item.model = model;
  appState.animeModels.set(item.id, model);
  if (appState.activeMalId === item.id) {
    document.dispatchEvent(new CustomEvent('anime:modelUpdated', { detail: { id: item.id, model } }));
  }
}

export function updateItemModel(item: AnimeItem, model: AnimeModel): void {
  item.model = model;
  appState.animeModels.set(item.id, model);
  if (appState.activeMalId === item.id) {
    document.dispatchEvent(new CustomEvent('anime:modelUpdated', { detail: { id: item.id, model } }));
  }
}