import { JikanAPI } from './jikan/jikan.js';

const jikan = new JikanAPI();
jikan.settings.setBaseURLAbsolute('/anime/');

/** @type {MALAnime[]} */
let animes = [];
let currentPage = 1;

let items = [];


async function fetchCurrentSeason() {
  const res = await jikan.loadCurrentSeason(currentPage);
  console.log(res);
  const { pagination, data } = res;

  animes.push(...data);
  if (!Array.isArray(data)) {
    document.body.innerHTML += 'no current season found';
    return;
  }

  if (currentPage < pagination.last_visible_page) {
    currentPage++;
    setTimeout(() => {
      fetchCurrentSeason().then();
    }, 0.5);
  } else {
    onCurrentSeasonLoaded();
    renderItems();
  }
}

function onCurrentSeasonLoaded() {

  for (const anime of animes) {
    const { title, title_english, url, images, synopsis } = anime;

    const image_url = images.webp.image_url.replace("https://myanimelist.net/images/anime/", "/anime/malimage/");

    const itemCardElement = document.createElement('div');
    itemCardElement.className = 'item-card';
    itemCardElement.innerHTML = `
<a href="${url}">${title_english || title}
  <br>
    <img src="${image_url}" width="128" height="128">
      <div class="item-synopsis invisible">
        ${synopsis}
      </div>
</a>`;
    itemCardElement.addEventListener('pointerover', () => {
      const synopsisElement = itemCardElement.querySelector('.item-synopsis');
      synopsisElement && synopsisElement.classList.remove('invisible');
    });
    itemCardElement.addEventListener('pointerleave', () => {
      const synopsisElement = itemCardElement.querySelector('.item-synopsis');
      synopsisElement && synopsisElement.classList.add('invisible');
    });

    items.push({
      data: anime,
      type: 'anime',
      element: itemCardElement,
    });
  }
}

function renderItems() {
  const itemsWrapper = document.querySelector('.items');
  if (!itemsWrapper) {
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of items) {
    fragment.appendChild(item.element);
  }

  itemsWrapper.appendChild(fragment);
}

fetchCurrentSeason().then();

