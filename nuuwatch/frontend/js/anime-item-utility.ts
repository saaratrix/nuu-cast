import { AnimeItem, appState } from './app-state.js';
import { MALAnime } from './jikan/types/jikan.js';
import { escapeHtml } from './utility.js';
import { hidePopover, showPopover } from './popover.js';
import { openEditor } from './item-editor.js';
import { AnimeModel, getAnimeModel, insertOrUpdateModel, ModelUpdatedEvent, Rating } from './anime-model.js';

export function createAnimeItem(item: MALAnime): AnimeItem {
  // Background exists along with synopsis for a shorter description.
  const { mal_id, title, title_english, url, images, broadcast, background, synopsis, score, scored_by, episodes } = item;

  const id = Number(mal_id);
  const existingItem = appState.itemsByMalId.get(id);
  if (existingItem) {
    return existingItem;
  }
  const airing = getAiring(broadcast, 'Europe/Helsinki');
  const airingHtml = airing ? `<div class="airing">${airing}</div>` : '';

  const visualTitle = escapeHtml(title_english || title || '');
  const titleHtml = `<div class="meta-title">${visualTitle}</div>`
  const ratingHtml = score ? `<div class="rating">★ ${Number(score)} ${scored_by ? `(${Number(scored_by)})` : ''}</div>` : '';
  const episodesHtml = episodes ? `<div class="episodes">${Number(episodes)} Episodes</div>` : '';
  const synopsisText = (synopsis || background || '').replace(/\r?\n/g, '<br>');

  let image_url = images.webp.image_url.replace('https://myanimelist.net/images/anime/', '/anime/malimage/');
  image_url = image_url.replace('https://cdn.myanimelist.net/images/anime/', '/anime/malimage/');
  if (!image_url.startsWith('/anime/malimage/')) {
    console.log('Found image not proxied to cache.', image_url);
  }

  const metalinebreakHtml = (!!ratingHtml || !!episodesHtml || !!airingHtml) ? '<hr>' : '';

  const viewAnimeUrl = `#/view/${id}`;

  const itemCardElement = document.createElement('div');
  itemCardElement.className = 'item-card';
  itemCardElement.innerHTML = `
  <a class="item-body" href="${viewAnimeUrl}">
      <span class="title">${visualTitle}</span>
      <img src="${escapeHtml(image_url)}" width="128" height="128">            
  </a>
  <div class="item-synopsis" hidden>
        <div class="synopsis-metadata">
          ${titleHtml}
          ${metalinebreakHtml}
          ${ratingHtml}
          ${episodesHtml}            
          ${airingHtml}
        </div>
        <hr>
        <div class="synopsis-text">
            ${escapeHtml(synopsisText)}
        </div>
      </div>
  <div class="item-actions">
    <span class="item-action rating">♥</span>
    <span class="item-action mal-link" title="Goto MAL"><a href="${escapeHtml(url)}">🔗</a></span>
    <span class="item-action edit-anime" title="Edit anime">✎⋮</span>
  </div>
`;

  const animeItem: AnimeItem = {
    id,
    data: item,
    title: visualTitle,
    type: 'anime',
    parts: {
      visualTitle,
      rating: ratingHtml,
      airing: airingHtml,
      imageUrl: image_url,
    },
    cardElement: itemCardElement,
  };

  itemCardElement.addEventListener('pointerenter', () => showPopover(itemCardElement));
  itemCardElement.addEventListener('pointerleave', () => hidePopover());

  initRatingEvents(animeItem, itemCardElement);

  const editAnimeBtn = itemCardElement.querySelector<HTMLElement>('.edit-anime');
  editAnimeBtn?.addEventListener('click', () => openEditor(animeItem));

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

function initRatingEvents(item: AnimeItem, cardElement: HTMLElement): void {
  const ratingAction = cardElement.querySelector('.item-action.rating') as HTMLElement;
  ratingAction.addEventListener('click', async () => {
    const model = await getAnimeModel(item);

    switch (model.rating) {
      case Rating.NoRating:
        model.rating = Rating.Okay;
        break;
      case Rating.Okay:
        model.rating = Rating.Good;
        break;
      case Rating.Good:
        model.rating = Rating.Bad;
        break;
      case Rating.Bad:
        model.rating = Rating.NoRating;
        break;
    }
    setRatingColour(model);
    await insertOrUpdateModel(item, model);
  });

  cardElement.addEventListener('anime:modelUpdated', (e) => {
    const event = (e as CustomEvent<ModelUpdatedEvent>)
    if (!event.detail.model) {
      return;
    }

    setRatingColour(event.detail.model);
  });

  function setRatingColour(model: AnimeModel) {

    let className = `rating-${Rating[model.rating].toLowerCase()}`;
    const oldClass = ratingAction.dataset['ratingClass'];
    oldClass && ratingAction.classList.remove(oldClass);
    ratingAction.classList.add(className);
    ratingAction.dataset['ratingClass'] = className;

    let title = Rating[model.rating];
    if (title === Rating[Rating.NoRating]) {
      title = 'Not rated.';
    }
    ratingAction.title = title;
  }
}