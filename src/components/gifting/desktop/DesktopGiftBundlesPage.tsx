import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { metaPixel } from "@/lib/metaPixel";
import { ArrowLeft, ShoppingBag, Gift, ArrowUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  giftCategoryMeta,
  type GiftCategory,
} from "@/data/giftCatalogue";
import { useCart } from "@/contexts/CartContext";
import { useGiftBundles } from "@/hooks/useGifting";
import { BundleListingCard } from "@/components/gifting/bundles/BundleListingCard";

const cats: GiftCategory[] = ["baby", "mom", "combo"];

const categoryHelper: Record<GiftCategory, string> = {
  baby: "Carefully curated baby essentials; soft fabrics, gentle care items, and keepsakes chosen for tiny hands.",
  mom: "Thoughtful comforts for the mother; restorative care, and quiet moments she'll feel held in.",
  combo: "The full hug; pairings that honour both mother and baby in one beautifully bundled gift.",
};

const categoryDescriptor: Record<GiftCategory, string> = {
  baby: "Soft, gentle, tiny",
  mom: "Restful & restoring",
  combo: "For both, in one",
};

type SortKey = "featured" | "price-asc" | "price-desc";
type PriceBucket = "all" | "u20" | "20-50" | "o50";

const priceLabel: Record<PriceBucket, string> = {
  all: "All prices",
  u20: "Under ₦20k",
  "20-50": "₦20–50k",
  o50: "₦50k+",
};

export function DesktopGiftBundlesPage() {
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const [category, setCategory] = useState<GiftCategory>("baby");
  const [sort, setSort] = useState<SortKey>("featured");
  const [priceBucket, setPriceBucket] = useState<PriceBucket>("all");

  const { data: giftPackages = [], isLoading } = useGiftBundles();

  const meta = giftCategoryMeta[category];

  const countsByCategory = useMemo(() => {
    const c: Record<GiftCategory, number> = { baby: 0, mom: 0, combo: 0 };
    giftPackages.forEach((p) => {
      c[p.category]++;
    });
    return c;
  }, [giftPackages]);

  const packagesForCategory = useMemo(() => {
    let list = giftPackages.filter((p) => p.category === category);
    if (priceBucket !== "all") {
      list = list.filter((p) => {
        if (priceBucket === "u20") return p.price < 20000;
        if (priceBucket === "20-50") return p.price >= 20000 && p.price <= 50000;
        return p.price > 50000;
      });
    }
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [giftPackages, category, sort, priceBucket]);

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Top nav strip — centered title */}
      <div className="border-b bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="container grid grid-cols-3 items-center h-14 gap-4">
          <div className="flex items-center min-w-0">
            <button
              onClick={() => navigate("/gifting")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Gifting
            </button>
          </div>
          <h1 className="font-display text-base font-bold text-foreground tracking-[-0.01em] text-center truncate">
            Gift Bundles
          </h1>
          <div className="flex items-center justify-end">
            <button
              onClick={() => navigate("/cart")}
              className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary/60 transition-all"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5 text-foreground" strokeWidth={1.75} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold leading-none flex items-center justify-center">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex gap-10">
          {/* Sticky sidebar categories */}
          <aside className="w-52 shrink-0">
            <div className="sticky top-24 space-y-1">
              <p className="uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground mb-3">
                Category
              </p>
              {cats.map((cat) => {
                const m = giftCategoryMeta[cat];
                const active = cat === category;
                const count = countsByCategory[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                      active
                        ? "bg-[hsl(28,20%,92%)] text-foreground"
                        : "text-foreground/70 hover:bg-secondary/60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("font-medium", active && "text-foreground")}>
                        {m.label}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full",
                          active
                            ? "bg-[hsl(28,32%,36%)] text-[hsl(var(--nesta-cream))]"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {categoryDescriptor[cat]}
                    </p>
                  </button>
                );
              })}

              {/* Not sure helper */}
              <button
                onClick={() => navigate("/gifting/cards")}
                className="mt-6 w-full text-left rounded-xl p-3 bg-card border border-foreground/[0.06] hover:border-foreground/[0.12] transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-3.5 h-3.5 text-[hsl(28,32%,36%)]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/80">
                    Not sure?
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Send a gift card and let them pick.
                </p>
                <span className="mt-2 inline-block text-[11px] font-medium text-[hsl(28,32%,36%)] group-hover:underline">
                  Browse gift cards →
                </span>
              </button>
            </div>
          </aside>

          {/* Main grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div key={category} className="animate-fade-in">
                {/* Category context */}
                <div className="mb-5">
                  <p className="uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground mb-1.5">
                    {meta.label} bundles
                  </p>
                  <h2 className="font-display text-xl font-bold text-foreground leading-tight tracking-[-0.01em]">
                    {meta.subtitle}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1.5 max-w-[60ch] leading-relaxed">
                    {categoryHelper[category]}
                  </p>
                  {category === "combo" && (
                    <p className="text-[11px] text-[hsl(28,32%,36%)] mt-2 font-medium">
                      Includes items for both mom and baby.
                    </p>
                  )}
                </div>

                {/* Filter / sort row */}
                <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-foreground/[0.06]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(Object.keys(priceLabel) as PriceBucket[]).map((b) => {
                      const active = priceBucket === b;
                      return (
                        <button
                          key={b}
                          onClick={() => setPriceBucket(b)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors",
                            active
                              ? "bg-[hsl(28,32%,36%)] text-[hsl(var(--nesta-cream))]"
                              : "bg-secondary/60 text-foreground/70 hover:bg-secondary"
                          )}
                        >
                          {priceLabel[b]}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className="text-[12px] bg-transparent text-foreground font-medium focus:outline-none cursor-pointer"
                    >
                      <option value="featured">Featured</option>
                      <option value="price-asc">Price: Low → High</option>
                      <option value="price-desc">Price: High → Low</option>
                    </select>
                  </div>
                </div>

                {packagesForCategory.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-foreground/15 py-16 text-center">
                    <p className="text-sm text-muted-foreground">
                      No bundles match this filter.
                    </p>
                    <button
                      onClick={() => setPriceBucket("all")}
                      className="mt-2 text-[12px] font-medium text-[hsl(28,32%,36%)] hover:underline"
                    >
                      Clear filter
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {packagesForCategory.map((pkg) => (
                      <BundleListingCard
                        key={pkg.id}
                        pkg={pkg}
                        onClick={() => {
                        metaPixel.viewContent({ content_name: pkg.name, content_ids: [pkg.id], content_type: 'product', value: pkg.price / 100, currency: 'NGN' });
                        navigate(`/gifting/bundles/${pkg.id}`);
                      }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
