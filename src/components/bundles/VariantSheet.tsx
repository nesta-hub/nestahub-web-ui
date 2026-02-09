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
import type { ProductVariant } from "@/data/bundleData";
import { formatPrice } from "@/data/bundleData";

interface VariantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  variants: ProductVariant[];
  selectedVariantId: string;
  onSelect: (variant: ProductVariant) => void;
}

export function VariantSheet({
  open,
  onOpenChange,
  title,
  variants,
  selectedVariantId,
  onSelect,
}: VariantSheetProps) {
  const isMobile = useIsMobile();

  const handleSelect = (variant: ProductVariant) => {
    onSelect(variant);
    onOpenChange(false);
  };

  const content = (
    <>
      <div className="space-y-2 pb-4">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          return (
            <button
              key={variant.id}
              className={cn(
                "w-full p-4 rounded-lg border text-left transition-all",
                "flex items-center justify-between",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => handleSelect(variant)}
            >
              <div>
                <p className="font-medium text-foreground">
                  {variant.brand} {variant.name}
                </p>
                {variant.priceDelta !== 0 && (
                  <p className="text-sm text-muted-foreground">
                    {variant.priceDelta > 0 ? "+" : ""}
                    {formatPrice(variant.priceDelta)}
                  </p>
                )}
                {variant.priceDelta === 0 && (
                  <p className="text-sm text-muted-foreground">Included</p>
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
