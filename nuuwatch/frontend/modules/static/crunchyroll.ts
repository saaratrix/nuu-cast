import { AnimeItem, appState } from '../../js/app-state.js';
import { animeItemPageModuleContentSelector } from '../../js/constants.js';
import { AnimeModel, getAnimeModel, insertOrUpdateModel, ModelUpdatedEvent } from '../../js/anime-model.js';
import { escapeHtml } from '../../js/utility.js';

interface CrunchyrollModel {
  url?: string;
}

(function() {
  let currentItem: AnimeItem | undefined = undefined;

  document.addEventListener('anime:itemChanged', (e) => {
    const event = e as CustomEvent<number | undefined>;
    const id = event.detail;
    if (id === undefined) {
      setCurrentItem(undefined);
    } else {
      addLinks(id);
    }
  });

  if (appState.activeAnimeId) {
    addLinks(appState.activeAnimeId);
  }

  function removeListeners(): void {
    if (!currentItem) {
      return;
    }

    currentItem.eventHandler.removeEventListener('anime:modelUpdated', 'crunchyroll');
  }

  function setCurrentItem(item: AnimeItem | undefined): void {
    if (item === currentItem) {
      return;
    }

    removeListeners();
    currentItem = item;
    if (!currentItem) {
      return;
    }

    currentItem.eventHandler.addEventListener('anime:modelUpdated', 'crunchyroll', onModelUpdated);
  }

  function onModelUpdated(event: ModelUpdatedEvent) {
    addLinks(event.id);
  }

  function addLinks(id: number) {
    const item = appState.itemsById.get(id);
    if (!item) {
      return;
    }

    const pageContent = document.querySelector<HTMLElement>(animeItemPageModuleContentSelector);
    if (!pageContent) {
      console.log(`Crunchyroll: Could not find element ${animeItemPageModuleContentSelector}`);
      return;
    }
    setCurrentItem(item);
    const existingContainer = pageContent.querySelector('.crunchyroll-links') as HTMLElement | null;
    if (existingContainer) {
      existingContainer.innerHTML = '';
    }

    const crunchyrollModel = item.model?.modules_data.crunchyroll as CrunchyrollModel | undefined;
    if (!item.parts.hasEnglishTitle && !crunchyrollModel?.url) {
      console.log('Not adding crunchyroll link, no english title.');
      return;
    }
    addLinksDOM(item.title || '', crunchyrollModel?.url, pageContent, existingContainer);
  }

  function addLinksDOM(keyword: string, url: string | undefined, pageContent: HTMLElement, container: HTMLElement | null): void {
    const hasContainer = !!container;

    const fragment = document.createDocumentFragment();
    if (!container) {
      container ??= document.createElement('div');
      container.className = 'crunchyroll-links';
      pageContent.appendChild(container);
    }

    const header = document.createElement('h1');
    header.innerText = 'Crunchyroll:';

    fragment.appendChild(header);

    const element = document.createElement('div');
    element.className = 'crunchyroll-link';
    if (url) {
      const escapedUrl = escapeHtml(url);
      element.innerHTML = `<a href="${escapedUrl}">${keyword}</a>`
    } else {
      const searchLink = `https://www.crunchyroll.com/search?q=${encodeURI(keyword)}`;
      element.innerHTML = `<a href=${searchLink}>${keyword}</a>`;
    }
    fragment.appendChild(element);

    const urlLabel = document.createElement('label');
    urlLabel.className = 'label-inline-flex';
    urlLabel.textContent = 'Direct url: ';
    const urlInput = document.createElement('input');
    urlInput.value = url || '';
    urlInput.addEventListener('blur', async () => {
      if (!currentItem) {
        return;
      }

      const url = urlInput.value.trim();
      if (!url.startsWith('https://www.crunchyroll.com/') && !url.startsWith('https://crunchyroll.com/')) {
        return;
      }

      // Set the item explicitly in case the current item changes while waiting for server.
      let item = currentItem;
      const model = await getAnimeModel(currentItem);

      model.modules_data.crunchyroll ??= {};

      const data = model.modules_data.crunchyroll as CrunchyrollModel;
      data.url = url;

      insertOrUpdateModel(item, model).then().catch(error => console.error(`Failed to update ${item.id} with url ${url} - ${error}`, item, model));
    });

    urlLabel.appendChild(urlInput);
    fragment.appendChild(urlLabel);

    container.appendChild(fragment);
  }

})();