/**
 * Vercel serverless function for the recipient gift link, /gift/:id.
 *
 * Unlike the browse gifting pages (which get one generic static "NestaHub
 * Gifting" preview via gifting.html), the recipient link gets a PERSONALISED
 * Open Graph preview built from the card's own data — "warm, no amount":
 *   title:  "🎁 <recipient>, you've received a gift!"
 *   desc:   "<sender> sent you a gift on NestaHub. Tap to open."
 * The gift amount and code are never exposed in the preview.
 *
 * Card identity (recipient, sender) is immutable, so the rendered preview is
 * edge-cached for 30 days — the API is hit ~once per gift link rather than per
 * request. Cards are almost always redeemed immediately, so a used/expired card
 * whose link is later re-shared with a slightly stale preview is an accepted
 * rare edge (the page itself always shows live status). Deploys bust the cache.
 *
 * Routed via vercel.json: /gift/(.*) -> /api/gift/$1.
 */

const API_BASE = (process.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const FETCH_TIMEOUT_MS = 2000;
const CACHE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// The SPA shell is identical for every gift link and only changes per deploy,
// so cache it in module scope — fetched once per warm instance, not per request.
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

// Escape untrusted card fields before placing them in HTML attributes/text.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const GENERIC = {
  title: 'NestaHub Gifting',
  description: 'Send baby essentials, gift cards & bundles to someone special.',
};

function metaForCard(card) {
  if (!card) return GENERIC;
  if (card.status === 'VOID' || card.status === 'EXHAUSTED') {
    return {
      title: 'This NestaHub gift has been claimed',
      description: 'This gift card is no longer available.',
    };
  }
  const recipient = (card.recipientName || '').trim();
  const sender = (card.senderName || '').trim().split(/\s+/)[0]; // first name, warmer
  return {
    title: recipient ? `🎁 ${recipient}, you've received a gift!` : "🎁 You've received a NestaHub gift!",
    description: sender
      ? `${sender} sent you a gift on NestaHub. Tap to open.`
      : 'Someone sent you a gift on NestaHub. Tap to open.',
  };
}

export default async function handler(req, res) {
  const id = req.query.id;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${host}`;
  const ogImage = process.env.VITE_GIFT_OG_IMAGE || `${origin}/gift-preview.jpg`;

  // Best-effort card fetch (short timeout) — never let a slow/cold API break
  // or hang the page; degrade to the generic preview instead.
  let card = null;
  try {
    const r = await fetchWithTimeout(`${API_BASE}/gift-cards/${encodeURIComponent(id)}`, FETCH_TIMEOUT_MS);
    if (r.ok) card = await r.json();
  } catch {
    /* fall through to generic */
  }
  const { title, description } = metaForCard(card);

  const shell = await getShell(origin);

  // Replace the shell's default title/description/og:title/og:description in
  // place (keeps its og:type + twitter:card), then inject the image + twitter
  // text tags before </head> — mirrors the static gifting-preview generator.
  let html = shell
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`)
    .replace(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${esc(title)}" />`)
    .replace(/<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${esc(description)}" />`);

  const injected = [
    `<meta property="og:image" content="${esc(ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(ogImage)}" />`,
  ].join('\n    ');
  html = html.replace(/<\/head>/i, `    ${injected}\n  </head>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`);
  res.status(200).send(html);
}
