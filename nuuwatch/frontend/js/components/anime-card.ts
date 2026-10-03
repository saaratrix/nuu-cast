import { escapeHtml, getParsedSynopsisHTML } from '../utility.js';
import { AnimeItem, appState } from '../app-state.js';
import { AnimeModel, getAnimeModel, insertOrUpdateModel, Rating } from '../anime-model.js';
import { openEditor } from '../item-editor.js';
import { hidePopover, showPopover } from '../popover.js';
import type { Rating as NuiRating } from '../nui/rating/rating'
import { getCurrentEpisode, getTotalEpisodes, getScore, getSynopsisHTML, isAniListItem, isMalItem, getAiringAt } from '../utility-api.js';

type AnimeCardElementQueries =
  | '.body'
  | '.poster'
  | '.info'
  | '.title'
  | '.episode-count'
  | '.airing-at'
  | '.rating'
  | '.rating-text'
  | '.item-synopsis'
  | '.synopsis-metadata'
  | '.meta-title'
  | '.synopsis-rating'
  | '.synopsis-rating-value'
  | '.syn-episodes'
  | '.syn-airing'
  | '.syn-text'
  | '.actions'
  | '.action-rating'
  | '.mal-link'
  | '.mal-link a'
  | '.edit-anime';

const defaultCardWidth = '128px';

export class AnimeCard<ItemType = unknown> extends HTMLElement {
  observedAttributes = ['mal-id', 'ani-list-id'];

  shadow: ShadowRoot;

  // A wrapper for querySelector that caches the elements for faster reads, and stores them as variables.
  private elements: Partial<Record<AnimeCardElementQueries, HTMLElement>> = {};

  private dirty = {
    'item': false,
    'model': false,
    'rating': false,
    // Synopsis starts dirty and is then only rendered once as it depends entirely on the item.
    'synopsis': true,
  }

  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: 'open' });

    // .title ellipsis clamp reference: https://stackoverflow.com/questions/5269713/css-ellipsis-on-second-line
    this.shadow.innerHTML = `
      <style>
        :root {
            
        }
        
        .title, p {
            margin: 0;
        }
        
        .card {
            width: var(--card-size, ${defaultCardWidth});
        }
        
        .poster {
            width: var(--card-size, ${defaultCardWidth});
            height: calc(var(--card-size, ${defaultCardWidth}) * 1.15);
            object-fit: cover;
        }
        
        .body {
            display: inline-flex;
            flex-direction: column;
            
            color: var(--color-text-primary);
            text-decoration: none;
        }      
        
        .title {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            
            font-size: 1em;
        }           
        
        .airing-at {
            color: var(--color-text-secondary);
        }
        
        .rating {
            color: var(--color-warning);
            font-size: 1.15em;
        }
        .rating-text {
            color: var(--color-text-primary);
            font-size: 0.85em;
        }
        
        .synopsis-rating-value {
            margin: 1rem;
        }
      </style>
      <div class="card">
        <a class="body" href="">
          <img class="poster" src="">            
          <div class="info">
            <h3 class="title"></h3>
            <p class="episode-count"></p>
            <p class="airing-at" hidden></p>
            <nui-rating class="rating" style="display: none;" fill-from="bottom"><span class="rating-text"></span></nui-rating>
          </div>
        </a>
        <div class="item-synopsis" hidden>
          <div class="synopsis-metadata">
            <h4 class="meta-title"></h4>
            <hr hidden>
            <div class="synopsis-rating" style="font-size: 1.25em;">
                <nui-rating class="synopsis-rating-value" value="0" fill-from="bottom" style="color: var(--color-warning);">
                  <span style="color: var(--color-text-primary); font-size: 0.85em;">0</span>
                </nui-rating>
            </div>
            <div class="syn-episodes"></div>
            <div class="syn-airing"></div>
          </div>
          <hr style="margin: 0.33rem 0;">
          <div class="syn-text"></div>
        </div>
        <div class="actions">
          <span class="action action-rating">♥</span>
          <span class="action link" title="Goto MAL"><a href="">🔗</a></span>
          <span class="action edit-anime" title="Edit anime">✎⋮</span>
        </div>
      </div>
    `;
  }

  private _animeItem: AnimeItem<ItemType> | undefined;
  public get animeItem(): AnimeItem<ItemType> | undefined {
    return this._animeItem;
  }

  public set animeItem(value: AnimeItem<ItemType>) {
    this._animeItem = value;
    this.addEventListeners();
    this.dirty.item = true;
    this.dirty.model = !!value.model;
    this.render();
  }

  private _cardContainer: HTMLElement | null = null;
  public get cardContainer(): HTMLElement {
    return this._cardContainer ||= this.shadow.querySelector<HTMLElement>('.card') as HTMLElement;
  }

  public getElement<T = HTMLElement>(selector: AnimeCardElementQueries): T {
    if (this.elements[selector]) {
      return this.elements[selector] as T;
    }

    const element = this.shadow.querySelector<HTMLElement>(`${selector}`);
    if (!element) {
      throw new Error(`${selector} selector did not find an element`);
    }
    this.elements[selector] = element;
    return this.elements[selector] as T;
  }

  public showSetValueOrHideElement(value: string, selector: AnimeCardElementQueries) {
    const element = this.getElement(selector);
    if (value) {
      element.textContent = value;
      element.hidden = false;
    } else {
      element.textContent = '';
      element.hidden = true;
    }
  }

  connectedCallback() {
    this.addEventListeners();
    // this.dirty.item = !!this.animeItem;
    // this.dirty.model = !!this.animeItem?.model;
    this.render();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  private isListening = false;
  addEventListeners(): void {
    if (this.isListening || !this.animeItem) {
      return;
    }
    this.isListening = true;

    this.animeItem.eventHandler.addEventListener('anime:modelUpdated', 'anime-card', () => {
      this.dirty.model = true;
      this.render();
    });

    this.cardContainer.addEventListener('pointerenter', this.onPointerEnter);
    this.cardContainer.addEventListener('pointerleave', this.onPointerLeave);

    this.getElement('.action-rating').addEventListener('click', this.onRatingClick);
    this.getElement('.edit-anime').addEventListener('click', this.onEditAnimeClick);

    this.cardContainer.addEventListener('pointerenter', () => {
      this.renderSynopsis(this.animeItem!);
      showPopover(this.cardContainer, '.item-synopsis')
    });
    this.cardContainer.addEventListener('pointerleave', () => hidePopover());
  }

  removeEventListeners(): void {
    this.isListening = false;
    this.animeItem?.eventHandler.removeEventListener('anime:modelUpdated', 'anime-card');
    this.cardContainer.removeEventListener('pointerenter', this.onPointerEnter);
    this.cardContainer.removeEventListener('pointerleave', this.onPointerLeave);

    this.getElement('.action-rating').removeEventListener('click', this.onRatingClick);
    this.getElement('.edit-anime').removeEventListener('click', this.onEditAnimeClick);
  }

  attributeChangedCallback(name: string, oldValue: unknown, newValue: unknown): void {
    if (oldValue === newValue) {
      return;
    }

    if (name === 'mal-id' || name === 'ani-list-id') {
      const id = parseInt(newValue as string, 10);
      const animeItem = appState.itemsById.get(id);
      if (!animeItem) {
        return;
      }

      this.animeItem = animeItem as AnimeItem<ItemType>;
    }
  }

  // ------------------------------------------------
  // --------------- Event Methods ------------------

  private readonly onPointerEnter = () => {
    this.renderSynopsis(this.animeItem!);
    showPopover(this.cardContainer, '.item-synopsis');
  };

  private readonly onPointerLeave = () => {
    hidePopover();
  };

  private readonly onRatingClick = async () => {
    if (!this.animeItem) return;

    const item = this.animeItem;
    const model = await getAnimeModel(item);

    switch (model.rating) {
      case Rating.NoRating:
        model.rating = Rating.Okay;
        break;
      case Rating.Okay:
        model.rating = Rating.Good;
        break;
      case Rating.Good:
        model.rating = Rating.Bad;
        break;
      case Rating.Bad:
        model.rating = Rating.NoRating;
        break;
    }

    this.dirty.rating = true;

    this.setRatingColour(model);
    await insertOrUpdateModel(item, model);
  };

  private readonly onEditAnimeClick = () => {
    if (this.animeItem) {
      void openEditor(this.animeItem);
    }
  };

  // ----------------End of Event Methods--------------
  // --------------------------------------------------

  render() {
    const item = this.animeItem;
    if (!item) {
      return;
    }

    // Item only updates once, when it's first rendered.
    this.renderItem(item);
    this.renderModel(item, item.model);
    this.setRatingColour(item.model);
  }

  renderItem(item: AnimeItem<ItemType>) {
    if (!this.dirty.item) {
      return;
    }

    this.dirty.item = false;

    this.getElement<HTMLAnchorElement>('.body').href = `#/view/${item.id}`;

    this.getElement<HTMLImageElement>('.poster').src = item.parts.imageUrl;
    this.getElement('.title').textContent = item.title;

    const currentEpisode = getCurrentEpisode(item);
    const totalEpisodes = getTotalEpisodes(item);

    const episodesText = this.getEpisodesText(currentEpisode, totalEpisodes);
    this.showSetValueOrHideElement(episodesText, '.episode-count');

    const airing = getAiringAt(item);
    this.showSetValueOrHideElement(airing, '.airing-at');

    const rating = getScore(item);
    if (rating > 0) {
      const ratingElement = this.getElement<NuiRating>('.rating');
      const ratingText = this.getElement('.rating-text');
      ratingElement.setAttribute('value', (rating / 10).toString());
      ratingText.textContent = rating.toString();
      ratingElement.style.display = '';
    }

  }

  renderModel(item: AnimeItem<ItemType>, model: AnimeModel | undefined) {
    if (!this.dirty.model || !model) {
      return;
    }

    this.dirty.model = false;
  }

  renderSynopsis(item: AnimeItem<ItemType>): void {
    if (!this.dirty.synopsis) {
      return;
    }

    // const synopsisMetadata = this.getElement<HTMLElement>('.synopsis-metadata');
    const synopsisTitle = this.getElement('.meta-title');
    const synopsisRatingValue = this.getElement<NuiRating>('.synopsis-rating-value');
    const synopsisEpisodes = this.getElement('.syn-episodes');
    const synopsisAiring = this.getElement('.syn-airing');

    const synopsisText = this.getElement<HTMLElement>('.syn-text');

    synopsisTitle.textContent = item.title;
    const score = getScore(item);
    const synopsisRatingText = synopsisRatingValue.querySelector('span') as HTMLElement;
    synopsisRatingText.textContent = score.toString();
    // Normalize between 0 -> 1.
    synopsisRatingValue.setAttribute('value', (score / 10).toString());

    // convert null to 0.
    const episodes = getTotalEpisodes(item)
    const currentEpisode = getCurrentEpisode(item);
    const episodesText = episodes > 0 ? episodes.toString() : '??';
    synopsisEpisodes.textContent = `Episodes: ${Number(currentEpisode)} / ${episodesText}`;
    synopsisAiring.textContent = getAiringAt(item);

    const synopsisHTML = getSynopsisHTML(item);
    synopsisText.innerHTML = synopsisHTML;

    this.dirty.synopsis = false;
  }

  getEpisodesText(current: number | null, total: number): string {
    if (current) {
      if (current >= total) {
        return `${current} Episodes`;
      } else {
        return `Ep ${current} / ${total}`
      }
    } else {
      if (total > 0) {
        return `${total} Episodes`;
      }
    }

    return '';
  }

  setRatingColour(model: AnimeModel | undefined) {
    if (!this.dirty.rating || !model) {
      return;
    }

    this.dirty.rating = false;

    const ratingAction = this.getElement('.action-rating');
    let className = `rating-${Rating[model.rating].toLowerCase()}`;
    const oldClass = ratingAction.dataset['ratingClass'];
    oldClass && ratingAction.classList.remove(oldClass);
    ratingAction.classList.add(className);
    ratingAction.dataset['ratingClass'] = className;

    let title = Rating[model.rating];
    if (title === Rating[Rating.NoRating]) {
      title = 'Not rated.';
    }
    ratingAction.title = title;
  }

}

customElements.define('anime-card', AnimeCard);