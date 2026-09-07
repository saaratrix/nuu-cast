import { watch } from "node:fs";
import { copyFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { runBuild } from './build_and_copy.mjs';

const DEBOUNCE_MS = 5000;

let timer;
const frontendRootDir = resolve(import.meta.dirname, "../");
const staticDir = join(frontendRootDir, '../static');

const folders = ['modules', 'js', 'css'];

const pendingFiles = new Map();

for (const folder of folders) {
 watchDirectory(folder);
}

function watchDirectory(directory) {
  const dirPath = join(frontendRootDir, directory);

  watch(dirPath, { recursive: true }, (_event, filename) => {
    if (!filename?.match(/\.(js|css)$/)) {
      return;
    }

    const key = directory+filename;
    if (!pendingFiles.has(key)) {
      pendingFiles.set(key, [
        join(dirPath, filename),
        join(staticDir, directory, filename)
      ]);
    }
    startCopyAction();
  });
}

let isCopying = false;
function startCopyAction() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (isCopying) {
      console.log('Already copying... ');
      return;
    }
    isCopying = true;

    let copyPromises = [];
    const values = [...pendingFiles.values()];
    pendingFiles.clear();

    clearTimeout(timer);
    timer = undefined;

    for (const [src, target] of values) {
      copyPromises.push(copyFile(src, target));
    }

    Promise.allSettled(copyPromises).then((results) => {
      for (const result of results) {
        if (result.status === "rejected") {
          console.error(result.reason);
        }
      }
    }).finally(() => {
      isCopying = false;
      if (pendingFiles.size > 0) {
        startCopyAction();
      }
    });
  }, DEBOUNCE_MS);
}

