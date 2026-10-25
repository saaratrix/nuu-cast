import { AnimeItem } from './app-state.js';
import { AnimeModel, getAnimeModel, insertOrUpdateModel, ModelUpdatedEvent, Rating } from './anime-model.js';

export function initRatingEvents(item: AnimeItem, cardElement: HTMLElement): void {
  const ratingAction = cardElement.querySelector('.item-action.rating') as HTMLElement;
  ratingAction.addEventListener('click', async () => {
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
    setRatingColour(model);
    await insertOrUpdateModel(item, model);
  });

  item.eventHandler.addEventListener('anime:modelUpdated', 'rating', (event: ModelUpdatedEvent) => {
    if (!event) {
      return;
    }

    setRatingColour(event.model);
  });


  function setRatingColour(model: AnimeModel) {

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