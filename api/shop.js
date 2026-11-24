/**
 * Vercel serverless function for the link previews of the shop's quick links:
 * /shop/:group and /shop/:group/:category.
 *
 * Gives the apps that draw link previews (WhatsApp, Facebook, iMessage, ...) the
 * group's or category's name, a line about it and its picture, instead of the
 * generic site preview.
 *
 * ONLY those apps are routed here, by their user agent, so a shopper always gets
 * the ordinary static page and never waits on this. That is also why it answers
 * with just the preview and not the SPA shell, and why it must not be cached: the
 * same address is a different page for a shopper.
 *
 * Routed via vercel.json: /shop/:group[/:category] -> /api/shop?group=&category=.
 */

const API_BASE = (process.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const FETCH_TIMEOUT_MS = 4000;
const TREE_TTL_MS = 5 * 60 * 1000;

// The category tree, kept for a few minutes per warm instance.
let cachedTree = null;
let cachedAt = 0;

async function getTree() {
  if (cachedTree && Date.now() - cachedAt < TREE_TTL_MS) return cachedTree;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(`${API_BASE}/categories/tree`, { signal: ctrl.signal });
    if (!r.ok) return cachedTree;
    cachedTree = await r.json();
    cachedAt = Date.now();
    return cachedTree;
  } catch {
    return cachedTree; // an old one beats none; none gives the generic preview
  } finally {
    clearTimeout(timer);
  }
}

// Escape untrusted fields before placing them in HTML.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Descriptions may contain HTML / be long — strip tags, collapse space, clamp.
function cleanDescription(s, max = 180) {
  const text = String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// Fit a Cloudinary image onto the 1200x630 OG canvas, the same way as
// api/catalogue/[slug].js. A JPEG, since not every preview app takes WebP.
const OG_W = 1200;
const OG_H = 630;
function toOgImage(url) {
  const m = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/i.exec(url || '');
  if (!m) return { url, sized: false };
  return { url: `${m[1]}w_${OG_W},h_${OG_H},c_pad,b_auto,f_jpg,q_auto/${m[2]}`, sized: true };
}

const GENERIC = {
  title: 'Shop NestaHub',
  description: 'Baby care essentials, curated with love.',
  image: null,
};

/** "Diapers, Wipes, Body Wash and more" */
function listOf(names, max = 3) {
  const shown = names.slice(0, max);
  if (names.length > max) return `${shown.join(', ')} and more`;
  return shown.length > 1 ? `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}` : shown.join('');
}

/** The preview for a link. Finds a category by its own slug, as src/lib/shopLink.ts does. */
export function previewFor(tree, groupSlug, categorySlug) {
  const groups = (tree && tree.groups) || [];
  if (categorySlug) {
    const all = [...groups.flatMap((g) => g.categories || []), ...((tree && tree.ungrouped) || [])];
    const category = all.find((c) => c.slug === categorySlug);
    if (category) {
      const name = category.displayName.trim();
      return {
        title: `${name} | NestaHub`,
        description: cleanDescription(category.description) || `Shop ${name} for your little one on NestaHub.`,
        image: category.imageUrl || null,
      };
    }
  }
  const group = groups.find((g) => g.slug === groupSlug);
  if (!group) return GENERIC;
  const categories = group.categories || [];
  const pictured = categories.find((c) => c.imageUrl);
  const names = listOf(categories.map((c) => c.displayName.trim()));
  return {
    title: `${group.name.trim()} | NestaHub`,
    description: names ? `${names}. Shop it all on NestaHub.` : GENERIC.description,
    image: pictured ? pictured.imageUrl : null,
  };
}

export default async function handler(req, res) {
  const { group, category } = req.query;
  const { title, description, image } = previewFor(await getTree(), group, category);

  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="NestaHub" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
  ];
  if (image) {
    const og = toOgImage(image);
    tags.push(
      `<meta property="og:image" content="${esc(og.url)}" />`,
      `<meta name="twitter:image" content="${esc(og.url)}" />`,
    );
    if (og.sized) {
      tags.push(
        `<meta property="og:image:width" content="${OG_W}" />`,
        `<meta property="og:image:height" content="${OG_H}" />`,
      );
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(
    `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    ${tags.join('\n    ')}\n  </head>\n` +
      `  <body><a href="/shop">Shop NestaHub</a></body>\n</html>\n`,
  );
}
