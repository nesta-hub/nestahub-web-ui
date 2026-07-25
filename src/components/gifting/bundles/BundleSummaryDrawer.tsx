import { ArrowRight } from "lucide-react";
import { metaPixel } from "@/lib/metaPixel";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { formatGiftPrice, type GiftPackage } from "@/data/giftCatalogue";
import type { PackagingOption } from "@/lib/giftAdapter";

interface BundleSummaryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg: GiftPackage;
  packaging: PackagingOption | null;
  onProceed: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export function BundleSummaryDrawer({
  open,
  onOpenChange,
  pkg,
  packaging,
  onProceed,
  isSubmitting = false,
  error,
}: BundleSummaryDrawerProps) {
  const packagingPrice = packaging?.price ?? 0;
  const total = pkg.price + packagingPrice;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-describedby={undefined} className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display text-xl font-bold">
            Review your gift
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-3">
          {/* Bundle card */}
          <div className="flex items-center gap-3 rounded-2xl bg-card border border-foreground/[0.08] p-3 shadow-sm">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary/40 shrink-0">
              <img
                src={pkg.heroImage}
                alt={pkg.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {pkg.name}
              </p>
              {pkg.items.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {pkg.items.length} items
                </p>
              )}
            </div>
            <p className="text-sm font-bold text-foreground/80 shrink-0">
              {formatGiftPrice(pkg.price)}
            </p>
          </div>

          {/* Packaging card */}
          {packaging && (
            <div className="flex items-center gap-3 rounded-2xl bg-card border border-foreground/[0.08] p-3 shadow-sm">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary/40 shrink-0">
                <img
                  src={packaging.image}
                  alt={packaging.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {packaging.name}
                </p>
              </div>
              <p className="text-sm font-bold text-foreground/80 shrink-0">
                + {formatGiftPrice(packaging.price)}
              </p>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="font-display text-xl font-bold text-foreground">
              {formatGiftPrice(total)}
            </span>
          </div>
        </div>

        <div className="px-4 pb-6">
          {error && (
            <div className="mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <Button
            variant="shop"
            className="w-full h-12 text-base font-semibold rounded-full"
            onClick={() => { metaPixel.initiateCheckout({ num_items: 1, value: total / 100, currency: 'NGN' }); onProceed(); }}
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? "Creating order…" : "Proceed to Payment"}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
