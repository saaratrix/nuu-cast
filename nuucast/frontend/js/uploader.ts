document.addEventListener('DOMContentLoaded', () => {
  initUploadForm();
});


function initUploadForm() {
  /** @type {HTMLFormElement} */
  const uploadForm = document.getElementById('upload-form') as HTMLFormElement;
  uploadForm.classList.remove('hidden');
  /** @type {HTMLInputElement} */
  const fileInput = document.getElementById('upload-file-input') as HTMLInputElement;
  const nameInput = document.getElementById('upload-name-input') as HTMLInputElement;
  /** @type {HTMLButtonElement} */
  const submitButton = document.querySelector('.upload-button') as HTMLButtonElement;
  const informationElement = uploadForm.querySelector('.upload-information') as HTMLElement;

  /**
   * @param {string} value
   */
  function setInformation(value: string) {
    informationElement.textContent = value;
    value === '' ? informationElement.classList.add('hidden') : informationElement.classList.remove('hidden');
  }

  fileInput.addEventListener('change', () => {
    if (!fileInput.files) {
      setInformation("No file was changed, weird!");
      return;
    }

    if (fileInput.files.length > 1) {
      setInformation("Too many files selected can only upload 1.");
      return;
    }
    setInformation("");
    if (fileInput.files.length === 0) {
      return;
    }
    const file = fileInput.files[0]!;
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
    const root = (document.getElementById('upload-root') as HTMLInputElement).value;
    const uploadUrl = `${root}/${filename}`;

    setInformation('');
    const file = fileInput.files![0]!;
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
      setInformation(`Upload error: ${(err as Error).message}`);
    }
  });
}