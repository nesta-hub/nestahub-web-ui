import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ProductSize } from "@/data/bundleData";
import { formatPrice } from "@/data/bundleData";

interface SizeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  sizes: ProductSize[];
  selectedSizeId: string;
  onSelect: (size: ProductSize) => void;
}

export function SizeSheet({
  open,
  onOpenChange,
  title,
  sizes,
  selectedSizeId,
  onSelect,
}: SizeSheetProps) {
  const isMobile = useIsMobile();

  const handleSelect = (size: ProductSize) => {
    onSelect(size);
    onOpenChange(false);
  };

  const content = (
    <>
      <div className="space-y-2 pb-4">
        {sizes.map((size) => {
          const isSelected = size.id === selectedSizeId;
          return (
            <button
              key={size.id}
              className={cn(
                "w-full p-4 rounded-lg border text-left transition-all",
                "flex items-center justify-between",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => handleSelect(size)}
            >
              <div>
                <p className="font-medium text-foreground">{size.name}</p>
                {size.weightRange && (
                  <p className="text-sm text-muted-foreground">
                    {size.weightRange}
                  </p>
                )}
                {size.priceDelta !== 0 && (
                  <p className="text-sm text-muted-foreground">
                    {size.priceDelta > 0 ? "+" : ""}
                    {formatPrice(size.priceDelta)}
                  </p>
                )}
              </div>
              {isSelected && (
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      <Button className="w-full" onClick={() => onOpenChange(false)}>
        Confirm Selection
      </Button>
    </>
  );

  // Mobile: Use bottom sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh]">
          <SheetHeader className="text-left pb-4">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
