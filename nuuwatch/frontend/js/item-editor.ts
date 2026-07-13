import { AnimeItem } from './app-state.js';
import { AnimeModel, getAnimeModel, insertOrUpdateModel, patchAnimeModel, putAnimeModel, Rating, Status, updateItemModel } from './anime-model.js';
import { escapeHtml } from './utility.js';
import { requestModulesData } from './module-handler.js';

export async function openEditor(
  item: AnimeItem,
) {
  const model = await getAnimeModel(item);
  if (!model) {
    return;
  }

  const dialog = document.createElement("dialog");
  dialog.className = 'edit-item-dialog';
  dialog.innerHTML = `
      <form method="dialog" class="anime-editor">
        <h2>Edit Anime ${item.title}</h2>
        <label>
            Comment
            <textarea id="comment" rows="2">${escapeHtml(model.comment)}</textarea>
        </label>

        <label>
          Search Terms
          <textarea id="searchTerms" rows="6">${escapeHtml(model.search_terms)}</textarea>
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
              <option value="0" ${item.model?.rating === 0 ? 'selected' : ''}>No Rating</option>
              <option value="1" ${item.model?.rating === 1 ? 'selected' : ''}>Bad</option>
              <option value="2" ${item.model?.rating === 2 ? 'selected' : ''}>Okay</option>
              <option value="3" ${item.model?.rating === 3 ? 'selected' : ''}>Good</option>
          </select>
        </label>

        <label>
          Status
          <select id="status">
              <option value="0" ${item.model?.status === 0 ? 'selected' : ''}>None</option>
              <option value="1" ${item.model?.status === 1 ? 'selected' : ''}>Watching</option>
              <option value="2" ${item.model?.status === 2 ? 'selected' : ''}>Completed</option>
          </select>
        </label>

        <menu>
          <button value="cancel">Cancel</button>
          <button id="saveButton" value="save">Save</button>
        </menu>
      </form>
    `;

  document.body.appendChild(dialog);

  const rating = document.getElementById("rating") as HTMLSelectElement;
  const comment = document.getElementById('comment') as HTMLTextAreaElement;
  const tags = document.getElementById("tags") as HTMLInputElement;
  const status = document.getElementById("status") as HTMLSelectElement;
  const searchTerms = document.getElementById("searchTerms") as HTMLTextAreaElement;
  const episodesWatched = document.getElementById("episodesWatched") as HTMLInputElement;

  rating.value = String(model.rating);
  status.value = String(model.status);

  dialog.addEventListener("close", async () => {
    if (dialog.returnValue !== "save") {
      dialog.remove();
      return;
    }

    const updated: AnimeModel = {
      ...model,
      comment: comment.value,
      search_terms: searchTerms.value,
      tags: tags.value,
      episodes_watched: Number(episodesWatched.value),
      rating: !Number.isNaN(Number(rating.value)) ? Number(rating.value) as Rating : Rating.NoRating,
      status: !Number.isNaN(Number(status.value)) ? Number(status.value) as Status : Status.None,
    };

    await insertOrUpdateModel(item, updated);
    dialog.remove();
  });

  dialog.showModal();
}