import { cn } from "@/lib/utils";
import { Baby, Heart, Gift, type LucideIcon } from "lucide-react";
import { giftCategoryMeta, type GiftCategory } from "@/data/giftCatalogue";

interface CategoryPillsProps {
  active: GiftCategory;
  onChange: (cat: GiftCategory) => void;
}

const order: GiftCategory[] = ["baby", "mom", "combo"];

const categoryIcon: Record<GiftCategory, LucideIcon> = {
  baby: Baby,
  mom: Heart,
  combo: Gift,
};

export function CategoryPills({ active, onChange }: CategoryPillsProps) {
  return (
    <div className="sticky top-0 z-30 bg-background/85 backdrop-blur-md">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-5 py-3 snap-x snap-mandatory">
        {order.map((cat) => {
          const meta = giftCategoryMeta[cat];
          const Icon = categoryIcon[cat];
          const isActive = active === cat;
          return (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              className={cn(
                "snap-start flex-shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-[hsl(28,32%,36%)] text-[hsl(var(--nesta-cream))] shadow-[0_4px_10px_-6px_hsl(28,32%,28%,0.35),inset_0_1px_0_hsl(0_0%_100%/0.25)] scale-[1.02]"
                  : "bg-card/70 backdrop-blur text-foreground/70 border border-foreground/[0.08] hover:border-foreground/25"
              )}
            >
              <Icon size={16} strokeWidth={1.75} />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
