const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_ROOTS = ['frontend', 'css']; // Adjust based on your actual folder names
const TARGET_DIR = './static';

/**
 * Recursively copies a source directory/file to target.
 */
async function copyToStatic(src, dest) {
  const srcPath = path.resolve(src);
  let destPath = path.join(TARGET_DIR, path.relative(path.dirname(src), src));

  // Ensure destination directory exists (e.g., if src is "frontend/img/js")
  const destDir = path.dirname(destPath);
  await fs.promises.mkdir(destDir, { recursive: true });

  const stats = await fs.promises.stat(srcPath);

  if (stats.isDirectory()) {
    // Recursively copy directory contents
    for await (const item of fs.readdirSync(srcPath)) {
      const srcItemPath = path.join(srcPath, item);
      const destItemPath = path.join(destPath, item);

      // Deep copy logic is handled by recursion in the next call
      await copyToStatic(srcItemPath, destItemPath);
    }
  } else {
    // Copy single file
    await fs.promises.copyFile(srcPath, destPath);
    console.log(`Copied: ${srcPath} → ${destPath}`);
  }

  return true;
}

async function runBuild() {
  for (const src of SOURCE_ROOTS) {
    const fullPath = path.join(process.cwd(), src);

    if (!fs.existsSync(fullPath)) {
