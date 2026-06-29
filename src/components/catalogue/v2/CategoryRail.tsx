import { cn } from "@/lib/utils";

interface CategoryRailItem {
  id: string;
  name: string;
}

interface CategoryRailProps {
  categories: CategoryRailItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function CategoryRail({ categories, activeId, onSelect }: CategoryRailProps) {
  return (
    <div className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border/50">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2 snap-x">
        {categories.map((cat) => {
          const isActive = activeId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                "snap-start flex-shrink-0 px-3 h-7 rounded-full text-xs font-medium transition-all whitespace-nowrap border",
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
