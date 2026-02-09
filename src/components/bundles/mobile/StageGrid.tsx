import { Check, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Stage } from "@/data/bundleData";

type SelectionMode = "age" | "weight";

interface StageGridProps {
  stages: Stage[];
  selectedStageId: string | null;
  onSelect: (stageId: string) => void;
  onContinue: () => void;
  selectionMode: SelectionMode;
  onModeChange: (mode: SelectionMode) => void;
}

export function StageGrid({ stages, selectedStageId, onSelect, onContinue, selectionMode, onModeChange }: StageGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">What's your baby's stage?</h3>

        {/* Age/Weight Toggle */}
        <button
          onClick={() => onModeChange(selectionMode === "age" ? "weight" : "age")}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <span>Choose by {selectionMode === "age" ? "weight" : "age"}</span>
          <Repeat
            className={cn("w-4 h-4 transition-transform duration-300", selectionMode === "weight" && "rotate-180")}
          />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5 stagger-fade-in">
        {stages.map((stage) => {
          const isSelected = selectedStageId === stage.id;

          return (
            <button
              key={stage.id}
              onClick={() => onSelect(stage.id)}
              className={cn(
                // Base styling
                "relative flex flex-col items-center p-3 rounded-2xl",
                "border transition-all duration-200 card-inner-highlight",
                "active:scale-[0.97]",
                // Unselected
                "bg-card border-border shadow-soft",
                // Selected
                isSelected && ["bg-primary/5 ring-2 ring-primary shadow-card", "animate-select-pop"],
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}

              {/* Emoji container */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-2",
                  "transition-colors duration-200",
                  isSelected ? "bg-primary/10" : "bg-secondary",
                )}
              >
                <span className="text-xl">{stage.emoji}</span>
              </div>

              {/* Text */}
              <span className="font-semibold text-foreground text-xs text-center leading-tight">{stage.name}</span>
              <span className="text-2xs text-muted-foreground mt-0.5">{stage.ageRange || stage.weightRange}</span>
            </button>
          );
        })}
      </div>

      {/* Floating pill CTA - only shows after selection */}
      {selectedStageId && (
        <div className="flex flex-col items-center pt-4 animate-fade-in-up">
          <Button 
            variant="shop" 
            onClick={onContinue}
            className="rounded-full px-8 h-11 font-semibold"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
