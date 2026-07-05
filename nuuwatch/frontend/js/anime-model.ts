/**
 * Modeled after the backend SQLite model.
 */
export interface AnimeModel {
  mal_id: number;
  rating: Rating;
  search_terms: string;
  episodes_watched: number;
  status: Status;
  tags: string;
  /** Le JSON! */
  modules_data: string;
}

export enum Rating {
  Bad = 0,
  Okay = 1,
  Good = 2,
}

export enum Status {
  None = 0,
  Watching = 1,
  Completed = 2,
}

export async function fetchAnimeModel(malId: number): Promise<AnimeModel | undefined> {
  const response = await fetch(`/api/anime/view/${malId}`);

  if (response.status === 404) {
    return undefined
  }

  if (!response.ok) {
    throw new Error(`Failed to load anime model: ${response.status}`);
  }

  return await response.json();
}

export async function saveAnimeModel(model: AnimeModel): Promise<AnimeModel> {
  const response = await fetch(`/api/anime/view/${model.mal_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(model),
  });

  if (!response.ok) {
    throw new Error(`Failed to save anime model: ${response.status}`);
  }

  return await response.json();
}