document.addEventListener('DOMContentLoaded', () => {
  initItems();
  initFilters();
});

/** @typdef {{tag: 'subtitle', active: boolean, items: HTMLElement[]}} Filter */
/**
 * @type {{ subtitle: Filter }}
 */
const filters = {
  subtitle: {
    tag: 'subtitle',
    active: false,
    items: []
  },
}

function initFilters() {
  const filtersElement = document.getElementById('filters');
  const filterSubtitlesButton = filtersElement.querySelector('.filter-subtitles');

  filters.subtitle.active = (localStorage.getItem('filter-subtitles') ?? '1') !== '0';
  filters.subtitle.active && filterSubtitlesButton.classList.add('active');
  filterSubtitlesButton.addEventListener('click', () => {
    const isActive = !filters.subtitle.active
    filters.subtitle.active = isActive;
    filterSubtitlesButton.classList.toggle('active');
    localStorage.setItem('filter-subtitles', isActive ? '1' : '0');
    filterItems()
  });

  filterItems();
}

function filterItems() {
  const filterList = Object.values(filters);
  /** @type {Set<HTMLButtonElement>} */
  const visibleItems = new Set();
  /** @type {Set<HTMLButtonElement>} */
  const hiddenItems = new Set();

  for (const filter of filterList) {
    const target = filter.active ? hiddenItems : visibleItems;

    for (const item of filter.items) {
      target.add(item);
    }
  }

  for (const item of hiddenItems) {
    visibleItems.delete(item);
    item.classList.add('hidden');
  }

  for (const item of visibleItems) {
    item.classList.remove('hidden');
  }
}

function initItems() {
  const items = document.querySelectorAll('.item-card');
  items.forEach(item => {
    initItem(item);
  });
}

function initItem(item) {
  /** @type {HTMLElement} */
  const actions = item.querySelector('.item-actions');
  if (!actions) {
    return;
  }

  actions.classList.add('hidden');
  initItemContextMenu(item);
  initItemTags(item);
}

/**
 * @param {HTMLElement} item
 */
function initItemContextMenu(item) {
  const contextMenuOpenEvent = 'nuucast:contextmenu:open';

  item.addEventListener('contextmenu', (e) => {
    // Note: If you right click inside contextmenu you open the native contextmenu, should allow clickthrough or something instead for better UX.

    e.preventDefault();
    document.dispatchEvent(new CustomEvent(contextMenuOpenEvent));

    const link = item.querySelector('.item-body');
    const url = link?.href;
    const filepath = link?.dataset.filePath;

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    menu.innerHTML = `
      <button class="context-menu-item" data-action="open-tab">Open in new tab</button>
      <button class="context-menu-item" data-action="rename">Rename</button>
      <button class="context-menu-item" data-action="delete">Delete</button>
    `;

    document.body.appendChild(menu);

    menu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'open-tab') {
        window.open(url, '_blank');
      } else if (action === 'rename') {
        console.log('Rename:', filepath);
      }
      menu.remove();
    });

    function removeMenu(event) {
      menu.remove();
      document.removeEventListener('click', removeMenu);
      document.removeEventListener(contextMenuOpenEvent, removeMenu);
    }

    document.addEventListener('click', removeMenu, { once: true });
    document.addEventListener(contextMenuOpenEvent, removeMenu, { once: true });
  });
}

/**
 * @param {HTMLElement} item
 */
function initItemTags(item) {
  const isDirectory = item.classList.contains('item-directory');
  const isFile = !isDirectory;

  if (!isFile) {
    return;
  }

  const link = item.querySelector('.item-body');
  const url = link?.href;

  const itemTags = [];

  const isSubtitle = url.endsWith('.vtt');
  if (isSubtitle) {
    itemTags.push(filters.subtitle.tag);
    filters.subtitle.items.push(item);
  }

  if (itemTags.length > 0) {
    item.dataset.tags = itemTags.join(' ');
  }
}