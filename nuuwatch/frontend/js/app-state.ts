import { AnimeModel } from './anime-model.js';
import { EventHandler } from './event-handler.js';
import { AnimeApi } from './api/anime-api.js';
import { AniListAnime } from './api/ani-list/ani-list-types';

export interface AnimeItemParts {
  visualTitle: string;
  rating: string;
  airing: string;
  imageUrl: string;
  siteUrl: string;
  hasEnglishTitle: boolean;
}

export type AnimeItemEvents = 'anime:modelUpdated' | 'media:updated';

export interface AnimeItem<T> {
  id: number,
  data: T;
  title: string;
  titleEscaped: string;
  type: 'anime';
  apiType: 'mal' | 'anilist',
  parts: AnimeItemParts;
  cardElement: HTMLElement;
  eventHandler: EventHandler<AnimeItemEvents>
  model?: AnimeModel;
  media?: string[];
}

// export type ItemsKey = MALAnime['type'];
// export interface AnimeAppState {
//   animes: Map<number, MALAnime>;
//   animeModels: Map<number, AnimeModel>;
//   itemsByMalId: Map<number, AnimeItem>;
//   items: Partial<Record<ItemsKey, AnimeItem[]>>;
//   activeMalId: number | undefined;
// }

export type ItemsKey = Lowercase<AniListAnime['format']>;
export interface AnimeAppState {
  animeModels: Map<number, AnimeModel>;
  itemsById: Map<number, AnimeItem<AniListAnime>>;
  items: Partial<Record<ItemsKey, AnimeItem<AniListAnime>[]>>;
  activeAnimeId: number | undefined;
}

// export const jikan = new JikanAPI();
// jikan.settings.setBaseURLAbsolute('/anime/');

export const animeApi = new AnimeApi();

export const appState: AnimeAppState = {
  animeModels: new Map(),
  itemsById: new Map(),
  items: {},
  activeAnimeId: undefined,
}

export function changeItem(id: AnimeAppState['activeAnimeId']): void {
  const before = appState.activeAnimeId;
  if (before === id) {
    return;
  }

  appState.activeAnimeId = id;
  document.dispatchEvent(new CustomEvent('anime:itemChanged', { detail: id }));
}

export const addItem = (type: ItemsKey, item: AnimeItem<AniListAnime>) => {
  appState.itemsById.set(item.id, item);

  if (!appState.items[type]) {
    appState.items[type] = [];
  }

  appState.items[type].push(item);
}

export const updateMediaFiles = (animeItem: AnimeItem<unknown>): void  => {
  animeItem.eventHandler.dispatchEvent('media:updated');
}