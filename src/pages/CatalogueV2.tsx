import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout";
import { HeaderCartIcon } from "@/components/cart";
import { useIsMobile } from "@/hooks/use-mobile";
import desktopPlaceholder from "@/assets/desktop-placeholder.jpg";
import {
  CategoryGroupSection,
  ReorderDrawer,
  CategoryProductsDrawer,
  CategoryView,
  ShopTabs,
  ItemsFeed,
  CatalogueSearchBar,
  SearchOverlay,
  ShopProductDrawer,
  type ShopTab,
  type DrawerCategory,
} from "@/components/catalogue/v2";
import { WalletBalancePill } from "@/components/wallet/WalletBalancePill";
import { useAuth } from "@/contexts/AuthContext";
import { useCategoryTree, useRecentVariants } from "@/hooks/useCatalogue";
import { apiGroupToCatalogue, apiCategoryToCatalogue } from "@/lib/catalogueAdapter";
import type { Category as ApiCategory, CategoryGroup as ApiGroup } from "@/lib/api";

const TAB_STORAGE_KEY = "catalogue:active-tab";

/** Build the drawer category view-model from an API category node. */
function toDrawerCategory(cat: ApiCategory): DrawerCategory {
  return {
    id: cat.slug,
    slug: cat.slug,
    displayName: cat.displayName,
    subcategories: (cat.subcategories ?? []).map((s) => ({ id: s.slug, name: s.name })),
  };
}

const CatalogueV2 = () => {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: tree } = useCategoryTree();
  // Reorder/buy-again is only meaningful for signed-in users with past orders.
  const { session } = useAuth();
  const { data: recent } = useRecentVariants(session?.access_token);
  const hasReorder = (recent?.variants.length ?? 0) > 0;

  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(null);
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DrawerCategory | null>(null);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [viewAllCategory, setViewAllCategory] = useState<DrawerCategory | null>(null);
  const [isReorderDrawerOpen, setIsReorderDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ShopTab>(() => {
    if (typeof window === "undefined") return "categories";
    const saved = sessionStorage.getItem(TAB_STORAGE_KEY) as ShopTab | null;
    return saved === "items" || saved === "categories" ? saved : "categories";
  });

  const groups: ApiGroup[] = useMemo(() => tree?.groups ?? [], [tree]);

  useEffect(() => {
    sessionStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  // Deep link: ?product=<slug-or-id> opens the product drawer.
  useEffect(() => {
    const productKey = searchParams.get("product");
    if (productKey) {
      setSelectedProductKey(productKey);
      setIsProductDrawerOpen(true);
    }
  }, [searchParams]);

  const handleProductDrawerOpen = (open: boolean) => {
    setIsProductDrawerOpen(open);
    if (!open && searchParams.get("product")) {
      searchParams.delete("product");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const openProduct = (productKey: string) => {
    setSelectedProductKey(productKey);
    setIsProductDrawerOpen(true);
  };

  const handleTileClick = (cat: ApiCategory) => {
    setSelectedCategory(toDrawerCategory(cat));
    setIsCategoryDrawerOpen(true);
  };

  if (!isMobile) {
    return (
      <Layout>
        <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center">
          <img
            src={desktopPlaceholder}
            alt="Baby care essentials"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <div className="relative z-10 text-center px-4">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Desktop Experience Coming Soon
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto text-lg font-medium">
              Browse on a mobile device or a tablet to shop.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <div className="relative px-4 pt-6 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Shop</h1>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pt-[6px]">
            <WalletBalancePill size="sm" />
          </div>
          <HeaderCartIcon />
        </div>

        {/* Search bar with attached Buy Again row */}
        <CatalogueSearchBar
          onSearchClick={() => setIsSearchOpen(true)}
          onReorderClick={() => setIsReorderDrawerOpen(true)}
          showReorder={hasReorder}
        />

        {/* Sticky tabs */}
        <ShopTabs active={activeTab} onChange={setActiveTab} />

        {/* Tab content */}
        {activeTab === "categories" ? (
          <div key="categories" className="space-y-7 pt-4 animate-fade-in">
            {groups.map((group) => (
              <CategoryGroupSection
                key={group.id}
                group={apiGroupToCatalogue(group)}
                categories={group.categories.map((c) => apiCategoryToCatalogue(c, group.id))}
                onTileClick={(cat) => {
                  // cat.id is the category slug; find the API node to get subcategories.
                  const apiCat = group.categories.find((c) => c.slug === cat.id);
                  if (apiCat) handleTileClick(apiCat);
                }}
              />
            ))}
          </div>
        ) : (
          <div key="items" className="animate-fade-in">
            <ItemsFeed groups={groups} onProductClick={(key) => openProduct(key)} />
          </div>
        )}
      </div>

      {/* Search overlay */}
      <SearchOverlay
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onProductClick={(key) => openProduct(key)}
      />

      {/* Reorder drawer */}
      <ReorderDrawer
        open={isReorderDrawerOpen}
        onOpenChange={setIsReorderDrawerOpen}
        onProductClick={(slug) => {
          setIsReorderDrawerOpen(false);
          openProduct(slug);
        }}
      />

      {/* Category products drawer (peek → product) */}
      <CategoryProductsDrawer
        open={isCategoryDrawerOpen}
        onOpenChange={(open) => {
          setIsCategoryDrawerOpen(open);
          if (!open) setSelectedCategory(null);
        }}
        category={selectedCategory}
        onViewAll={(cat) => setViewAllCategory(cat)}
      />

      {/* Product Detail Drawer (deep-link, search, items feed entry points) */}
      <ShopProductDrawer
        open={isProductDrawerOpen}
        onOpenChange={handleProductDrawerOpen}
        productKey={selectedProductKey}
      />

      {/* Full-page CategoryView overlay (triggered by "View all" in the peek drawer) */}
      {viewAllCategory && (
        <div className="fixed inset-0 z-[60] bg-background overflow-y-auto">
          <CategoryView
            category={{
              id: viewAllCategory.id,
              name: viewAllCategory.displayName,
              slug: viewAllCategory.slug,
            }}
            subcategories={viewAllCategory.subcategories}
            onBack={() => setViewAllCategory(null)}
            onProductClick={(key) => {
              setViewAllCategory(null);
              openProduct(key);
            }}
          />
        </div>
      )}
    </Layout>
  );
};

export default CatalogueV2;
