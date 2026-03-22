import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const FREQUENCY_OPTIONS = [
  { weeks: 1, label: "1 week" },
  { weeks: 2, label: "2 weeks" },
  { weeks: 3, label: "3 weeks" },
  { weeks: 4, label: "4 weeks" },
  { weeks: 5, label: "5 weeks" },
  { weeks: 6, label: "6 weeks" },
  { weeks: 7, label: "7 weeks" },
  { weeks: 8, label: "8 weeks" },
];

interface FrequencySelectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFrequency: number;
  productName: string;
  onConfirm: (newFrequency: number) => void;
}

export function FrequencySelectDrawer({
  open,
  onOpenChange,
  currentFrequency,
  productName,
  onConfirm,
}: FrequencySelectDrawerProps) {
  const [selectedFrequency, setSelectedFrequency] = useState(currentFrequency);

  // Auto-select current frequency when drawer opens
  useEffect(() => {
    if (open) {
      setSelectedFrequency(currentFrequency);
    }
  }, [open, currentFrequency]);

  const handleConfirm = () => {
    if (selectedFrequency) {
      onConfirm(selectedFrequency);
      onOpenChange(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-6 pb-8">
        <DrawerHeader className="px-0 pt-4 pb-2">
          <DrawerTitle className="text-base font-semibold text-foreground">
            Change Frequency
          </DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground">
            {productName}
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4">
          {/* Current frequency info */}
          <p className="text-sm text-muted-foreground">
            Current: Every {currentFrequency} week{currentFrequency !== 1 ? "s" : ""}
          </p>

          {/* Frequency options carousel */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {FREQUENCY_OPTIONS.map((opt) => {
              const isSelected = opt.weeks === selectedFrequency;
              return (
                <button
                  key={opt.weeks}
                  onClick={() => setSelectedFrequency(opt.weeks)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[76px] p-3 rounded-xl border-2 transition-all shrink-0",
                    isSelected ? "border-primary bg-primary/10" : "border-border bg-background"
                  )}
                >
                  <RefreshCw
                    className={cn("w-4 h-4 mb-1", isSelected ? "text-primary" : "text-muted-foreground")}
                  />
                  <span className={cn("text-xs font-bold", isSelected ? "text-primary" : "text-muted-foreground")}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={selectedFrequency === currentFrequency}
              onClick={handleConfirm}
            >
              Confirm
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
