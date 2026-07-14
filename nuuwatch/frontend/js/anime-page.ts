import { AnimeItem, appState, changeItem, jikan } from './app-state.js';
import { escapeHtml } from './utility.js';
import { loadModules } from './module-handler.js';
import { gotoRoute } from './router.js';
import { openEditor } from './item-editor.js';
import { createAnimeItem } from './anime-item-utility.js';
import { addItemModel, AnimeModel, fetchAnimeModel, getAnimeModel, tryInitializeAnimeModel } from './anime-model.js';

async function loadAnimeViewPage(malId: number) {
  const pageContainer = document.querySelector('.page-container');
  if (!pageContainer) {
    return gotoMain();
  }

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
    await tryInitializeAnimeModel(animeItem);
    document.removeEventListener('anime:itemChanged', onChanged);
    if (itemChanged) {
      return;
    }
  } catch (e) {
    pageContainer.innerHTML = `
      <div class="error"><p>Failed to load anime from MAL: ${e}</p></div>
    `;
    changeItem(undefined);
    return;
  }

  if (!animeItem) {
    return gotoMain();
  }

  pageContainer.innerHTML = `
    <div class="anime-item-page">
      <header>
        <h1><a href="${animeItem.data.url}">${animeItem.title}</a></h1>
      </header>
      <section>
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
    </div>
  `;

  const editButton = pageContainer.querySelector('.edit-button');
  editButton?.addEventListener('click', () => openEditor(animeItem));

  changeItem(malId);
}

export default loadAnimeViewPage

function gotoMain() {
  changeItem(undefined);
  gotoRoute('main');
}

async function getMalAnimeItem(malId: number): Promise<AnimeItem> {
  let animeItem = appState.itemsByMalId.get(malId);
  if (animeItem) {
    return animeItem;
  }

  return loadMalItem(malId);
}

async function loadMalItem(malId: number): Promise<AnimeItem> {
  const request = jikan.loadAnime(malId, 'full', {});
  const response = await request;

  const malItem = response.data;
  const animeItem = createAnimeItem(malItem);
  appState.itemsByMalId.set(malId, animeItem);
  return animeItem;
}