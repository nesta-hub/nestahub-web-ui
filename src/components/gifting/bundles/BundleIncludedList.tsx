import { Gift } from "lucide-react";
import type { GiftPackageItem } from "@/data/giftCatalogue";

interface BundleIncludedListProps {
  items: GiftPackageItem[];
}

export function BundleIncludedList({ items }: BundleIncludedListProps) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl bg-card border border-foreground/[0.06] p-3 shadow-sm"
        >
          <div className="w-11 h-11 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-[hsl(28,32%,45%)]" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
            {item.detail && (
              <p className="text-[11px] text-muted-foreground truncate">{item.detail}</p>
            )}
          </div>
          <span className="text-[11px] font-semibold text-foreground/70 shrink-0 px-2 py-0.5 rounded-full bg-secondary/60">
            {item.qty && (/^\d+$/.test(item.qty) ? `×${item.qty}` : item.qty)}
          </span>
        </div>
      ))}
    </div>
  );
}
