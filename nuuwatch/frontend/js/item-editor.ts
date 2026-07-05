import { AnimeItem } from './app-state.js';
import { AnimeModel, fetchAnimeModel, Rating, Status } from './anime-model.js';
import { escapeHtml } from './utility.js';

export async function openEditor(
  item: AnimeItem,
  // onSave?: (updated: AnimeItem) => void,
) {
  const model = await getAnimeModel(item);
  if (!model) {
    return;
  }

  const dialog = document.createElement("dialog");

  dialog.innerHTML = `
      <form method="dialog" class="anime-editor">
        <h2>Edit Anime</h2>

        <label>
          Search Terms
          <textarea id="searchTerms" rows="6">${escapeHtml(model.search_terms)}</textarea>
          <small>One term per line</small>
        </label>

        <label>
          Tags
          <input id="tags" type="text" value="${escapeHtml(model.tags)}">
        </label>

        <label>
          Episodes Watched
          <input
              id="episodesWatched"
              type="number"
              min="0"
              value="${model.episodes_watched}">
        </label>

        <label>
          Rating
          <select id="rating">
              <option value="0">Bad</option>
              <option value="1">Okay</option>
              <option value="2">Good</option>
          </select>
        </label>

        <label>
          Status
          <select id="status">
              <option value="0">None</option>
              <option value="1">Watching</option>
              <option value="2">Completed</option>
          </select>
        </label>

        <menu>
          <button value="cancel">Cancel</button>
          <button id="saveButton" value="save">Save</button>
        </menu>
      </form>
    `;

  document.body.appendChild(dialog);

  const rating = dialog.querySelector<HTMLSelectElement>("#rating")!;
  const status = dialog.querySelector<HTMLSelectElement>("#status")!;

  rating.value = String(model.rating);
  status.value = String(model.status);

  dialog.addEventListener("close", () => {
    if (dialog.returnValue !== "save") {
      dialog.remove();
      return;
    }

    const updated: AnimeModel = {
      mal_id: item.id,
      search_terms: dialog
        .querySelector<HTMLTextAreaElement>("#searchTerms")!
        .value,

      tags: dialog
        .querySelector<HTMLInputElement>("#tags")!
        .value,

      episodes_watched: Number(
        dialog.querySelector<HTMLInputElement>("#episodesWatched")!
          .value,
      ),

      rating: Number(rating.value) as Rating,
      status: Number(status.value) as Status,
      modules_data: '',
    };

    // onSave?.(updated);
    dialog.remove();
  });

  dialog.showModal();
}

async function getAnimeModel(item: AnimeItem): Promise<AnimeModel | undefined> {
  if (item.model) {
    return item.model;
  }
  const model = await fetchAnimeModel(item.id);
  item.model = model;
  return model;
}