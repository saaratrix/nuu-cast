import { AnimeClient } from './anime-client.js';
import { AniListAnime, Season } from './ani-list/ani-list-types';
import { AnimeItem } from '../app-state';

export class AnimeApi {
  private client: AnimeClient = new AnimeClient();

  public async getCurrentSeason(): Promise<Season> {
    const year = 2026;
    const season = 'summer';

    const url = `/anime/seasons/${year}/${season}`;

    const data = await this.client.get(url);
    return data;
  }

  public async loadAnime(id: number): Promise<AniListAnime> {
    const url = `/anime/info/${id}`;
    const data = await this.client.get(url);
    return data;
  }
}