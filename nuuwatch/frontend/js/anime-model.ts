import { AnimeItem, appState } from './app-state.js';
import { requestModulesData } from './module-handler.js';

/**
 * Modeled after the backend SQLite model.
 */
export interface AnimeModel {
  mal_id: number;
  rating: Rating;
  comment: string;
  search_terms: string;
  episodes_watched: number;
  status: Status;
  tags: string;
  /** parsed from JSON of same name. */
  modules_data: any;
  /** If true, it's made locally and doesn't come from backend */
  isNew?: boolean
}

export enum Rating {
  NoRating = 0,
  Bad = 1,
  Okay = 2,
  Good = 3,
}

export enum Status {
  None = 0,
  Watching = 1,
  Completed = 2,
}

export interface ModelUpdatedEvent {
  id: number,
  model: AnimeModel,
}

let activePromises = new Map<number, Promise<AnimeModel>>

export function getAnimeModel(item: AnimeItem): Promise<AnimeModel> {
  if (item.model) {
    return Promise.resolve(item.model);
  }

  const activePromise = activePromises.get(item.id);
  if (activePromise) {
    return activePromise;
  }

  let promise = fetchAnimeModel(item.id).then(model => model ?? createDefaultModel(item.id))
  .then((model) => {
    activePromises.delete(item.id)
    return model;
  }).catch(error => {
    console.error(`Failed to get anime model for ${item.id}`, item, error);
    activePromises.delete(item.id);
    throw new Error(`Failed to get anime model for ${item.id} - ${error}`);
  });
  activePromises.set(item.id, promise);
  return promise;
}

export function addItemModel(item: AnimeItem, model: AnimeModel): void {
  item.model = model;
  appState.animeModels.set(item.id, model);
  item.cardElement.dispatchEvent(new CustomEvent('anime:modelUpdated', { detail: { id: item.id, model } }));
}

export function updateItemModel(item: AnimeItem, model: AnimeModel): void {
  item.model = model;
  appState.animeModels.set(item.id, model);
  item.cardElement.dispatchEvent(new CustomEvent('anime:modelUpdated', { detail: { id: item.id, model } }));
}


export async function fetchAnimeModel(malId: number): Promise<AnimeModel | undefined> {
  const response = await fetch(`/anime/view/${malId}`);

  if (response.status === 404) {
    return undefined
  }

  if (!response.ok) {
    throw new Error(`Failed to load anime model: ${response.status}`);
  }

  const model = await response.json();
  if (!model) {
    return undefined;
  }

  try {
    const modules_data = JSON.parse(model.modules_data);
    model.modules_data = modules_data;
  } catch (e) {
    model.modules_data = {};
  }

  return model;
}

export function createDefaultModel(malId: number): AnimeModel {
  return {
    mal_id: malId,
    rating: Rating.NoRating,
    comment: '',
    episodes_watched: 0,
    search_terms: '',
    status: Status.None,
    tags: '',
    modules_data: {},
    isNew: true,
  }
}

export async function insertOrUpdateModel(item: AnimeItem, model: AnimeModel): Promise<void> {
  const modules_data = {};
  requestModulesData(item, modules_data);
  model.modules_data = modules_data;

  const modules_data_json = JSON.stringify(modules_data);
  const payload = { ...model, modules_data: modules_data_json };

  if (model.isNew) {
    if (await putAnimeModel(payload)) {
      model.isNew = false;
    }
  } else {
    await patchAnimeModel(payload);
  }

  updateItemModel(item, model);
}

export async function putAnimeModel(model: AnimeModel): Promise<boolean> {
  const response = await fetch(`/anime/view/${model.mal_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(model),
  });

  if (!response.ok) {
    throw new Error(`Failed to save anime model: ${response.status}`);
  }

  const value = Number(await response.text());
  return !Number.isNaN(value) && value > 0;
}

export async function patchAnimeModel(model: AnimeModel): Promise<boolean> {
  const response = await fetch(`/anime/view/${model.mal_id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(model),
  });

  if (!response.ok) {
    throw new Error(`Failed to save anime model: ${response.status}`);
  }

  const value = Number(await response.text());
  return !Number.isNaN(value) && value > 0;
}