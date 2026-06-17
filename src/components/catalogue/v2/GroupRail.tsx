import { cn } from "@/lib/utils";
import type { CategoryGroup } from "@/data/catalogueData";

interface GroupRailProps {
  groups: CategoryGroup[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function GroupRail({ groups, activeId, onSelect }: GroupRailProps) {
  return (
    <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/50">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2.5 snap-x">
        {groups.map((g) => {
          const isActive = activeId === g.id;
          return (
            <button
              key={g.id}
              onClick={() => onSelect(g.id)}
              className={cn(
                "snap-start flex-shrink-0 px-3.5 h-8 rounded-full text-xs font-semibold whitespace-nowrap border transition-all",
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/40",
              )}
            >
              {g.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
