document.addEventListener('DOMContentLoaded', () => {
  tryInitializeSubtitlesPicker();
});

function tryInitializeSubtitlesPicker() {
  const subtitlesPicker = document.getElementById('subtitle-picker');

  /** @type {NodeListOf<HTMLOptionElement> | undefined} */
  const subtitleOptions = subtitlesPicker?.querySelectorAll('option');
  // No subtitles if the element doesn't exist
  if (!subtitleOptions?.length) {
    return;
  }

  const videoElement = document.querySelector('video');
  if (!videoElement) {
    return;
  }

  const subtitles = getSubtitleUrls(subtitleOptions);
  const fragment = document.createDocumentFragment();

  for (const subtitle of subtitles) {
    const trackElement = document.createElement('track');
    trackElement.kind = 'subtitles';
    trackElement.src = subtitle;
    trackElement.label = subtitle;
    trackElement.srclang = 'en';

    fragment.appendChild(trackElement);
  }

  videoElement.appendChild(fragment);
}

function getSubtitleUrls(elements) {
  const filename = document.title.split('/').pop();
  const extensionIndex = filename.lastIndexOf('.');
  const basename = extensionIndex !== -1 ? filename.substring(0, extensionIndex) : filename;

  let subtitles = [];
  const directMatching = [];
  elements.forEach(s => {
    const subtitle = s.value;
    if (subtitle.includes(basename)) {
      directMatching.push(subtitle);
    }
    subtitles.push(subtitle);
  });

  return directMatching.length > 0 ? directMatching : subtitles;
}