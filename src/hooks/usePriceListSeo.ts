/**
 * Page-level SEO for the public /prices page.
 *
 * The app is a client-rendered SPA with a single static index.html, so document
 * title, description, canonical and Product/ItemList JSON-LD are applied on
 * mount and reverted on unmount — without the revert, these leak onto every
 * other route the user navigates to.
 *
 * Caveat: crawlers and link-preview bots that don't execute JS (WhatsApp,
 * Facebook) read the static index.html, not this. Social preview tags for
 * campaign links must live in index.html or be served by an edge renderer.
 */
import { useEffect } from 'react';
import type { PriceCategoryBlock } from '@/lib/priceListRows';

const TITLE = 'Price List | Nesta Hub';
const DESCRIPTION =
  'Every Nesta Hub product and price at a glance — baby care, feeding, ' +
  'bath and nursery essentials, grouped by category.';

/** Cap the JSON-LD payload; full catalogues make the document needlessly heavy. */
const MAX_JSON_LD_ITEMS = 100;

function upsertMeta(selector: string, attrs: Record<string, string>) {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) {
    const previous = existing.getAttribute('content');
    Object.entries(attrs).forEach(([k, v]) => existing.setAttribute(k, v));
    return () => {
      if (previous === null) existing.removeAttribute('content');
      else existing.setAttribute('content', previous);
    };
  }

  const created = document.createElement('meta');
  Object.entries(attrs).forEach(([k, v]) => created.setAttribute(k, v));
  document.head.appendChild(created);
  return () => created.remove();
}

export function usePriceListSeo(
  categories: PriceCategoryBlock[],
  variantCount: number,
) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = TITLE;

    const restorers = [
      upsertMeta('meta[name="description"]', {
        name: 'description',
        content: DESCRIPTION,
      }),
      upsertMeta('meta[property="og:title"]', {
        property: 'og:title',
        content: TITLE,
      }),
      upsertMeta('meta[property="og:description"]', {
        property: 'og:description',
        content: DESCRIPTION,
      }),
    ];

    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = `${window.location.origin}/prices`;
    document.head.appendChild(canonical);

    return () => {
      document.title = previousTitle;
      restorers.forEach((restore) => restore());
      canonical.remove();
    };
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;

    const items = categories
      .flatMap((category) =>
        category.rows.map((row) => ({ category: category.name, row })),
      )
      .slice(0, MAX_JSON_LD_ITEMS)
      .map(({ category, row }, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: row.variant ? `${row.title} — ${row.variant}` : row.title,
          category,
          ...(row.image ? { image: row.image } : {}),
          offers: {
            '@type': 'Offer',
            // JSON-LD expects a major-unit decimal; API prices are kobo.
            price: (row.price / 100).toFixed(2),
            priceCurrency: 'NGN',
            availability: 'https://schema.org/InStock',
          },
        },
      }));

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Nesta Hub Price List',
      numberOfItems: variantCount,
      itemListElement: items,
    });
    document.head.appendChild(script);

    return () => script.remove();
  }, [categories, variantCount]);
}
