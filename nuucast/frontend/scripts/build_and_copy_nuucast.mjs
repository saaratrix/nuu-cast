import { mkdir, stat, readdir, copyFile } from 'node:fs/promises';
import { copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';


const __dirname = resolve(import.meta.dirname);

const SOURCE_ROOT = join(__dirname, '..');
const TARGET_ROOT = join(__dirname, '..', '..', 'static');

const files = []
const folders = [
  // 'assets',
  'img',
  'js',
  'css',
];

const ignoreExtensions = ['.ts', '.scss'];

/**
 * Creates directories recursively in the target path
 */
async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

/**
 * Copies a single file or directory recursively
 */
async function copyToTarget(relativePath, parent) {
  const source = join(parent, relativePath);
  let destBase = join(TARGET_ROOT, source);
  const stats = await stat(source);

  if (stats.isDirectory()) {
    console.log(`copying all files and folders in ${source} ...`);
    await ensureDir(destBase);
    // Recursively copy directory contents
    const items = await readdir(source);
    for await (const item of items) {
      await copyToTarget(item, source);
    }
  } else {
    for (const ext of ignoreExtensions) {
      if (source.endsWith(ext)) {
        return;
      }
    }

    copyFile(source, destBase);
  }
}

export async function runBuild() {
  // TODO: Remove folders from static too.

  console.log('copying files...')
  for (const file of files) {
    console.log(`copying ${file}`);
    copyFileSync(join(SOURCE_ROOT, file), join(TARGET_ROOT, file));
  }

  console.log('copying folders...');
  process.chdir(SOURCE_ROOT);
  for (const folder of folders) {
    await copyToTarget(folder, '');
  }
  console.log('Build completed successfully.');
}

if (import.meta.main) {
  runBuild().catch(console.error);
}