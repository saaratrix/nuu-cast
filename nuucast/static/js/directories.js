document.addEventListener('DOMContentLoaded', () => {
  initItems();

  initUploadForm();

});

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
}

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

function initUploadForm() {
  /** @type {HTMLFormElement} */
  const uploadForm = document.getElementById('upload-form');
  uploadForm.classList.remove('hidden');
  /** @type {HTMLInputElement} */
  const fileInput = document.getElementById('upload-file-input');
  const nameInput = document.getElementById('upload-name-input');
  /** @type {HTMLButtonElement} */
  const submitButton = document.querySelector('.upload-button');
  const informationElement = uploadForm.querySelector('.upload-information');

  /**
   * @param {string} value
   */
  function setInformation(value) {
    informationElement.textContent = value;
    value === '' ? informationElement.classList.add('hidden') : informationElement.classList.remove('hidden');
  }

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 1) {
      setInformation("Too many files selected can only upload 1.");
      return;
    }
    setInformation("");
    if (fileInput.files.length === 0) {
      return;
    }
    const file = fileInput.files[0];
    nameInput.value = file.name;
    nameInput.focus();
  });

  uploadForm.addEventListener('change', () => submitButton.disabled = !uploadForm.checkValidity());
  uploadForm.addEventListener('input', () => submitButton.disabled = !uploadForm.checkValidity());

  uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    let filename = nameInput.value.replace(/[/\\]/g, '').trim();

    if (!filename) {
      setInformation('Please enter a valid filename');
      return;
    }
    const root = document.getElementById('upload-root').value;
    const uploadUrl = `${root}/${filename}`;

    setInformation('');
    const file = fileInput.files[0];
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file
      });

      if (response.ok) {
        location.reload();
      } else {
        setInformation(`Upload failed: ${response.statusText}`);
      }
    } catch (err) {
      setInformation(`Upload error: ${err.message}`);
    }
  });
}