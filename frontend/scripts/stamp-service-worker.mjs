import { readdir, readFile, writeFile } from 'node:fs/promises';

const serviceWorkerUrl = new URL('../dist/service-worker.js', import.meta.url);
const assetsDirectory = new URL('../dist/assets/', import.meta.url);
const manifestUrl = new URL('../dist/precache-manifest.json', import.meta.url);
const commit = (
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  'local'
).slice(0, 10);
const stamp = `${commit}-${Date.now().toString(36)}`;

try {
  let source = await readFile(serviceWorkerUrl, 'utf8');

  if (!source.includes('__SELORAH_BUILD_STAMP__')) {
    console.warn('Service worker build stamp was not found. Leaving the file unchanged.');
    process.exit(0);
  }

  // Precache every hashed JavaScript and CSS file. Lazy route chunks are only
  // requested when a page opens, so without this list an unvisited page cannot
  // load offline even though the app shell itself is cached.
  const files = await readdir(assetsDirectory, { withFileTypes: true });
  const buildAssets = files
    .filter((entry) => entry.isFile() && /\.(js|css)$/i.test(entry.name))
    .map((entry) => `/assets/${entry.name}`)
    .sort();

  await writeFile(manifestUrl, JSON.stringify(buildAssets));

  source = source.replaceAll('__SELORAH_BUILD_STAMP__', stamp);
  await writeFile(serviceWorkerUrl, source);
  console.log(`Stamped service worker with ${stamp} and ${buildAssets.length} build assets.`);
} catch (error) {
  console.warn(
    'Could not stamp the service worker. The app still works, but automatic updates may wait for the next deployment.',
    error
  );
}
