import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ReorderDrawer,
  CategoryProductsDrawer,
  CategoryView,
  SearchOverlay,
  ShopProductDrawer,
  type DrawerCategory,
} from "@/components/catalogue/v2";
import { DesktopShop } from "@/components/catalogue/v3/DesktopShop";
import { MobileShopHome } from "@/components/catalogue/v3/MobileShopHome";
import { useAuth } from "@/contexts/AuthContext";
import { useCategoryTree, useRecentVariants } from "@/hooks/useCatalogue";
import type { Category as ApiCategory, CategoryGroup as ApiGroup } from "@/lib/api";
import { metaPixel } from "@/lib/metaPixel";

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
  const { groupSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: tree, isLoading: treeLoading } = useCategoryTree();
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

  const groups: ApiGroup[] = useMemo(() => tree?.groups ?? [], [tree]);

  // The `?product=<slug-or-id>` param is the single source of truth for the
  // product drawer: present → open, absent → closed. This keeps deep links,
  // in-grid opens, and the back button all consistent — the URL always
  // describes what's on screen.
  useEffect(() => {
    const productKey = searchParams.get("product");
    if (productKey) {
      setSelectedProductKey(productKey);
      setIsProductDrawerOpen(true);
    } else {
      setIsProductDrawerOpen(false);
    }
  }, [searchParams]);

  const handleProductDrawerOpen = (open: boolean) => {
    if (!open && searchParams.get("product")) {
      // Removing the param drives the drawer closed via the effect above.
      searchParams.delete("product");
      setSearchParams(searchParams, { replace: true });
    } else {
      setIsProductDrawerOpen(open);
    }
  };

  const openProduct = (productKey: string) => {
    metaPixel.viewContent({ content_name: productKey, content_ids: [productKey], content_type: 'product' });
    // Push the slug into the URL so the open product is shareable and the back
    // button closes the drawer; the effect above reflects it into drawer state.
    const next = new URLSearchParams(searchParams);
    next.set("product", productKey);
    setSearchParams(next);
  };

  const handleTileClick = (cat: ApiCategory) => {
    metaPixel.customEvent('CategoryClick', { category_name: cat.displayName, category_id: cat.slug });
    setSelectedCategory(toDrawerCategory(cat));
    setIsCategoryDrawerOpen(true);
  };

  if (!isMobile) {
    return (
      <Layout>
        <DesktopShop />
      </Layout>
    );
  }

  return (
    <Layout>
      <MobileShopHome
        groups={groups}
        loading={treeLoading}
        initialGroupSlug={groupSlug ?? null}
        hasReorder={hasReorder}
        onSearch={() => setIsSearchOpen(true)}
        onReorder={() => setIsReorderDrawerOpen(true)}
        onCategory={handleTileClick}
      />

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
