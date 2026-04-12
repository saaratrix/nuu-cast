import { JikanAPI } from './jikan/jikan.js';

const jikan = new JikanAPI();
jikan.settings.setBaseURLAbsolute('/anime/');

/** @type {MALAnime[]} */
let animes = [];
let currentPage = 1;



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
  }
}

function onCurrentSeasonLoaded() {
  for (const anime of animes) {
    const { title, title_english, url, images } = anime;

    const image_url = images.webp.image_url.replace("https://myanimelist.net/images/anime/", "/anime/malimage/");
    document.body.innerHTML += `<div><a href="${url}">${title_english || title} 
    <br>
    <img src="${image_url}" width="128" height="128"></a></div>`;
  }
}

fetchCurrentSeason().then();

