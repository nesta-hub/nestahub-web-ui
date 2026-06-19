import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatGiftPrice, type GiftPackage } from "@/data/giftCatalogue";

interface BundleListingCardProps {
  pkg: GiftPackage;
  onClick: () => void;
}

export function BundleListingCard({ pkg, onClick }: BundleListingCardProps) {
  const visibleItems = pkg.items.slice(0, 3);
  const remaining = Math.max(0, pkg.items.length - 3);
  const hasItems = pkg.items.length > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col text-left w-full",
        "rounded-2xl overflow-hidden bg-card",
        "border border-foreground/[0.06]",
        "shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_16px_36px_-22px_hsl(28_25%_25%/0.2)]",
        "transition-all duration-300 ease-out",
        "active:scale-[0.99]"
      )}
    >
      {/* Image */}
      <div className="relative w-full aspect-square overflow-hidden bg-secondary/40">
        <img
          src={pkg.heroImage}
          alt={pkg.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {hasItems && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-card/95 backdrop-blur text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/80 shadow-sm">
            {pkg.items.length} items
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-display text-[15px] font-bold text-foreground leading-tight line-clamp-1">
          {pkg.name}
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground leading-snug line-clamp-2 min-h-[28px]">
          {pkg.description}
        </p>

        {hasItems && (
          <ul className="mt-2 space-y-1">
            {visibleItems.map((it, i) => (
              <li
                key={i}
                className="flex items-center gap-1.5 text-[11px] text-foreground/75 leading-snug"
              >
                <Check className="w-3 h-3 text-[hsl(28,32%,45%)] shrink-0" strokeWidth={2.5} />
                <span className="truncate">{it.name}</span>
              </li>
            ))}
            {remaining > 0 && (
              <li className="text-[11px] text-muted-foreground/70 pl-[18px]">
                +{remaining} more
              </li>
            )}
          </ul>
        )}

        <div className="mt-3 pt-3 border-t border-foreground/[0.06] flex items-end justify-between gap-2">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-muted-foreground">Starting at</span>
            <span className="font-display text-[15px] font-bold text-foreground">
              {formatGiftPrice(pkg.price)}
            </span>
          </div>
          <span
            className={cn(
              "shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
              "bg-[hsl(28,32%,36%)] text-[hsl(var(--nesta-cream))]",
              "shadow-[0_8px_18px_-8px_hsl(28,32%,28%,0.6)]"
            )}
          >
            <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
          </span>
        </div>
      </div>
    </button>
  );
}
