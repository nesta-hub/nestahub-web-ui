import { CategoryTile } from "./CategoryTile";
import type { CategoryGroup, CatalogueCategory } from "@/data/catalogueData";

interface CategoryGroupSectionProps {
  group: CategoryGroup;
  /** Categories belonging to this group (supplied by the page from the tree). */
  categories: CatalogueCategory[];
  onTileClick: (category: CatalogueCategory) => void;
}

export function CategoryGroupSection({ group, categories, onTileClick }: CategoryGroupSectionProps) {
  if (categories.length === 0) return null;

  return (
    <section id={`section-${group.id}`} className="scroll-mt-24 animate-fade-in">
      <h2 className="px-4 mb-3 text-sm font-bold text-foreground tracking-tight">
        {group.name}
      </h2>
      <div className="grid grid-cols-4 gap-x-3 gap-y-4 px-4">
        {categories.map((cat) => (
          <CategoryTile
            key={cat.id}
            category={cat}
            onClick={() => onTileClick(cat)}
          />
        ))}
      </div>
    </section>
  );
}
