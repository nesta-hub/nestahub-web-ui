#!/usr/bin/env node

/**
 * Warm the category cutouts.
 *
 * The shop shows each category's picture as a cutout (the photo with its background removed)
 * made by Cloudinary's AI Background Removal add-on. Cloudinary does the removal the first
 * time an image is asked for and keeps the result, which takes a few seconds. This asks for
 * every category's cutout once, ahead of time, so no shopper is the first to wait.
 *
 * It uses the add-on: every image that has not been processed before uses one unit of its
 * allowance (images already processed cost nothing again). So it only SHOWS what it would
 * do unless you pass --run.
 *
 * Usage:
 *   node scripts/warm-category-cutouts.js                      list what it would ask for
 *   node scripts/warm-category-cutouts.js --run                do it
 *
 * Options:
 *   --api <url>          the API to read the categories from (default http://localhost:3000/api)
 *   --width <px>         the cutout's width (default 480, what the shop asks for)
 *   --concurrency <n>    requests at a time (default 2)
 *
 * KEEP IN STEP with cutoutCloudinaryUrl() in src/lib/cloudinary.ts: this must build the
 * very same address the shop does, or it warms a different image from the one shoppers get.
 */

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const API = option('--api', 'http://localhost:3000/api').replace(/\/$/, '');
const WIDTH = Number(option('--width', '480'));
const CONCURRENCY = Math.max(1, Number(option('--concurrency', '2')));
const RUN = flag('--run');

/** Chrome's own Accept header, so f_auto answers with the same format a shopper's browser gets. */
const ACCEPT = 'image/avif,image/webp,image/*;q=0.8';
const RETRIES = 3;

function cutoutUrl(url, width) {
  if (!url || !url.includes('cloudinary.com') || !url.includes('/upload/')) return null;
  if (/\/upload\/[^/]*(e_background_removal|f_auto|q_auto)/.test(url)) return null;
  return url.replace('/upload/', `/upload/e_background_removal/c_fit,w_${width},f_auto,q_auto/`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function categoryPictures() {
  const response = await fetch(`${API}/categories/tree`);
  if (!response.ok) throw new Error(`Could not read ${API}/categories/tree (HTTP ${response.status})`);
  const tree = await response.json();
  const categories = [...(tree.groups || []).flatMap((g) => g.categories || []), ...(tree.ungrouped || [])];
  return categories.filter((c) => c.imageUrl).map((c) => ({ name: c.displayName || c.name, url: c.imageUrl }));
}

/** Ask for one cutout, and wait for the picture itself so Cloudinary has finished making it. */
async function warm({ name, url }) {
  for (let attempt = 1; attempt <= RETRIES + 1; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { Accept: ACCEPT } });
      await response.arrayBuffer();
      if (response.ok) return { name, ok: true, type: response.headers.get('content-type') };
      // 423 means "still being made"; 5xx is Cloudinary having a moment. Anything else will not change.
      const retryable = response.status === 423 || response.status >= 500;
      if (!retryable || attempt > RETRIES) {
        return { name, ok: false, status: response.status, reason: response.headers.get('x-cld-error') || '' };
      }
    } catch (err) {
      if (attempt > RETRIES) return { name, ok: false, status: 'network', reason: String(err.message || err) };
    }
    await sleep(attempt * 4000);
  }
  return { name, ok: false, status: 'gave up', reason: '' };
}

async function main() {
  const all = await categoryPictures();
  const todo = [];
  let skipped = 0;
  for (const { name, url } of all) {
    const cutout = cutoutUrl(url, WIDTH);
    if (cutout) todo.push({ name, url: cutout });
    else skipped += 1;
  }

  console.log(`${all.length} categories have a picture; ${todo.length} can have a cutout` + (skipped ? ` (${skipped} skipped: not a plain Cloudinary address)` : '') + '.');
  if (!todo.length) return;
  console.log(`Example: ${todo[0].url}`);

  if (!RUN) {
    console.log('\nNothing was requested. Each picture Cloudinary has not processed before uses one unit of the');
    console.log('AI Background Removal add-on. To go ahead: node scripts/warm-category-cutouts.js --run');
    return;
  }

  console.log(`\nAsking Cloudinary for ${todo.length} cutouts, ${CONCURRENCY} at a time...`);
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const item = todo[next++];
      const result = await warm(item);
      results.push(result);
      console.log(`  ${result.ok ? 'ok    ' : 'FAILED'} ${item.name}${result.ok ? ` (${result.type})` : ` HTTP ${result.status} ${result.reason}`}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} ready, ${failed.length} failed.`);
  if (failed.length) {
    console.log('Failed ones keep showing their ordinary photo in the shop. Run again to retry them.');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
