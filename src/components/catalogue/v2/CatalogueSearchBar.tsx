import { Search, RotateCcw } from "lucide-react";

interface CatalogueSearchBarProps {
  onSearchClick: () => void;
  onReorderClick: () => void;
}

export function CatalogueSearchBar({ onSearchClick, onReorderClick }: CatalogueSearchBarProps) {
  return (
    <div className="px-4 pt-1 pb-3">
      <div className="flex items-stretch h-11 rounded-2xl border border-sage/25 shadow-soft overflow-hidden bg-background">
        <button
          type="button"
          onClick={onSearchClick}
          aria-label="Search baby products, brands"
          className="flex-1 min-w-0 flex items-center gap-2 px-4 active:scale-[0.99] transition-transform"
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={2} />
          <span className="text-sm text-muted-foreground font-normal truncate">Search baby products, brands…</span>
        </button>
        <div className="w-[1.5px] bg-border/80 my-2" aria-hidden />
        <button
          type="button"
          onClick={onReorderClick}
          aria-label="View your previous purchases"
          className="flex items-center justify-center px-4 active:scale-[0.95] transition-transform"
        >
          <RotateCcw className="w-[18px] h-[18px] text-primary shrink-0" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
