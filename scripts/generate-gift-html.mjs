/**
 * Post-build step: generate dist/gift.html from the built dist/index.html,
 * swapping the default NestaHub head meta for gifting-specific Open Graph tags.
 *
 * Why generated (not a hand-written static file): Vite fingerprints the JS/CSS
 * bundles with content hashes that change every build. Copying the freshly built
 * index.html keeps those asset references correct, so the SPA still boots for
 * humans while social crawlers read the gifting tags.
 *
 * Wired via `vercel.json` rewrite: /gift/(.*) -> /gift.html (above the SPA catch-all).
 * The preview is intentionally GENERIC (same for every gift link) — no per-card data.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');
const srcFile = resolve(distDir, 'index.html');
const outFile = resolve(distDir, 'gift.html');

// Canonical public origin (used to build the absolute og:image URL).
const ORIGIN = (process.env.VITE_PUBLIC_ORIGIN || 'https://nestahub.ng').replace(/\/$/, '');
// The branded 1200x630 share banner. Override with VITE_GIFT_OG_IMAGE (absolute URL)
// if the asset is hosted elsewhere (e.g. Cloudinary). Defaults to a file in /public.
const OG_IMAGE = process.env.VITE_GIFT_OG_IMAGE || `${ORIGIN}/gift-preview.png`;

const TITLE = "🎁 You've received a NestaHub gift!";
const DESCRIPTION = 'Tap to open your gift and shop baby essentials for the little one.';

if (!existsSync(srcFile)) {
  console.error(`[generate-gift-html] ${srcFile} not found — run \`vite build\` first.`);
  process.exit(1);
}

let html = readFileSync(srcFile, 'utf8');

// Replace the tags that exist in index.html.
html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${TITLE}</title>`);
html = html.replace(
  /<meta\s+name="description"[^>]*>/i,
  `<meta name="description" content="${DESCRIPTION}" />`,
);
html = html.replace(
  /<meta\s+property="og:title"[^>]*>/i,
  `<meta property="og:title" content="${TITLE}" />`,
);
html = html.replace(
  /<meta\s+property="og:description"[^>]*>/i,
  `<meta property="og:description" content="${DESCRIPTION}" />`,
);

// Inject the tags that don't exist in index.html (og:image + twitter:*), just before </head>.
const injected = [
  `<meta property="og:image" content="${OG_IMAGE}" />`,
  `<meta property="og:image:width" content="1200" />`,
  `<meta property="og:image:height" content="630" />`,
  `<meta name="twitter:title" content="${TITLE}" />`,
  `<meta name="twitter:description" content="${DESCRIPTION}" />`,
  `<meta name="twitter:image" content="${OG_IMAGE}" />`,
].join('\n    ');

html = html.replace(/<\/head>/i, `    ${injected}\n  </head>`);

writeFileSync(outFile, html, 'utf8');
console.log(`[generate-gift-html] wrote ${outFile} (og:image=${OG_IMAGE})`);
