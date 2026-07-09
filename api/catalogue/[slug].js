/**
 * Vercel serverless function for the product detail page, /catalogue/:slug.
 *
 * Injects a per-product Open Graph preview (product NAME + description +
 * product image — no price) so a shared product link, and Google, show a real
 * product card instead of the generic site preview. The /catalogue browse page
 * is not routed here (only :slug detail pages), and falls back to the SPA.
 *
 * Name / image / description are stable (price & stock — the volatile bits —
 * are deliberately excluded), so a found+active product's preview is edge-cached
 * for 6h; a missing/inactive product or a cold API caches for 60s and self-heals.
 * Crucially this caches the PREVIEW only — the live page's price/stock come from
 * the SPA's own client-side fetch and are never affected. Deploys bust the cache.
 *
 * Routed via vercel.json: /catalogue/(.*) -> /api/catalogue/$1.
 */

const API_BASE = (process.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const FETCH_TIMEOUT_MS = 2000;
const CACHE_SECONDS = 60 * 60 * 6; // 6 hours for a real product
const FALLBACK_CACHE_SECONDS = 60; // don't let a cold-API/miss stick

// The SPA shell is identical for every page and only changes per deploy — cache
// it in module scope so it's fetched once per warm instance, not per request.
let cachedShell = null;

async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getShell(origin) {
  if (cachedShell) return cachedShell;
  try {
    const text = await (await fetchWithTimeout(`${origin}/index.html`, FETCH_TIMEOUT_MS)).text();
    cachedShell = text; // only cache a real shell, never the fallback
    return cachedShell;
  } catch {
    return '<!doctype html><html><head></head><body><div id="root"></div></body></html>';
  }
}

// Escape untrusted product fields before placing them in HTML.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Product descriptions may contain HTML / be long — strip tags, collapse space, clamp.
function cleanDescription(s, max = 180) {
  const text = String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

const GENERIC = {
  title: 'Shop NestaHub',
  description: 'Baby care essentials, curated with love.',
};

function metaForProduct(product) {
  if (!product || product.isActive === false) return GENERIC;
  const name = (product.name || '').trim() || GENERIC.title;
  const description =
    cleanDescription(product.description) ||
    `${product.categoryDisplayName || product.categoryName || 'Baby essentials'} on NestaHub.`;
  return { title: name, description };
}

export default async function handler(req, res) {
  const slug = req.query.slug;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${host}`;

  // Best-effort product fetch (short timeout) — degrade to generic, never hang.
  let product = null;
  try {
    const r = await fetchWithTimeout(`${API_BASE}/products/${encodeURIComponent(slug)}`, FETCH_TIMEOUT_MS);
    if (r.ok) product = await r.json();
  } catch {
    /* fall through to generic */
  }

  const found = !!product && product.isActive !== false;
  const { title, description } = metaForProduct(product);

  // og:image — the real product image (absolute Cloudinary URL) when available.
  let ogImage = null;
  if (found && product.imageUrl) {
    ogImage = /^https?:\/\//i.test(product.imageUrl)
      ? product.imageUrl
      : `${origin}${product.imageUrl.startsWith('/') ? '' : '/'}${product.imageUrl}`;
  } else if (process.env.VITE_PRODUCT_OG_IMAGE) {
    ogImage = process.env.VITE_PRODUCT_OG_IMAGE;
  }

  const shell = await getShell(origin);

  // Strip managed tags from the shell, then inject a COMPLETE head block so even
  // the minimal fallback shell yields a well-formed preview (no bare-domain).
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
  ];
  if (ogImage) {
    tags.push(
      `<meta property="og:image" content="${esc(ogImage)}" />`,
      `<meta name="twitter:image" content="${esc(ogImage)}" />`,
    );
  }

  const html = shell
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
    .replace(/<\/head>/i, `    ${tags.join('\n    ')}\n  </head>`);

  const ttl = found ? CACHE_SECONDS : FALLBACK_CACHE_SECONDS;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=86400`);
  res.status(200).send(html);
}
