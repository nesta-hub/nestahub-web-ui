import { Lightbulb } from "lucide-react";

interface OrderTypeInfoPillProps {
  onLearnMore: () => void;
}

export function OrderTypeInfoPill({ onLearnMore }: OrderTypeInfoPillProps) {
  return (
    <button
      onClick={onLearnMore}
      className="w-full flex items-start gap-3 p-3 rounded-xl bg-secondary/50 border border-border text-left hover:bg-secondary/70 transition-colors"
    >
      <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <p className="text-sm text-muted-foreground">
        Auto renew saves you from re-ordering items regularly.{" "}
        <span className="font-medium text-primary">Learn more</span>
      </p>
    </button>
  );
}
