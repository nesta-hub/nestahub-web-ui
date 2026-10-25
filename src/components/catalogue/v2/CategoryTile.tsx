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
import { CloudinaryPresets } from "@/lib/cloudinary";

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
  /** "flat" is the redesigned shop's tile: no shadow or outline, a warmer fill, a slightly bolder label. */
  variant?: "default" | "flat";
}

export function CategoryTile({ category, onClick, variant = "default" }: CategoryTileProps) {
  const flat = variant === "flat";
  const SvgIcon = category.iconKey ? categoryIconMap[category.iconKey] : undefined;
  const LucideFallback = FALLBACK_ICONS[category.id] ?? Package;

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center text-center active:scale-[0.97] transition-transform"
    >
      <div
        className={cn(
          "w-full aspect-square flex items-center justify-center overflow-hidden",
          flat ? "rounded-[20px] bg-[#EFEAE4]" : "rounded-2xl bg-[#F5F3F0] shadow-soft border border-border/40",
        )}
      >
        {category.imageUrl ? (
          <img src={CloudinaryPresets.categoryTile(category.imageUrl)} alt={category.displayName} className="w-full h-full object-cover" />
        ) : SvgIcon ? (
          <SvgIcon className="w-10 h-10" />
        ) : (
          <LucideFallback className="w-9 h-9 text-primary" strokeWidth={1.5} />
        )}
      </div>
      <p
        className={cn(
          "line-clamp-2 text-foreground",
          flat ? "mt-[7px] text-[11.5px] leading-[14px] font-semibold" : "mt-2 text-[11px] leading-tight font-medium",
        )}
      >
        {category.name}
      </p>
    </button>
  );
}

