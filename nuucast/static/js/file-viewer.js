document.addEventListener('DOMContentLoaded', () => {
  tryInitializeSubtitlesPicker();

  tryInitializeKittyButton();
});

function tryInitializeSubtitlesPicker() {
  const subtitlesPicker = document.getElementById('subtitle-picker');

  /** @type {NodeListOf<HTMLOptionElement> | undefined} */
  const subtitleOptions = subtitlesPicker && subtitlesPicker.querySelectorAll('option');
  // No subtitles if the element doesn't exist
  if (!subtitleOptions || !subtitleOptions.length) {
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

function tryInitializeKittyButton() {
  const mediaViewer = document.querySelector('media-viewer');
  /** @type {HTMLVideoElement} */
  const video = mediaViewer.getViewerContentElement();
  if (video.nodeName !== 'VIDEO' || video.textTracks.length <= 0) {
    return;
  }

  const button = document.createElement('button');
  button.innerText = 'Meow!';
  button.style.position = 'absolute';
  button.style.bottom = '1rem';
  button.style.right = '3rem';
  button.style.height = '2.5rem';
  button.style.width = '10ch';

  let translateLine = false;

  button.addEventListener('click', () => {
    const hasSubtitlesActive = Array.from(video.textTracks).some(t => !!t.cues);
    if (!hasSubtitlesActive) {
      return;
    }

    translateLine = !translateLine;
    for (const track of video.textTracks) {
      // Only active track has cues.
      if (!track.cues) {
        continue;
      }

      for (const cue of track.cues) {
        if (translateLine) {
          if (!'__originalValue' in cue) {
            cue.__originalValue = cue.line;
          }

          let line = parseInt(cue.line);
          if (Number.isNaN(line)) {
            line = 10;
          } else {
            line -= 3;
          }
          cue.line = line;

        } else {
          cue.line = cue.__originalValue || 'auto';
        }
      }
    }

    button.style.backgroundColor = translateLine ? '#badbad' : '';
  });

  document.body.appendChild(button);
}