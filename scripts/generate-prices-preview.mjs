/**
 * Post-build step: generate dist/prices.html from the built dist/index.html,
 * swapping the default NestaHub head meta for price-list Open Graph tags.
 *
 * Why this exists: the /prices link is sent out in bulk WhatsApp campaigns, and
 * WhatsApp's crawler does not execute JavaScript — it reads the served HTML. A
 * client-rendered SPA therefore cannot set its own share preview, so the link
 * would otherwise show the generic "NestaHub - Baby essentials delivered" card.
 * Served for /prices via a vercel.json rewrite -> /prices.html. A real browser
 * still boots the SPA because the hashed asset refs are preserved.
 *
 * Mirrors generate-gifting-preview.mjs deliberately rather than sharing code
 * with it, to keep the working gifting preview untouched.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');
const srcFile = resolve(distDir, 'index.html');
const outFile = resolve(distDir, 'prices.html');

// Same origin precedence as the gifting preview: explicit override, then the
// Vercel-injected production domain, then the production fallback.
const ORIGIN = (
  process.env.VITE_PUBLIC_ORIGIN ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://nestahub.ng')
).replace(/\/$/, '');

// Optional 1200x630 share banner. There is no dedicated price-list artwork yet,
// so this is unset by default: WhatsApp still renders a clean title+description
// card without an image, which is better than showing unrelated gifting art.
// Set VITE_PRICES_OG_IMAGE (absolute URL) once a banner exists.
const OG_IMAGE = process.env.VITE_PRICES_OG_IMAGE || '';

const TITLE = 'Nesta Hub Price List';
const DESCRIPTION =
  'Every Nesta Hub product and price at a glance, grouped by category.';

if (!existsSync(srcFile)) {
  console.error(`[generate-prices-preview] ${srcFile} not found — run \`vite build\` first.`);
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

// Inject the tags that don't exist in index.html, just before </head>.
const injected = [
  ...(OG_IMAGE
    ? [
        `<meta property="og:image" content="${OG_IMAGE}" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta name="twitter:image" content="${OG_IMAGE}" />`,
      ]
    : []),
  `<meta name="twitter:title" content="${TITLE}" />`,
  `<meta name="twitter:description" content="${DESCRIPTION}" />`,
  `<link rel="canonical" href="${ORIGIN}/prices" />`,
].join('\n    ');

html = html.replace(/<\/head>/i, `    ${injected}\n  </head>`);

writeFileSync(outFile, html, 'utf8');
console.log(
  `[generate-prices-preview] wrote ${outFile} (title="${TITLE}", og:image=${OG_IMAGE || 'none'})`,
);
