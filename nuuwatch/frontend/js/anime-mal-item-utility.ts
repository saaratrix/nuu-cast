import { AnimeItem, appState } from './app-state.js';
import { MALAnime } from './api/jikan/types/jikan.js';
import { escapeHtml } from './utility.js';
import { EventHandler } from './event-handler.js';
import type { AnimeCard } from './components/anime-card';
import './components/anime-card.js';

export function createAnimeItemFromMal(item: MALAnime): AnimeItem<MALAnime> {
  // Background exists along with synopsis for a shorter description.
  const { mal_id, title, title_english, url, images, broadcast, background, synopsis, score, scored_by, episodes } = item;

  const id = Number(mal_id);
  const existingItem = appState.itemsById.get(id);
  if (existingItem) {
    // <any> just for compiler for now.
    return existingItem as AnimeItem<any>;
  }
  const airing = getAiring(broadcast, 'Europe/Helsinki');
  const airingHtml = airing ? `<div class="airing">${airing}</div>` : '';

  const visualTitle = title_english || title || '';
  const escapedTitle = escapeHtml(visualTitle);
  const ratingHtml = score ? `<div class="rating">★ ${Number(score)} ${scored_by ? `(${Number(scored_by)})` : ''}</div>` : '';

  let image_url = images.webp.image_url.replace('https://myanimelist.net/images/anime/', '/anime/malimage/');
  image_url = image_url.replace('https://cdn.myanimelist.net/images/anime/', '/anime/malimage/');
  if (!image_url.startsWith('/anime/malimage/')) {
    console.log('Found image not proxied to cache.', image_url);
  }
  const siteUrl = escapeHtml(url);
  const cardElement = document.createElement('anime-card') as AnimeCard<MALAnime>;

  const animeItem: AnimeItem<MALAnime> = {
    id,
    data: item,
    title: visualTitle,
    titleEscaped: escapedTitle,
    type: 'anime',
    apiType: 'mal',
    parts: {
      visualTitle,
      rating: ratingHtml,
      airing: airingHtml,
      imageUrl: image_url,
      siteUrl,
      hasEnglishTitle: !!title_english,
    },
    cardElement,
    eventHandler: new EventHandler(),
  };

  return animeItem;
}

const weekdayMap = {
  sundays: 0,
  mondays: 1,
  tuesdays: 2,
  wednesdays: 3,
  thursdays: 4,
  fridays: 5,
  saturdays: 6,
} as const;

const weekdayFromDay = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: "Fri",
  6: 'Sat',

} as const;

function getAiring(broadcast: MALAnime['broadcast'] | undefined, targetTimeZone: string): string | undefined {
  const dayKey = broadcast?.day?.toLowerCase() as keyof typeof weekdayMap;
  let day = weekdayMap[dayKey];

  if (!day) {
    return undefined;
  }

  const [hourStr, minuteStr] = broadcast!.time?.split(':') ?? [];
  const hours = Number(hourStr);
  const minutes = Number(minuteStr);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return undefined;
  }

  const probe = new Date(2000, 0, 2, 0, 0, 0);

  // Eg '22:00'
  const probeOffset =  new Intl.DateTimeFormat('en', {
    timeZone: broadcast!.timezone,
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(probe);
  const [probeDayHours, _] = probeOffset.split(':');
  const [probeDay, probeHours] = probeDayHours!.split(' ');

  const hoursDelta = probeDay!.includes('2') ? -parseInt(probeHours!) : 24 - parseInt(probeHours!);

  let totalHours = hours + hoursDelta;
  if (totalHours < 0) {
    day--;
    totalHours += 24;
    if (day < 0) {
      day = 6;
    }
  } else if (totalHours >= 24) {
    day++;
    totalHours -= 24;
    if (day > 6) {
      day = 0;
    }
  }

  const dayStr = weekdayFromDay[day as keyof typeof weekdayFromDay];
  return `${dayStr} ${totalHours < 9 ? '0' + totalHours : totalHours}:${minuteStr}`;
}

