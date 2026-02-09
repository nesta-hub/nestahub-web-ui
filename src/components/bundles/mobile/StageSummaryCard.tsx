import type { Stage } from "@/data/bundleData";

interface StageSummaryCardProps {
  stage: Stage;
  selectionMode: 'age' | 'weight';
  onClear: () => void;
}

export function StageSummaryCard({ stage, selectionMode, onClear }: StageSummaryCardProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">Your Baby's Stage</h3>
      
      <div className="w-full rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          {/* Emoji */}
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{stage.emoji}</span>
          </div>
          
          {/* Details */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-foreground">{stage.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectionMode === 'age' ? stage.ageRange : stage.weightRange}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stage.description}
                </p>
              </div>
              
              {/* Change button inside card */}
              <button 
                onClick={onClear}
                className="text-sm text-primary font-medium flex-shrink-0 ml-2"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
