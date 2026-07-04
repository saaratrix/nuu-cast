import fs from 'fs';
import path from 'path';

const __dirname = path.join(process.cwd(), 'scripts');

// --- Configuration ---
const SOURCE_ROOT = path.join(__dirname, '..');
const TARGET_ROOT = path.join(__dirname, '..', '..', 'static');

const files = [
  'index.html'
]
const folders = [
  'img',
  'js',
  'css',
  'modules',
];

/**
 * Creates directories recursively in the target path
 */
async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

/**
 * Copies a single file or directory recursively
 */
async function copyToTarget(relativePath, parent) {
  const source = path.join(parent, relativePath);
  let destBase = path.join(TARGET_ROOT, source);
  const stats = await fs.promises.stat(source);

  if (stats.isDirectory()) {
    console.log(`copying all files and folders in ${source} ...`);
    await ensureDir(destBase);
    // Recursively copy directory contents
    const items = await fs.promises.readdir(source);
    for await (const item of items) {
      await copyToTarget(item, source);
    }
  } else {
    await fs.promises.copyFile(source, destBase);
  }
}

async function runBuild() {
  // TODO: Remove folders from static too.

  console.log('copying files...')
  for (const file of files) {
    console.log(`copying ${file}`);
    fs.copyFileSync(path.join(SOURCE_ROOT, file), path.join(TARGET_ROOT, file));
  }

  console.log('copying folders...');
  process.chdir(SOURCE_ROOT);
  for (const folder of folders) {
    await copyToTarget(folder, '');
  }
  console.log('Build completed successfully.');
}

runBuild().catch(console.error);