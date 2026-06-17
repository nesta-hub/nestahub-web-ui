import { cn } from "@/lib/utils";
import type { CatalogueSubcategory } from "@/data/catalogueData";

interface SubcategoryChipsProps {
  subcategories: CatalogueSubcategory[];
  activeId: string;
  onChange: (id: string) => void;
}

export function SubcategoryChips({ subcategories, activeId, onChange }: SubcategoryChipsProps) {
  const all = [{ id: "all", name: "All" }, ...subcategories];
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
      {all.map((sub) => {
        const isActive = activeId === sub.id;
        return (
          <button
            key={sub.id}
            onClick={() => onChange(sub.id)}
            className={cn(
              "flex-shrink-0 px-3 h-7 rounded-full text-xs font-medium transition-all whitespace-nowrap border",
              isActive
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
            )}
          >
            {sub.name}
          </button>
        );
      })}
    </div>
  );
}
