import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Stage } from "@/data/bundleData";

interface StageCardProps {
  stage: Stage;
  onClick: () => void;
}

export function StageCard({ stage, onClick }: StageCardProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Card
        className={cn(
          "cursor-pointer p-4 transition-all hover:shadow-md hover:scale-[1.02]",
          "flex flex-col items-center text-center gap-2"
        )}
        onClick={onClick}
      >
        <span className="text-3xl">{stage.emoji}</span>
        <h3 className="font-semibold text-foreground">{stage.name}</h3>
        <p className="text-sm text-muted-foreground">
          {stage.ageRange || stage.weightRange}
        </p>
        <p className="text-xs text-muted-foreground">{stage.description}</p>
      </Card>
    );
  }

  // Desktop layout - larger card with Select button
  return (
    <Card
      className={cn(
        "p-6 transition-all hover:shadow-lg hover:border-primary/50 card-lift",
        "flex flex-col items-center text-center gap-4 h-full"
      )}
    >
      <span className="text-5xl">{stage.emoji}</span>
      <div className="space-y-1">
        <h3 className="font-bold text-lg text-foreground">{stage.name}</h3>
        <p className="text-sm font-medium text-primary">
          {stage.ageRange || stage.weightRange}
        </p>
      </div>
      <p className="text-sm text-muted-foreground flex-1">{stage.description}</p>
      <Button onClick={onClick} className="w-full mt-auto">
        Select
      </Button>
    </Card>
  );
}
