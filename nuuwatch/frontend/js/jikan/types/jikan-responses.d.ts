import { MALAnime, Pagination } from './jikan';

export interface CurrentSeasonResponse {
  pagination: Pagination;
  data: MALAnime[];
}