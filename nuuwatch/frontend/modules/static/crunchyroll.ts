import { appState } from '../../js/app-state.js';
import { animeItemPageContentSelector } from '../../js/constants.js';

(function() {
  document.addEventListener('anime:itemChanged', (e) => {
    const event = e as CustomEvent<number | undefined>;
    const malId = event.detail;
    if (malId === undefined) {

    } else {
      addLinks(malId);
    }
  });

  if (appState.activeMalId) {
    addLinks(appState.activeMalId);
  }

  function addLinks(malId: number) {
    const item = appState.itemsByMalId.get(malId);
    if (!item) {
      return;
    }
    const pageContent = document.querySelector<HTMLElement>(animeItemPageContentSelector);
    if (!pageContent) {
      console.log(`Crunchyroll: Could not find element ${animeItemPageContentSelector}`);
      return;
    }

    if (!item.data.title_english) {
      console.log('Not adding crunchyroll link, no english title.');
      return;
    }

    addLinksDOM(item.data.title_english, pageContent);
  }

  function addLinksDOM(keyword: string, pageContent: HTMLElement): void {
    const fragment = document.createDocumentFragment();

    const container = document.createElement('div');
    container.className = 'crunchyroll-links';
    fragment.appendChild(container);

    const header = document.createElement('h1');
    header.innerText = 'Crunchyroll links:';

    container.appendChild(header);

    const searchLink = `https://www.crunchyroll.com/search?q=${encodeURI(keyword)}`;
    const element = document.createElement('div');
    element.className = 'crunchyroll-link';

    element.innerHTML = `<a href=${searchLink}>${keyword}</a>`;
    container.appendChild(element);

    pageContent.appendChild(fragment);
  }

})();