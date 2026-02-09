import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "default";
}

export function QuantityControl({ 
  value, 
  onChange, 
  min = 1, 
  max = 99,
  size = "default"
}: QuantityControlProps) {
  const buttonSize = size === "sm" ? "w-7 h-7" : "w-10 h-10";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  const textSize = size === "sm" ? "w-5 text-sm" : "w-8 text-lg";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn(
          buttonSize,
          "rounded-full border border-border flex items-center justify-center",
          "transition-all duration-200",
          "hover:border-primary hover:bg-primary/5",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent"
        )}
      >
        <Minus className={iconSize} />
      </button>
      <span className={cn(textSize, "text-center font-medium tabular-nums")}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn(
          buttonSize,
          "rounded-full border border-border flex items-center justify-center",
          "transition-all duration-200",
          "hover:border-primary hover:bg-primary/5",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-transparent"
        )}
      >
        <Plus className={iconSize} />
      </button>
    </div>
  );
}
