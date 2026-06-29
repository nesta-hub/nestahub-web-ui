import { cn } from "@/lib/utils";
import { categoryIconMap } from "@/components/icons/CategoryIcons";
import {
  Baby,
  Milk,
  Pill,
  Thermometer,
  Heart,
  Package,
  Shirt,
  Droplet,
  Sparkles,
  Bath,
  Cookie,
  Bandage,
  Flower2,
} from "lucide-react";
import type { CatalogueCategory } from "@/data/catalogueData";

const FALLBACK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "baby-powder": Sparkles,
  "diaper-cream": Droplet,
  "baby-shampoo": Bath,
  bottles: Milk,
  formula: Milk,
  bibs: Shirt,
  sterilisers: Package,
  "breast-pumps": Heart,
  thermometers: Thermometer,
  teething: Cookie,
  "first-aid": Bandage,
  "maternity-pads": Flower2,
  "nipple-cream": Droplet,
  postpartum: Heart,
  "mum-supplements": Pill,
  swaddles: Baby,
  "sleep-bags": Baby,
  "bath-towels": Bath,
};

interface CategoryTileProps {
  category: CatalogueCategory;
  onClick: () => void;
}

export function CategoryTile({ category, onClick }: CategoryTileProps) {
  const SvgIcon = category.iconKey ? categoryIconMap[category.iconKey] : undefined;
  const LucideFallback = FALLBACK_ICONS[category.id] ?? Package;

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center text-center active:scale-[0.97] transition-transform"
    >
      <div
        className={cn(
          "w-full aspect-square rounded-2xl bg-[#F5F3F0] flex items-center justify-center",
          "shadow-soft border border-border/40 overflow-hidden",
        )}
      >
        {category.imageUrl ? (
          <img src={category.imageUrl} alt={category.displayName} className="w-full h-full object-cover" />
        ) : SvgIcon ? (
          <SvgIcon className="w-10 h-10" />
        ) : (
          <LucideFallback className="w-9 h-9 text-primary" strokeWidth={1.5} />
        )}
      </div>
      <p className="mt-2 text-[11px] leading-tight font-medium text-foreground line-clamp-2">
        {category.name}
      </p>
    </button>
  );
}

