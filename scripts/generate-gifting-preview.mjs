/**
 * Post-build step: generate dist/gifting.html from the built dist/index.html,
 * swapping the default NestaHub head meta for gifting-specific Open Graph tags.
 *
 * One generic gifting preview is served for ALL public gifting routes
 * (/gifting*, /gift-cards, and the /gift/:id recipient link) via vercel.json
 * rewrites -> /gifting.html. Social crawlers read the gifting tags; a real
 * browser still boots the SPA because the hashed asset refs are preserved.
 *
 * Why generated (not a hand-written static file): Vite fingerprints the JS/CSS
 * bundles with content hashes that change every build. Copying the freshly
 * built index.html keeps those refs correct.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');
const srcFile = resolve(distDir, 'index.html');
const outFile = resolve(distDir, 'gifting.html');

// Absolute origin for the og:image URL. Crawlers need a fully-qualified URL that
// actually resolves, so it must point at the same host that serves the page —
// pointing staging at the production domain (or vice-versa) yields a broken preview.
// Precedence:
//   1. VITE_PUBLIC_ORIGIN — explicit override, if ever needed.
//   2. VERCEL_PROJECT_PRODUCTION_URL — injected by Vercel at build time as the
//      project's production domain (no protocol). This makes og:image self-configure
//      per Vercel project with zero manual env setup: the staging project resolves to
//      nestahub-web-staging.vercel.app, production to nestahub.ng.
//   3. https://nestahub.ng — fallback for local builds.
const ORIGIN = (
  process.env.VITE_PUBLIC_ORIGIN ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://nestahub.ng')
).replace(/\/$/, '');
// The 1200x630 share banner. Override with VITE_GIFT_OG_IMAGE (absolute URL) if
// the asset is hosted elsewhere (e.g. Cloudinary). Defaults to a file in /public.
// Currently a temporary crop of the gifting hero art (public/gift-preview.jpg) —
// swap for dedicated branded artwork when available.
const OG_IMAGE = process.env.VITE_GIFT_OG_IMAGE || `${ORIGIN}/gift-preview.jpg`;

const TITLE = 'NestaHub Gifting';
const DESCRIPTION = 'Send baby essentials, gift cards & bundles to someone special.';

if (!existsSync(srcFile)) {
  console.error(`[generate-gifting-preview] ${srcFile} not found — run \`vite build\` first.`);
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
console.log(`[generate-gifting-preview] wrote ${outFile} (title="${TITLE}", og:image=${OG_IMAGE})`);
