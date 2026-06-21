import { loadMainPage } from './main-page-renderer.js';
import { loadAnimeViewPage } from './anime-page.js';
import { hidePopover } from './popover.js';

function router() {
  const hash = window.location.hash || '#';

  const path = hash.slice(1);
  const routes = path.split('/').filter(Boolean);

  let route ='main';
  if (path.startsWith('/view/')) {
    route = 'view'
  }

  hidePopover();

  let loaded = true;
  switch (route) {
    case 'view':
      loaded = loadViewAnime(routes);
      break;
    default:
      loadMainPage();
      break;
  }

  if (!loaded) {
    loadMainPage();
  }
}

function loadViewAnime(routes: string[]): boolean {
  const malId = Number(routes[1]);
  if (!routes[1] || Number.isNaN(malId)) {
    return false;
  }

  loadAnimeViewPage(malId).then();
  return true;
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);


