import { useState, useMemo } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductCard } from "./ProductCard";
import { SubcategoryChips } from "./SubcategoryChips";
import { useCategoryProducts } from "@/hooks/useCatalogue";
import { apiCardToCatalogue } from "@/lib/catalogueAdapter";
import type { CatalogueSubcategory } from "@/data/catalogueData";
import type { ProductCard as ApiProductCard } from "@/lib/api";

interface CategoryViewProps {
  /** Category identity. `slug` is used for the API query. */
  category: { id: string; name: string; slug: string };
  /** Subcategories sourced from the tree node. */
  subcategories: CatalogueSubcategory[];
  onBack: () => void;
  onProductClick: (productKey: string, raw: ApiProductCard) => void;
}

export function CategoryView({ category, subcategories, onBack, onProductClick }: CategoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSub, setActiveSub] = useState("all");

  const { data, isLoading } = useCategoryProducts({
    category: activeSub === "all" ? category.slug : undefined,
    subcategory: activeSub === "all" ? undefined : activeSub,
  });

  const rawProducts = useMemo(() => data?.products ?? [], [data]);
  const rawById = useMemo(() => {
    const m: Record<string, ApiProductCard> = {};
    for (const p of rawProducts) m[p.id] = p;
    return m;
  }, [rawProducts]);

  const filteredProducts = useMemo(() => {
    let list = rawProducts.map(apiCardToCatalogue);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query),
      );
    }
    return list;
  }, [rawProducts, searchQuery]);

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      {/* Header with back button */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{category.name}</h1>
      </div>

      {/* Search bar */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${category.name} products...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Subcategory chips */}
      {subcategories.length > 0 && (
        <SubcategoryChips
          subcategories={subcategories}
          activeId={activeSub}
          onChange={setActiveSub}
        />
      )}

      {/* 2-column grid of products */}
      <div className="px-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProductCard
                  product={product}
                  size="large"
                  onClick={() => onProductClick(product.id, rawById[product.id])}
                />
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
