import { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, ShoppingCart, Check, ChevronRight, ShoppingBag, RotateCcw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CategoryTile } from "./CategoryTile";
import { SubcategoryChips } from "./SubcategoryChips";
import { DesktopProductDetailContent } from "./DesktopProductDetailContent";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import {
  useCategoryTree,
  useProductSearch,
  useCategoryProducts,
  useRecentVariants,
} from "@/hooks/useCatalogue";
import { useQuery } from "@tanstack/react-query";
import { api, type CategoryGroup as ApiGroup, type ProductCard as ApiProductCard, type RecentVariant } from "@/lib/api";
import { apiCardToCatalogue, apiCategoryToCatalogue, TYPE_ATTR, SIZE_ATTR } from "@/lib/catalogueAdapter";
import { CloudinaryPresets } from "@/lib/cloudinary";
import { formatPrice, getProductPriceRange } from "@/data/catalogueData";
import type { CatalogueCategory, CatalogueProduct, CatalogueSubcategory } from "@/data/catalogueData";
import { metaPixel } from "@/lib/metaPixel";
import type { ShopTab } from "./ShopTabs";

const TAB_STORAGE_KEY = "catalogue:active-tab";

interface DesktopCatalogueViewProps {
  initialProductKey?: string | null;
}

// ── Category hero tile (desktop card style) ──────────────────────────────────

function CategoryHeroTile({
  category,
  productCount,
  onClick,
}: {
  category: CatalogueCategory;
  productCount?: number;
  onClick: () => void;
}) {
  const { categoryIconMap } = useCategoryIconMap();
  const SvgIcon = category.iconKey ? categoryIconMap[category.iconKey] : undefined;
  const { LucideFallback } = useFallbackIcon(category.id);

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col text-left rounded-2xl overflow-hidden border border-foreground/[0.06] bg-card hover:border-foreground/15 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.18)] transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden">
        {category.imageUrl ? (
          <img
            src={CloudinaryPresets.catalogueCard(category.imageUrl)}
            alt={category.displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#F5F1EA] via-[#EFE8DC] to-[#E6DDCB] flex items-center justify-center">
            <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_20%_20%,#000_1px,transparent_1px)] [background-size:14px_14px]" />
            <div className="relative transition-transform duration-500 group-hover:scale-110">
              {SvgIcon ? (
                <SvgIcon className="w-10 h-10" />
              ) : (
                <LucideFallback className="w-9 h-9 text-[hsl(28,32%,36%)]" strokeWidth={1.4} />
              )}
            </div>
          </div>
        )}
      </div>
      <div className="p-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{category.displayName}</p>
        </div>
        <div className="w-6 h-6 rounded-full bg-secondary/60 flex items-center justify-center text-muted-foreground group-hover:bg-[hsl(28,32%,36%)] group-hover:text-white transition-colors shrink-0">
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </button>
  );
}

// ── Product grid card (desktop style) ────────────────────────────────────────

function ProductGridCard({
  product,
  onClick,
}: {
  product: CatalogueProduct;
  onClick: () => void;
}) {
  const range = getProductPriceRange(product);
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl overflow-hidden border border-foreground/[0.06] bg-card hover:border-foreground/15 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-18px_rgba(0,0,0,0.18)] transition-all duration-300"
    >
      <div className="aspect-square bg-secondary/30 overflow-hidden">
        {product.image ? (
          <img
            src={CloudinaryPresets.catalogueCard(product.image)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
        )}
      </div>
      <div className="p-2">
        <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-medium truncate">
          {product.brand}
        </p>
        <p className="text-xs font-semibold text-foreground truncate mt-0.5">{product.name}</p>
        <p className="text-[11px] text-[hsl(28,32%,36%)] font-semibold mt-1">
          {range.min === range.max ? formatPrice(range.min) : `from ${formatPrice(range.min)}`}
        </p>
      </div>
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
        <ShoppingBag className="w-6 h-6 text-muted-foreground/60" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">No products found</p>
      <p className="text-xs text-muted-foreground">Try a different search or category</p>
    </div>
  );
}

// ── Items feed (desktop grid) ─────────────────────────────────────────────────

function ItemsFeedDesktop({
  groups,
  onProductClick,
  onCategoryClick,
}: {
  groups: ApiGroup[];
  onProductClick: (product: CatalogueProduct, raw: ApiProductCard) => void;
  onCategoryClick: (cat: CatalogueCategory) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["catalogue", "items-feed"],
    queryFn: () => api.getProducts({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const allProducts = data?.products ?? [];

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

  const { byCategory, rawById } = useMemo(() => {
    const buckets: Record<string, CatalogueProduct[]> = {};
    const raw: Record<string, ApiProductCard> = {};
    const seen: Record<string, Set<string>> = {};
    for (const p of allProducts) {
      const slug = p.categorySlug;
      if (!slug || !slugToDisplayName[slug]) continue;
      if (!buckets[slug]) { buckets[slug] = []; seen[slug] = new Set(); }
      if (seen[slug].has(p.id)) continue;
      seen[slug].add(p.id);
      buckets[slug].push(apiCardToCatalogue(p));
      raw[p.id] = p;
    }
    return { byCategory: buckets, rawById: raw };
  }, [allProducts, slugToDisplayName]);

  if (isLoading) {
    return (
      <div className="space-y-10 animate-fade-in">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-5 w-44 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="aspect-square rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {categoryOrder.map((cat) => {
        const items = byCategory[cat.slug] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={cat.slug} id={`feed-${cat.slug}`} className="scroll-mt-32">
            <div className="flex items-end justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground tracking-tight">{cat.displayName}</h3>
              <button
                onClick={() => {
                  metaPixel.customEvent('ExploreAllItems', { category_name: cat.displayName });
                  for (const g of groups) {
                    const apiCat = g.categories.find((c) => c.slug === cat.slug);
                    if (apiCat) { onCategoryClick(apiCategoryToCatalogue(apiCat, g.id)); break; }
                  }
                }}
                className="text-xs font-semibold text-primary flex items-center gap-0.5 hover:underline"
              >
                See all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {items.slice(0, 7).map((p) => (
                <ProductGridCard key={p.id} product={p} onClick={() => onProductClick(p, rawById[p.id])} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Category products panel (right sheet) ─────────────────────────────────────

function CategoryPanel({
  category,
  groupName,
  onClose,
  directProductKey,
}: {
  category: CatalogueCategory | null;
  groupName?: string;
  onClose: () => void;
  directProductKey?: string | null;
}) {
  const [activeSub, setActiveSub] = useState("all");
  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(directProductKey ?? null);

  useEffect(() => {
    if (category) {
      setActiveSub("all");
      setSelectedProductKey(null);
    }
  }, [category?.id]);

  useEffect(() => {
    if (directProductKey) setSelectedProductKey(directProductKey);
  }, [directProductKey]);

  const subcategories: CatalogueSubcategory[] = useMemo(
    () => (category?.subcategories as CatalogueSubcategory[] | undefined) ?? [],
    [category],
  );

  const { data, isLoading } = useCategoryProducts({
    category: category?.id ?? undefined,
    subcategory: activeSub !== "all" ? activeSub : undefined,
    enabled: !!category,
  });

  const products: CatalogueProduct[] = useMemo(
    () => (data?.products ?? []).map(apiCardToCatalogue),
    [data],
  );
  const rawById = useMemo(() => {
    const m: Record<string, ApiProductCard> = {};
    for (const p of data?.products ?? []) m[p.id] = p;
    return m;
  }, [data]);

  const inProductView = !!selectedProductKey;

  const isDirect = !category && !!directProductKey;

  return (
    <Sheet open={!!category || !!directProductKey} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col overflow-hidden">
        {(category || directProductKey) && (
          <div className="flex flex-col h-full">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-6 py-5 shrink-0">
              {inProductView ? (
                <button
                  onClick={() => isDirect ? onClose() : setSelectedProductKey(null)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> {isDirect || !category ? "Back" : `Back to ${category.displayName}`}
                </button>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {groupName && (
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold mb-1">
                        {groupName}
                      </p>
                    )}
                    <h2 className="text-2xl font-bold text-foreground">{category?.displayName}</h2>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary/60 transition-colors shrink-0 mt-0.5"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
              {!inProductView && subcategories.length > 0 && (
                <div className="-mx-6 mt-4">
                  <SubcategoryChips
                    subcategories={subcategories}
                    activeId={activeSub}
                    onChange={setActiveSub}
                  />
                </div>
              )}
            </div>

            {/* Product grid */}
            {!inProductView && (
              <div className="px-6 py-6 overflow-y-auto flex-1 animate-fade-in">
                {isLoading ? (
                  <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
                    {products.map((p) => {
                      const raw = rawById[p.id];
                      return (
                        <ProductGridCard
                          key={p.id}
                          product={p}
                          onClick={() => setSelectedProductKey(raw?.slug ?? p.id)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Inline product detail */}
            {inProductView && (
              <div className="flex-1 overflow-y-auto animate-fade-in">
                <DesktopProductDetailContent
                  productKey={selectedProductKey}
                  fitContent={false}
                  showShareButton={false}
                  onAdded={() => isDirect ? onClose() : setSelectedProductKey(null)}
                />
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Reorder side panel ────────────────────────────────────────────────────────

function ReorderSidePanel({
  open,
  onOpenChange,
  onProductClick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductClick: (slug: string) => void;
}) {
  const { addToCart, openCart } = useCart();
  const { session } = useAuth();
  const navigate = useNavigate();
  const token = session?.access_token;
  const { data, isLoading } = useRecentVariants(token);
  const variants = data?.variants ?? [];
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());

  const handleReorder = (v: RecentVariant, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (addedKeys.has(key)) return;
    const typeAttr = v.variant.attributes.find((a) => a.attributeName === TYPE_ATTR);
    const sizeAttr = v.variant.attributes.find((a) => a.attributeName === SIZE_ATTR);

    addToCart(
      {
        variantId: v.variant.id,
        productId: v.productId,
        productName: v.productName,
        brand: v.brand,
        slug: v.slug,
        typeId: typeAttr?.value || "_default",
        typeName: typeAttr?.displayValue || typeAttr?.value || "",
        sizeId: sizeAttr?.value,
        sizeName: sizeAttr?.displayValue || sizeAttr?.value,
        attributes: v.variant.attributes.map((a) => ({
          attributeName: a.attributeName,
          value: a.value,
          displayValue: a.displayValue,
        })),
        unitPrice: v.variant.price,
        image: v.imageUrl,
        isAutoRenew: false,
        subscriptionPrice: v.variant.subscriptionPrice,
        recommendedFrequencyWeeks: v.variant.recommendedFrequencyWeeks,
      },
      1,
    );

    setAddedKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    toast.success("Added to cart", {
      duration: 2500,
      action: { label: "Go to Cart", onClick: () => setTimeout(() => navigate('/cart'), 100) },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
        <div className="flex flex-col h-full">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-6 py-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold mb-1">
              Buy again
            </p>
            <h2 className="text-2xl font-bold text-foreground">Reorder essentials</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Quickly add items you've recently bought.
            </p>
          </div>
          <div className="px-6 py-6 space-y-3">
            {!token ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sign in to see your recent purchases.
              </p>
            ) : isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[88px] bg-muted rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : variants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                You don't have any recent purchases yet.
              </p>
            ) : (
              variants.map((v) => {
                const typeAttr = v.variant.attributes.find((a) => a.attributeName === TYPE_ATTR);
                const sizeAttr = v.variant.attributes.find((a) => a.attributeName === SIZE_ATTR);
                const variantLabel = [
                  typeAttr?.displayValue || typeAttr?.value,
                  sizeAttr?.displayValue || sizeAttr?.value,
                ]
                  .filter(Boolean)
                  .join(" · ");
                const key = v.variant.id;
                const isAdded = addedKeys.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => { onOpenChange(false); onProductClick(v.slug); }}
                    className="w-full flex items-center gap-3 bg-card rounded-2xl border border-border/40 shadow-sm p-3 hover:border-foreground/15 transition-colors text-left"
                  >
                    <div className="w-16 h-16 rounded-xl bg-[#F5F3F0] overflow-hidden flex-shrink-0">
                      {v.imageUrl ? (
                        <img src={CloudinaryPresets.catalogueCard(v.imageUrl)} alt={v.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-secondary/70 to-secondary/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {v.brand} {v.productName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{variantLabel}</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{formatPrice(v.variant.price)}</p>
                    </div>
                    <span
                      onClick={(e) => handleReorder(v, key, e)}
                      aria-disabled={isAdded}
                      className={cn(
                        "inline-flex items-center gap-1 px-3 h-9 rounded-full text-xs font-semibold transition-all flex-shrink-0",
                        isAdded
                          ? "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                          : "bg-primary text-primary-foreground cursor-pointer hover:opacity-90",
                      )}
                    >
                      {isAdded ? (
                        <><Check className="w-3.5 h-3.5" /> Added</>
                      ) : (
                        <><ShoppingCart className="w-3.5 h-3.5" /> Add</>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Search results panel ──────────────────────────────────────────────────────

function DesktopSearchResults({
  query,
  onProductClick,
}: {
  query: string;
  onProductClick: (product: CatalogueProduct, raw: ApiProductCard) => void;
}) {
  const trimmed = query.trim();
  const { data, isFetching } = useProductSearch(trimmed, trimmed.length > 0);
  const rawProducts = data?.products ?? [];
  const products = useMemo(() => rawProducts.map(apiCardToCatalogue), [rawProducts]);
  const rawById = useMemo(() => {
    const m: Record<string, ApiProductCard> = {};
    for (const p of rawProducts) m[p.id] = p;
    return m;
  }, [rawProducts]);

  if (!trimmed) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-xl font-bold text-foreground">
          Results for "{trimmed}"
        </h2>
        <p className="text-sm text-muted-foreground">
          {isFetching ? "Searching…" : `${products.length} product${products.length !== 1 ? "s" : ""}`}
        </p>
      </div>
      {!isFetching && products.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {products.map((p) => (
            <ProductGridCard key={p.id} product={p} onClick={() => onProductClick(p, rawById[p.id])} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Icon helpers (lazy-loaded to avoid top-level dynamic imports) ──────────────

function useCategoryIconMap() {
  const [categoryIconMap, setCategoryIconMap] = useState<Record<string, React.ComponentType<{ className?: string }>>>({});
  useEffect(() => {
    import("@/components/icons/CategoryIcons").then((m) => setCategoryIconMap(m.categoryIconMap));
  }, []);
  return { categoryIconMap };
}

function useFallbackIcon(categoryId: string) {
  const [icons, setIcons] = useState<Record<string, React.ComponentType<{ className?: string }>>>({});
  useEffect(() => {
    import("lucide-react").then((m) => {
      setIcons({
        "baby-powder": m.Sparkles, "diaper-cream": m.Droplet, "baby-shampoo": m.Bath,
        bottles: m.Milk, formula: m.Milk, bibs: m.Shirt, sterilisers: m.Package,
        "breast-pumps": m.Heart, thermometers: m.Thermometer, teething: m.Cookie,
        "first-aid": m.Bandage, "maternity-pads": m.Flower2, "nipple-cream": m.Droplet,
        postpartum: m.Heart, "mum-supplements": m.Pill, swaddles: m.Baby,
        "sleep-bags": m.Baby, "bath-towels": m.Bath,
        _default: m.Package,
      });
    });
  }, []);
  return { LucideFallback: icons[categoryId] ?? icons["_default"] ?? (() => null) };
}

// ── Main component ─────────────────────────────────────────────────────────────

export function DesktopCatalogueView({ initialProductKey }: DesktopCatalogueViewProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: tree } = useCategoryTree();
  const { data: recent } = useRecentVariants(session?.access_token);
  const hasReorder = (recent?.variants.length ?? 0) > 0;

  const groups: ApiGroup[] = useMemo(() => tree?.groups ?? [], [tree]);

  const [activeTab, setActiveTab] = useState<ShopTab>(() => {
    if (typeof window === "undefined") return "categories";
    const saved = sessionStorage.getItem(TAB_STORAGE_KEY) as ShopTab | null;
    return saved === "items" || saved === "categories" ? saved : "categories";
  });
  useEffect(() => { sessionStorage.setItem(TAB_STORAGE_KEY, activeTab); }, [activeTab]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CatalogueCategory | null>(null);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [directProductKey, setDirectProductKey] = useState<string | null>(initialProductKey ?? null);
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openProduct = (key: string) => {
    setActiveCategory(null);
    setDirectProductKey(key);
  };

  const handleProductClick = (product: CatalogueProduct, raw: ApiProductCard) => {
    metaPixel.viewContent({ content_name: product.name, content_ids: [product.id], content_type: 'product' });
    openProduct(raw?.slug ?? product.id);
  };

  const openCategory = (cat: CatalogueCategory) => {
    metaPixel.customEvent('CategoryClick', { category_name: cat.displayName, category_id: cat.id });
    setActiveCategory(cat);
    setSearchQuery("");
  };

  const groupNameForCategory = useMemo(() => {
    if (!activeCategory) return undefined;
    for (const g of groups) {
      if (g.categories.some((c) => c.slug === activeCategory.id)) return g.name;
    }
    return undefined;
  }, [activeCategory, groups]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Sticky shop header */}
      <header
        className={cn(
          "sticky top-20 z-30 bg-[#FAF8F5]/90 backdrop-blur-md transition-shadow duration-300",
          scrolled && "shadow-[0_6px_20px_-16px_rgba(0,0,0,0.25)]",
        )}
      >
        <div className="container border-b border-border/60 flex items-center justify-between gap-6 h-16">
          {/* Tab navigation */}
          <nav className="flex items-center gap-8">
            {([
              { id: "categories" as ShopTab, label: "Explore Categories" },
              { id: "items" as ShopTab, label: "Explore All Items" },
            ] as const).map((t, idx) => {
              const isActive = activeTab === t.id && !isSearching;
              return (
                <div key={t.id} className="flex items-center gap-8">
                  {idx === 1 && (
                    <span className="text-muted-foreground/40 text-sm select-none" aria-hidden>·</span>
                  )}
                  <button
                    onClick={() => { setActiveTab(t.id); setSearchQuery(""); }}
                    className={cn(
                      "group relative h-16 flex items-center text-[15px] tracking-tight transition-colors",
                      isActive
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground font-medium",
                    )}
                  >
                    <span className="relative inline-block py-1">
                      {t.label}
                      <span
                        className={cn(
                          "absolute left-0 right-0 -bottom-[18px] h-[2px] rounded-full transition-all duration-300",
                          isActive
                            ? "bg-[hsl(28,32%,36%)] opacity-100 shadow-[0_0_10px_rgba(110,82,55,0.45)]"
                            : "bg-foreground/40 opacity-0 group-hover:opacity-60",
                        )}
                      />
                    </span>
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Right: search + wallet + reorder */}
          <div className="flex items-center gap-3">
            <div className="flex items-center h-10 w-[300px] rounded-full border border-foreground/20 bg-card shadow-sm pl-4 pr-1 gap-2 hover:border-foreground/30 focus-within:border-foreground/40 transition-colors">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={2} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground min-w-0"
              />
              {searchQuery ? (
                <button
                  onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : hasReorder ? (
                <button
                  onClick={() => setReorderOpen(true)}
                  aria-label="Buy again"
                  title="Buy again"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-secondary/60 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-8">
        {isSearching ? (
          <DesktopSearchResults query={searchQuery} onProductClick={handleProductClick} />
        ) : activeTab === "categories" ? (
          <div className="space-y-12 animate-fade-in">
            {groups.map((group) => {
              const cats = group.categories.map((c) => {
                const cat = apiCategoryToCatalogue(c, group.id);
                // Attach subcategories so the panel can use them
                (cat as CatalogueCategory & { subcategories?: unknown[] }).subcategories =
                  (c.subcategories ?? []).map((s) => ({ id: s.slug, name: s.name }));
                return cat;
              });
              if (cats.length === 0) return null;
              return (
                <section key={group.id}>
                  <div className="mb-5">
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">{group.name}</h2>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                    {cats.map((cat) => (
                      <CategoryHeroTile
                        key={cat.id}
                        category={cat}
                        productCount={group.categories.find((c) => c.slug === cat.id)?.productCount}
                        onClick={() => openCategory(cat)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <ItemsFeedDesktop
            groups={groups}
            onProductClick={handleProductClick}
            onCategoryClick={openCategory}
          />
        )}
      </main>

      {/* Category panel — also used for direct product open from feed/search */}
      <CategoryPanel
        category={activeCategory}
        groupName={groupNameForCategory}
        directProductKey={directProductKey}
        onClose={() => { setActiveCategory(null); setDirectProductKey(null); }}
      />

      {/* Reorder side panel */}
      <ReorderSidePanel
        open={reorderOpen}
        onOpenChange={setReorderOpen}
        onProductClick={(slug) => {
          setReorderOpen(false);
          openProduct(slug);
        }}
      />
    </div>
  );
}
