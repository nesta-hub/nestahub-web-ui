import { RotateCcw, ChevronRight } from "lucide-react";

interface ReorderEssentialsPillProps {
  count: number;
  onClick: () => void;
}

export function ReorderEssentialsPill({ count, onClick }: ReorderEssentialsPillProps) {
  if (count <= 0) return null;
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center justify-between py-2.5 px-3 bg-card rounded-2xl shadow-soft border border-sage/10 active:scale-[0.98] transition-all duration-200"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <RotateCcw className="w-4 h-4" strokeWidth={2} />
        </div>
        <span className="text-sm font-semibold text-foreground">Reorder your recent items</span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
    </button>
  );
}
