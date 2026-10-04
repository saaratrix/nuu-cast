import { getCurrentAnimeSeason, getSelectedSeason, getStoredAnimeSeason, Season, setStoredAnimeSeason } from '../seasons.js';

export function initNavbar() {
  const seasons = document.querySelector<HTMLAnchorElement>('.navbar-top .link-seasons') as HTMLAnchorElement;
  seasons.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();

    openSeasonDialog();
  });
}

function openSeasonDialog() {
  const state = getSelectedSeason();

  const dialog = document.createElement('dialog');
  dialog.className = 'seasons-dialog'
  dialog.innerHTML = `
<div class="seasons-container">
    <h3>Select season:</h3>
    <div class="seasons-year-container">
        <label>Year: <input type="number" class="seaons-year"></label>
        <button class="btn btn-primary increase">+</button>
        <button class="btn btn-primary decrease">-</button>
    </div>
    <div class="seasons-seasons">
      <button class="btn btn-primary winter">Winter</button>
      <button class="btn btn-primary spring">Spring</button>
      <button class="btn btn-primary summer">Summer</button>
      <button class="btn btn-primary fall">Fall</button>
    </div>
    <div class="seasons-select">
        <button class="btn btn-primary select">Ok</button>
        <button class="btn btn-primary default">Set as default</button>
        <button class="btn btn-primary clear-default" hidden>Clear default</button>
    </div>
   
</div>`;
  document.body.appendChild(dialog);

  const yearSelector = dialog.querySelector('input') as HTMLInputElement;
  const yearIncrease = dialog.querySelector('.increase') as HTMLButtonElement;
  const yearDecrease = dialog.querySelector('.decrease') as HTMLButtonElement;
  const seasonButtons = dialog.querySelectorAll<HTMLButtonElement>('.seasons-seasons button');
  const selectButton = dialog.querySelector('.select') as HTMLButtonElement;
  const defaultButton = dialog.querySelector('.default') as HTMLButtonElement;
  const clearDefaultButton = dialog.querySelector('.clear-default') as HTMLButtonElement;

  setYear(state.year);
  setSeason(state.season);
  setClearDefaultVisibility();

  yearSelector.addEventListener('change', function() {
    state.year = parseInt(this.value);
  });

  yearIncrease.addEventListener('click', () => {
    // Note: thought of limiting year to currentYear, same for seasons.
    // However, not all devices are actually on latest date...  eg my TV was on 2023... so only 3 years behind.
    const newYear = state.year + 1;
    setYear(newYear);
  });

  yearDecrease.addEventListener('click', () => {
    const newYear = state.year - 1;
    setYear(newYear);
  });

  for (const button of seasonButtons) {
    button.addEventListener('click', function () {
      const season = Season[this.textContent as keyof typeof Season];
      setSeason(season);
    });
  }

  selectButton.addEventListener('click', () => {
    navigateToSeason();
  });

  defaultButton.addEventListener('click', () => {
    setStoredAnimeSeason(state);
    navigateToSeason();
  });

  clearDefaultButton.addEventListener('click', function() {
    setStoredAnimeSeason(null);
    const currentSeason = getCurrentAnimeSeason();

    setYear(currentSeason.year);
    setSeason(currentSeason.season);
    this.hidden = true;
  });

  dialog.showModal();
  document.addEventListener('click', (e) => {
    if (!dialog.contains(e.target as Node) || e.target === dialog) {
      dialog.close();
    }
  });
  dialog.onclose = () => {
    dialog.remove();
  }

  function setYear(year: number): void {
    state.year = year;
    yearSelector.value = year.toString();
  }

  function setSeason(season: Season): void {
    state.season = season;
    const seasonText = Season[season];
    for (const button of seasonButtons) {
      button.classList.toggle('active', button.textContent === seasonText)
    }
  }

  function navigateToSeason(): void {
    // Use the text name instead of keys.
    const season = Season[state.season];
    location.href = `/?year=${state.year}&season=${season}#`;
  }

  function setClearDefaultVisibility(): void {
    const storedSeason = getStoredAnimeSeason();
    clearDefaultButton.hidden = storedSeason == null;

  }
}


