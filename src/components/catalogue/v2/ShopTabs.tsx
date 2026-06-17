import { cn } from "@/lib/utils";

export type ShopTab = "categories" | "items";

interface ShopTabsProps {
  active: ShopTab;
  onChange: (tab: ShopTab) => void;
}

const TABS: { id: ShopTab; label: string }[] = [
  { id: "categories", label: "Explore Categories" },
  { id: "items", label: "Explore All Items" },
];

export function ShopTabs({ active, onChange }: ShopTabsProps) {
  const activeIndex = TABS.findIndex((t) => t.id === active);

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md">
      <div className="px-4 py-3">
        <div className="relative h-12 p-1 rounded-2xl bg-muted/50 border border-border/80 flex items-center">
          <div
            className="absolute inset-y-1 w-[calc(50%-4px)] bg-card border border-primary/20 rounded-xl shadow-soft transition-all duration-300 ease-out"
            style={{ left: activeIndex === 0 ? "4px" : "50%" }}
          />
          {TABS.map((t) => {
            const isActive = active === t.id;
            return (
              <button key={t.id} onClick={() => onChange(t.id)} className="flex-1 relative z-10 text-center">
                <span
                  className={cn(
                    "text-sm tracking-tight transition-colors duration-200",
                    isActive ? "font-semibold text-primary" : "font-medium text-muted-foreground",
                  )}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
