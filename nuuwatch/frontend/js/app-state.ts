import { MALAnime } from './jikan/types/jikan.js';
import { JikanAPI } from './jikan/jikan.js';
import { AnimeModel } from './anime-model.js';



export interface AnimeItem {
  id: number,
  data: MALAnime;
  title: string;
  type: 'anime';
  element: HTMLElement;
  model?: AnimeModel | undefined;
}

export type ItemsKey = MALAnime['type'];
export interface AnimeAppState {
  animes: Map<number, MALAnime>;
  items: Partial<Record<ItemsKey, AnimeItem[]>>;
}

export const jikan = new JikanAPI();
jikan.settings.setBaseURLAbsolute('/anime/');


export const appState: AnimeAppState = {
  animes: new Map(),
  items: {},
}

export const addItem = (type: ItemsKey, item: AnimeItem) => {
  if (!appState.items[type]) {
    appState.items[type] = [];
  }

  appState.items[type].push(item);
}