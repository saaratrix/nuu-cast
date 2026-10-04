import { AnimeClient } from './anime-client.js';
import { AniListAnime, AniListSeason } from './ani-list/ani-list-types';
import { getSelectedSeason, Season } from '../seasons.js';

export class AnimeApi {
  private client: AnimeClient = new AnimeClient();

  public async getSeason(): Promise<AniListSeason> {
    const season = getSelectedSeason();
    const seasonValue = Season[season.season].toLowerCase();

    const url = `/anime/seasons/${season.year}/${seasonValue}`;

    const data = await this.client.get(url);
    return data;
  }

  public async loadAnime(id: number): Promise<AniListAnime> {
    const url = `/anime/info/${id}`;
    const data = await this.client.get(url);
    return data;
  }
}