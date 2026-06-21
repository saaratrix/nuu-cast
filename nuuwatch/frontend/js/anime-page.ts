export async function loadAnimeViewPage(malId: number) {
  const pageContainer = document.querySelector('.page-container');
  if (!pageContainer) {
    return;
  }
  pageContainer.innerHTML = `<div>Viewing an anime!</div>`;
  // const app = document.querySelector('#app');
  //
  // if (!app) return;
  //
  // app.innerHTML = `<p>Loading anime ${malId}...</p>`;
  //
  // const response = await fetch(`/api/anime/${malId}`);
  // const anime = await response.json();
  //
  // app.innerHTML = `
  //   <h1>${anime.title}</h1>
  //   <p>${anime.synopsis}</p>
  // `;
}