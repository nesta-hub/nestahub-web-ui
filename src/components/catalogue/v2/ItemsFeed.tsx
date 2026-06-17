import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FeedCarousel } from "./FeedCarousel";
import { api, type CategoryGroup as ApiGroup, type ProductCard as ApiProductCard } from "@/lib/api";
import { apiCardToCatalogue } from "@/lib/catalogueAdapter";
import type { CatalogueProduct } from "@/data/catalogueData";

interface ItemsFeedProps {
  /** Tree groups (each with its categories) so we can bucket products per group. */
  groups: ApiGroup[];
  /** Called with the product slug/id to open the detail drawer. */
  onProductClick: (productKey: string, raw: ApiProductCard) => void;
}

export function ItemsFeed({ groups, onProductClick }: ItemsFeedProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["catalogue", "items-feed"],
    queryFn: () => api.getProducts({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
  });

  const allProducts = data?.products ?? [];

  // Map each category slug -> group id, and remember group order/names.
  const { categorySlugToGroupId, groupOrder } = useMemo(() => {
    const map: Record<string, string> = {};
    const order: { id: string; name: string }[] = [];
    for (const g of groups) {
      order.push({ id: g.id, name: g.name });
      for (const c of g.categories) {
        map[c.slug] = g.id;
      }
    }
    return { categorySlugToGroupId: map, groupOrder: order };
  }, [groups]);

  // Bucket products into their group, de-duplicating by product id.
  const byGroup = useMemo(() => {
    const buckets: Record<string, CatalogueProduct[]> = {};
    const rawById: Record<string, ApiProductCard> = {};
    const seen: Record<string, Set<string>> = {};
    for (const p of allProducts) {
      const groupId = categorySlugToGroupId[p.categorySlug];
      if (!groupId) continue;
      if (!buckets[groupId]) {
        buckets[groupId] = [];
        seen[groupId] = new Set();
      }
      if (seen[groupId].has(p.id)) continue;
      seen[groupId].add(p.id);
      buckets[groupId].push(apiCardToCatalogue(p));
      rawById[p.id] = p;
    }
    return { buckets, rawById };
  }, [allProducts, categorySlugToGroupId]);

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
      {groupOrder.map((group) => {
        const items = byGroup.buckets[group.id] ?? [];
        if (items.length === 0) return null;
        return (
          <FeedCarousel
            key={group.id}
            title={`Trending in ${group.name}`}
            products={items.slice(0, 12)}
            onProductClick={(p) => onProductClick(p.id, byGroup.rawById[p.id])}
          />
        );
      })}
    </div>
  );
}
