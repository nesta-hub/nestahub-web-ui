import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  giftCategoryMeta,
  type GiftCategory,
} from "@/data/giftCatalogue";
import { useGiftBundles } from "@/hooks/useGifting";
import { CategoryPills } from "./CategoryPills";
import { BundleListingCard } from "./BundleListingCard";

const validCats: GiftCategory[] = ["baby", "mom", "combo"];

const categoryHelper: Record<GiftCategory, string> = {
  baby:
    "Carefully curated baby essentials — soft fabrics, gentle care items, and keepsakes chosen for tiny hands.",
  mom:
    "Thoughtful comforts for the mother — restorative care, and quiet moments she'll feel held in.",
  combo:
    "The full hug — pairings that honour both mother and baby in one beautifully bundled gift.",
};

export function BundlesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: packages = [], isLoading } = useGiftBundles();

  const initialCat = (searchParams.get("cat") as GiftCategory) || "baby";
  const [category, setCategory] = useState<GiftCategory>(
    validCats.includes(initialCat) ? initialCat : "baby"
  );

  useEffect(() => {
    setSearchParams({ cat: category }, { replace: true });
  }, [category, setSearchParams]);

  const meta = giftCategoryMeta[category];

  const packagesForCategory = useMemo(
    () => packages.filter((p) => p.category === category),
    [packages, category]
  );

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => navigate("/gifting")}
          className="p-1.5 -ml-1.5 rounded-full hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-foreground leading-tight tracking-[-0.01em]">
            Gift Bundles
          </h1>
          <p className="text-xs text-muted-foreground">Curated for every kind of love</p>
        </div>
      </div>

      {/* Pills */}
      <CategoryPills active={category} onChange={setCategory} />

      {/* Category section */}
      <div key={category} className="pt-5 pb-4 animate-fade-in">
        <div className="px-4 pb-4">
          <h2 className="font-display text-lg font-bold text-foreground leading-tight tracking-[-0.01em]">
            {meta.subtitle}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1 max-w-[40ch]">
            {categoryHelper[category]}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : packagesForCategory.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No bundles available in this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4">
            {packagesForCategory.map((pkg) => (
              <BundleListingCard
                key={pkg.id}
                pkg={pkg}
                onClick={() => navigate(`/gifting/bundles/${pkg.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
