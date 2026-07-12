import { loadMainPage } from './main-page.js';
import { loadAnimeViewPage } from './anime-page.js';
import { hidePopover } from './popover.js';
import { getCurrentRoute } from './router.js';

function router() {
  const [route, routes] = getCurrentRoute();

  hidePopover();

  let loaded = true;
  switch (route) {
    case 'view':
      loaded = loadViewAnime(routes as string[]);
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


