import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FeedCarousel } from "./FeedCarousel";
import { api, type CategoryGroup as ApiGroup, type ProductCard as ApiProductCard } from "@/lib/api";
import { apiCardToCatalogue } from "@/lib/catalogueAdapter";
import type { CatalogueProduct } from "@/data/catalogueData";

interface ItemsFeedProps {
  /** Tree groups (each with its categories) so we can bucket products per category. */
  groups: ApiGroup[];
  /** Called with the product slug/id to open the detail drawer. */
  onProductClick: (productKey: string, raw: ApiProductCard) => void;
}

export function ItemsFeed({ groups, onProductClick }: ItemsFeedProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["catalogue", "items-feed"],
    queryFn: () => api.getProducts({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const allProducts = data?.products ?? [];

  // Flatten groups into an ordered list of categories and a slug → displayName map.
  const { categoryOrder, slugToDisplayName } = useMemo(() => {
    const order: { slug: string; displayName: string }[] = [];
    const nameMap: Record<string, string> = {};
    for (const g of groups) {
      for (const c of g.categories) {
        order.push({ slug: c.slug, displayName: c.displayName });
        nameMap[c.slug] = c.displayName;
      }
    }
    return { categoryOrder: order, slugToDisplayName: nameMap };
  }, [groups]);

  // Bucket products by category slug, de-duplicating by product id.
  const byCategory = useMemo(() => {
    const buckets: Record<string, CatalogueProduct[]> = {};
    const rawById: Record<string, ApiProductCard> = {};
    const seen: Record<string, Set<string>> = {};
    for (const p of allProducts) {
      const slug = p.categorySlug;
      if (!slug || !slugToDisplayName[slug]) continue;
      if (!buckets[slug]) { buckets[slug] = []; seen[slug] = new Set(); }
      if (seen[slug].has(p.id)) continue;
      seen[slug].add(p.id);
      buckets[slug].push(apiCardToCatalogue(p));
      rawById[p.id] = p;
    }
    return { buckets, rawById };
  }, [allProducts, slugToDisplayName]);

  if (isLoading) {
    return (
      <div className="space-y-5 pt-4 px-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-40 bg-muted rounded animate-pulse" />
            <div className="flex gap-3">
              {[0, 1, 2].map((j) => (
                <div key={j} className="w-32 h-40 bg-muted rounded-xl animate-pulse shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-4">
      {categoryOrder.map((cat) => {
        const items = byCategory.buckets[cat.slug] ?? [];
        if (items.length === 0) return null;
        return (
          <FeedCarousel
            key={cat.slug}
            title={cat.displayName}
            products={items.slice(0, 12)}
            onProductClick={(p) => onProductClick(p.id, byCategory.rawById[p.id])}
          />
        );
      })}
    </div>
  );
}
