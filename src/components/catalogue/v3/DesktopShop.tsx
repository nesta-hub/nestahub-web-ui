import { useParams, useSearchParams } from "react-router-dom";
import { DesktopSearchResults, ReorderSidePanel } from "@/components/catalogue/v2/DesktopCatalogueView";
import { useCategoryTree } from "@/hooks/useCatalogue";
import { metaPixel } from "@/lib/metaPixel";
import { DesktopListing } from "./DesktopListing";
import { DesktopShopHome } from "./DesktopShopHome";
import { ProductSheet } from "./ProductSheet";

/**
 * The shop on desktop. What shows is decided by the address, so every state can be linked to
 * and the back button works:
 *   /shop                       the home
 *   /shop/:group[/:category]    a group or category's listing
 *   ?q=...                      search results (the search box is in the header)
 *   ?product=...                that product, in a sheet over whatever is showing
 *   ?reorder=1                  the Buy again panel
 */
export function DesktopShop() {
  const { groupSlug, categorySlug } = useParams();
  const [params, setParams] = useSearchParams();
  const { data: tree, isLoading } = useCategoryTree();
  const groups = tree?.groups ?? [];

  const query = params.get("q") ?? "";
  const productKey = params.get("product");
  const reorderOpen = params.get("reorder") === "1";

  const change = (edit: (next: URLSearchParams) => void, replace = false) => {
    const next = new URLSearchParams(params);
    edit(next);
    setParams(next, { replace });
  };

  const openProduct = (key: string) => {
    metaPixel.viewContent({ content_name: key, content_ids: [key], content_type: "product" });
    change((next) => {
      next.set("product", key);
      next.delete("reorder");
    });
  };

  return (
    <div className="min-h-screen">
      {query.trim() ? (
        <main className="container py-8">
          <DesktopSearchResults query={query} onProductClick={(product, raw) => openProduct(raw?.slug ?? product.id)} />
        </main>
      ) : groupSlug ? (
        <DesktopListing
          key={`${groupSlug}/${categorySlug ?? ""}`}
          groups={groups}
          loading={isLoading}
          groupSlug={groupSlug}
          categorySlug={categorySlug}
          onProduct={openProduct}
        />
      ) : (
        <DesktopShopHome groups={groups} loading={isLoading} />
      )}

      <ProductSheet productKey={productKey} onClose={() => change((next) => next.delete("product"), true)} />
      <ReorderSidePanel
        open={reorderOpen}
        onOpenChange={(open) => change((next) => (open ? next.set("reorder", "1") : next.delete("reorder")), true)}
        onProductClick={openProduct}
      />
    </div>
  );
}
