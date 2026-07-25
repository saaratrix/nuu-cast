import { createSSEPostRequest } from './sse-handler.js';

export interface FetchItem {
  url: string;
  base_name: string;
  file_name: string;
}

export async function fetchAnimeResource(data: FetchItem): Promise<void> {

  createSSEPostRequest('/anime/fetch', data).then(result => console.log(`${result}`));
}
