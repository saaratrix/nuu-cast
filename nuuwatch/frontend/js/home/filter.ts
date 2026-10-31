import type { AniListAnime } from '../api/ani-list/ani-list-types';
import type { AnimeCard } from '../components/anime-card';
import { AnimeItem, ItemsKey } from '../app-state';

interface CardFilter {
  showAdult: boolean;
  allowedFormats: Set<ItemsKey>;
  buttons: {
    all: HTMLButtonElement | undefined,
    formats: Map<AniListAnime['format'], HTMLButtonElement>,
    adult: HTMLButtonElement | null,
  }
}

export const activeFilter: CardFilter = {
  showAdult: false,
  allowedFormats: new Set<ItemsKey>(),
  buttons: {
    all: undefined,
    formats: new Map(),
    adult: null,
  }
}

export function updateFilterButtons(items: Partial<Record<ItemsKey, AnimeItem<AniListAnime>[]>>) {
  const rootContainer = document.querySelector('.season-info-categories-header') as HTMLElement;

  updateCategoryFilterButtons(rootContainer, items);

  updateAdultFilterButton(rootContainer, items);
  updateFilterButtonStates();
}

function updateCategoryFilterButtons(rootContainer: HTMLElement, items: Partial<Record<ItemsKey, AnimeItem<AniListAnime>[]>>): void {
  const categories = rootContainer.querySelector('.categories') as HTMLElement;
  const categoryButtons = categories.querySelectorAll('button');
  // Get the all categories button and something something.
  const allCategoriesButton = tryInitCategories(rootContainer);

  activeFilter.buttons.formats.clear();

  const formats = new Set<ItemsKey>(Object.keys(items) as ItemsKey[]);
  if (formats.size <= 1) {
    return;
  }

  let totalItems = 0;
  for (const button of categoryButtons) {
    const format = button.dataset['format'] as ItemsKey;
    if (!formats.has(format)) {
      // Don't delete the all button, it always exists!
      if (button !== allCategoriesButton) {
        categories.removeChild(button);
      }
    } else {
      formats.delete(format);
      const buttonText = format.replace('tv', 'TV');
      button.textContent = `${buttonText} (${items[format]!.length})`;
      totalItems += items[format]!.length;

      activeFilter.buttons.formats.set(format, button);
    }
  }

  // Remaining formats of active items
  for (const format of formats) {
    const button = document.createElement('button');
    button.classList.add('btn', 'btn-primary');
    button.dataset['format'] = format;
    const buttonText = format.replace('tv', 'TV');
    button.textContent = `${buttonText} (${items[format]!.length})`;
    totalItems += items[format]!.length;

    button.addEventListener('click', onCategoryClick, false);
    categories.appendChild(button);

    activeFilter.buttons.formats.set(format, button);
  }

  allCategoriesButton.textContent = `All (${totalItems})`;
  allCategoriesButton.addEventListener('click', onAllCategoriesClick, false);
}

function updateAdultFilterButton(rootContainer: HTMLElement, items: Partial<Record<ItemsKey, AnimeItem<AniListAnime>[]>>): void {
  const filters = rootContainer.querySelector('.filters') as HTMLElement;
  const formats = Object.keys(items);

  // Should probably be just hidden all the time, besides when testing :D they were usually 404.
  let adultContentCount = 0;
  for (const key of formats) {
    for (const item of items[key as ItemsKey]!) {
      if (item.data.isAdult) {
        adultContentCount++;
      }
    }
  }

  let adultButton = filters.querySelector<HTMLButtonElement>('.hide-adult');
  if (adultContentCount > 0) {
    if (!adultButton) {
      adultButton = document.createElement('button');
      adultButton.classList.add('btn', 'btn-primary', 'hide-adult');
      adultButton.addEventListener('click', function() {
        activeFilter.showAdult = !activeFilter.showAdult;
        document.dispatchEvent(new CustomEvent('filterChange'));
      });
      filters.appendChild(adultButton);
    }

    adultButton.textContent = `Show Adult (${adultContentCount})`;
  } else {
    if (adultButton) {
      filters.removeChild(adultButton);
      adultButton = null;
    }
  }

  activeFilter.buttons.adult = adultButton;
}

function tryInitCategories(categoriesElement: HTMLElement): HTMLButtonElement {
  if (activeFilter.buttons.all) {
    return activeFilter.buttons.all;
  }

  const allCategoriesButton = categoriesElement.querySelector('.category-all') as HTMLButtonElement;
  if (!allCategoriesButton) {
    throw new Error("All categories button not found, fix yo code!");
  }
  activeFilter.buttons.all = allCategoriesButton;
  return allCategoriesButton;
}

function onAllCategoriesClick(this: HTMLButtonElement) {
  activeFilter.allowedFormats.clear();
  document.dispatchEvent(new CustomEvent('filterChange'));
}

function onCategoryClick(this: HTMLButtonElement) {
  const format = this.dataset['format'] as ItemsKey;
  const addFilter = !activeFilter.allowedFormats.has(format);
  addFilter ? activeFilter.allowedFormats.add(format) : activeFilter.allowedFormats.delete(format);
  document.dispatchEvent(new CustomEvent('filterChange'));
}

function updateFilterButtonStates() {
  const { allowedFormats, showAdult, buttons } = activeFilter;
  buttons.all?.classList.toggle('active', allowedFormats.size === 0);
  buttons.formats?.forEach(button => {
    const format = button.dataset['format'] as ItemsKey;
    button.classList.toggle('active', allowedFormats.has(format));
  });
  buttons.adult?.classList.toggle('active', showAdult);

}

export function onFilterChange() {
  const itemsContainer = document.querySelector('.animes-list');
  const cards = itemsContainer?.querySelectorAll<AnimeCard<AniListAnime>>('anime-card');
  if (!cards) {
    return;
  }

  updateFilterButtonStates();

  const filterSettings = activeFilter;

  // A filter returns true if it should be filtered/hidden.
  const filters: Array<(card: AnimeCard<AniListAnime>) => boolean> = [];
  if (!filterSettings.showAdult) {
    filters.push(filterHideAdult);
  }
  if (filterSettings.allowedFormats.size > 0) {
    filters.push(filterByFormats(filterSettings.allowedFormats));
  }

  for (const card of cards) {
    card.hidden = filters.some(f => f(card));
  }
}

function filterHideAdult(card: AnimeCard<AniListAnime>): boolean {
  return card.animeItem!.data.isAdult;
}

function filterByFormats(allowedTypes: Set<AniListAnime['format']>): (card: AnimeCard<AniListAnime>) => boolean {
  return function(card: AnimeCard<AniListAnime>) {
    return !allowedTypes.has(card.animeItem!.data.format);
  }
}