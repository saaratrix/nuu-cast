import { MALAnime } from './jikan/types/jikan.js';
import { JikanAPI } from './jikan/jikan.js';
import { AnimeModel } from './anime-model.js';
import { EventHandler } from './event-handler.js';

export interface AnimeItemParts {
  visualTitle: string;
  rating: string;
  airing: string;
  imageUrl: string;
}

export type AnimeItemEvents = 'anime:modelUpdated' | 'media:updated';

export interface AnimeItem {
  id: number,
  data: MALAnime;
  title: string;
  titleEscaped: string;
  type: 'anime';
  parts: AnimeItemParts;
  cardElement: HTMLElement;
  eventHandler: EventHandler<AnimeItemEvents>
  model?: AnimeModel;
  media?: string[];
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

export const updateMediaFiles = (animeItem: AnimeItem): void  => {
  animeItem.eventHandler.dispatchEvent('media:updated');
}