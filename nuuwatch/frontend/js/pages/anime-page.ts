import { AnimeItem, AnimeItemParts, appState, changeItem, jikan, updateMediaFiles } from '../app-state.js';
import { escapeHtml } from '../utility.js';
import { loadModules } from '../module-handler.js';
import { gotoRoute } from '../routing/router.js';
import { openEditor } from '../item-editor.js';
import { createAnimeItem } from '../anime-item-utility.js';
import { tryInitializeAnimeModel } from '../anime-model.js';
import { nuucastBaseUrl } from '../constants.js';
import { ProgressStatus } from '../nui/progress-status/progress-status.js';
import { loadHTML } from '../routing/layout-loader.js';

const useNewLoading = false;

export async function loadAnimeViewPage(malId: number) {
  if (useNewLoading) {
    doNewDesignLoading(malId);
  } else {
    doOldLoading(malId);
  }
}

function gotoMain() {
  changeItem(undefined);
  gotoRoute('main');
}

async function doNewDesignLoading(malId: number) {
  const pageContainer = document.querySelector('.page-container') as HTMLElement;
  let animeBody: HTMLElement | null = pageContainer.querySelector('.anime-body');
  let animeInfo: HTMLElement | null = null;
  let loadingContent: HTMLElement | null = null;

  document.body.className = 'anime-page';

  const abortController = new AbortController();
  // This can be pending in the background while we continue to load more.
  // If this finishes first the HTML will have a loading spinner that it's waiting for the rest.
  let loadHTMLPromise: Promise<void> | Promise<string>;
  if (!animeBody) {
    loadHTMLPromise = loadHTML('anime', abortController.signal, '.page-container');
  } else {
    loadHTMLPromise = Promise.resolve();
    animeInfo = pageContainer.querySelector('.anime-info') as HTMLElement;
    loadingContent = pageContainer.querySelector('.loading-content') as HTMLElement;

    loadingContent.removeAttribute('hidden');
    animeInfo.setAttribute('hidden', '');
    animeBody.setAttribute('hidden', '');
  }

  loadHTMLPromise.catch(() => {
    abortController.abort("Failed to load html");
    gotoMain();
  });

  loadModules('anime').then(result => console.log(`${result ? 'succesfully loaded' : 'failed to load'} module anime `));
  loadModules('crunchyroll').then(result => console.log(`${result ? 'succesfully loaded' : 'failed to load'} module crunchyroll`));

  let animeItem: AnimeItem | undefined;
  let itemChanged = false;
  try {
    const onChanged = () => {
      itemChanged = true;
    };
    document.addEventListener('anime:itemChanged', onChanged, { once: true });

    animeItem = await getMalAnimeItem(malId);
    document.title = animeItem.title;
    await tryInitializeAnimeModel(animeItem);
    document.removeEventListener('anime:itemChanged', onChanged);
    if (itemChanged) {
      return;
    }
  } catch (e) {
    abortController.abort('Failed to load mal item');
    pageContainer.innerHTML = `
      <div class="error"><p>Failed to load anime from MAL: ${e}</p></div>
    `;
    changeItem(undefined);
    return;
  }

  if (!animeItem) {
    return gotoMain();
  }
  await loadHTMLPromise;

  loadingContent ||= pageContainer.querySelector('.loading-content');
  animeInfo ||= pageContainer.querySelector('.anime-info');
  animeBody ||= pageContainer.querySelector('.anime-body');

  if (!animeInfo || !animeBody || !loadingContent) {
    console.log('missing animeInfo container', animeInfo, 'or body', animeBody, 'or loading content', loadingContent);
    return gotoMain();
  }

  loadingContent.setAttribute('hidden', '');
  animeInfo.removeAttribute('hidden');
  animeBody.removeAttribute('hidden');

  updateAnimeInfo(animeInfo, animeItem);
  updateAnimeBody(animeBody, animeItem);
  updateBackground();

  // animeItem.eventHandler.addEventListener('media:updated', 'anime-media', () => updateMediaSection(animeItem, animeBody), true);
  changeItem(malId);
  updateMediaFiles(animeItem);
}

async function doOldLoading(malId: number) {
  const container = document.querySelector<HTMLElement>('.page-container');
  if (!container) {
    return gotoMain();
  }

  document.body.className = 'anime-page';
  container.innerHTML = `<progress-status active><p slot="content">Loading ...</p></progress-status>`

  loadModules('anime').then(result => console.log(`${result ? 'succesfully loaded' : 'failed to load'} module anime `));
  loadModules('crunchyroll').then(result => console.log(`${result ? 'succesfully loaded' : 'failed to load'} module crunchyroll`));

  let animeItem: AnimeItem | undefined;
  let itemChanged = false;
  try {
    const onChanged = () => {
      itemChanged = true;
    };
    document.addEventListener('anime:itemChanged', onChanged, { once: true });

    animeItem = await getMalAnimeItem(malId);
    document.title = animeItem.title;
    await tryInitializeAnimeModel(animeItem);
    document.removeEventListener('anime:itemChanged', onChanged);
    if (itemChanged) {
      return;
    }
  } catch (e) {
    container.innerHTML = `
      <div class="error"><p>Failed to load anime from MAL: ${e}</p></div>
    `;
    changeItem(undefined);
    return;
  }

  if (!animeItem) {
    return gotoMain();
  }

  container.innerHTML = `
    <div class="anime-item-page">
      <header>
        <h1><a href="${animeItem.data.url}">${animeItem.titleEscaped}</a></h1>
      </header>
      <section class="anime-info">
        <div>
            ${animeItem.parts.rating} - ${animeItem.parts.airing}
        </div>
        <div>
            <img src="${escapeHtml(animeItem.parts.imageUrl)}" width="128" height="128" >
        </div>
        <div>
            <button class="edit-button">Edit anime</button>
        </div>
        <div class="content"></div>
      </section>
      <section class="media">
        <h1>Videos</h1>
        <progress-status active size="1.5em">
            <span slot="content">Loading videos...</span>
        </progress-status>
        <div class="media-videos"></div>
      </section>
      <section class="modules">
        <div class="module-content"></div>
      </section>
    </div>
  `;

  const editButton = container.querySelector('.edit-button');
  editButton?.addEventListener('click', () => openEditor(animeItem));

  animeItem.eventHandler.addEventListener('media:updated', 'anime-media', () => updateMediaSection(animeItem, container), true);

  changeItem(malId);
  updateMediaFiles(animeItem);
}

async function getMalAnimeItem(malId: number): Promise<AnimeItem> {
  let animeItem = appState.itemsByMalId.get(malId);
  if (animeItem) {
    return animeItem;
  }

  return loadMalItem(malId);
}

function updateAnimeInfo(animeInfo: HTMLElement, animeItem: AnimeItem) {
  const poster = animeInfo.querySelector('.poster') as HTMLImageElement;
  poster.src = animeItem.parts.imageUrl;
}

function updateAnimeBody(animeBody: HTMLElement, animeItem: AnimeItem) {

}

function updateBackground() {

}

async function loadMalItem(malId: number): Promise<AnimeItem> {
  const request = jikan.loadAnime(malId, 'full', {});
  const response = await request;

  const malItem = response.data;
  const animeItem = createAnimeItem(malItem);
  appState.itemsByMalId.set(malId, animeItem);
  return animeItem;
}

async function updateMediaSection(item: AnimeItem, itemContainer: HTMLElement) {
  const section = itemContainer.querySelector<HTMLElement>('.media')!;
  const videosElement = section.querySelector<HTMLElement>('.media-videos')!;
  const spinner = section.querySelector<ProgressStatus>('progress-status');
  spinner?.setAttribute('active', '');

  const files = await fetchMediaFiles(item, videosElement).then();

  spinner?.removeAttribute('active');
  // As the fetch can take a little while, maybe id changed.
  if (appState.activeMalId !== item.id) {
    return;
  }

  videosElement.innerHTML = '';
  const fragment = document.createDocumentFragment();
  const listElement = document.createElement('li');
  listElement.className = 'media-list';

  for (const file of files) {
    const listItemElement = document.createElement('ul');
    listItemElement.innerHTML = `<a href="${nuucastBaseUrl}/${encodeURI(file)}" class="media-link">${file}</a>`;
    listElement.appendChild(listItemElement);
  }

  fragment.appendChild(listElement);
  videosElement.appendChild(fragment);
}

async function fetchMediaFiles(item: AnimeItem, videosElement: HTMLElement) {
  if (item.media) {
    return item.media;
  }

  const response = await fetch(`/media/files/${item.title}`, {
    method: 'GET',
    headers: {
      "Content-Type": 'application/json',
    }
  });
  if (!response.ok) {
    console.log(`Failed to fetch media files for ${item.title}`);
    return [];
  }
  let files: string[] = await response.json();
  files = files.filter(file => file.endsWith('.mp4'));

  item.media = files;
  return item.media;
}