import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CartItem, useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/api";
import { SubscribeItemCard } from "@/components/subscribe/SubscribeItemCard";

interface AutoRenewConfigDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function AutoRenewConfigDrawer({
  open,
  onOpenChange,
  onSave,
}: AutoRenewConfigDrawerProps) {
  const { items, setItemAutoRenew } = useCart();

  // Calculate total with subscription prices applied
  const totalAmount = items.reduce((sum, item) => {
    const basePrice = item.unitPrice * item.quantity;
    if (item.isAutoRenew) {
      // Use custom subscription price if available, otherwise use regular price
      const subscriptionUnitPrice = item.subscriptionPrice || item.unitPrice;
      return sum + (subscriptionUnitPrice * item.quantity);
    }
    return sum + basePrice;
  }, 0);

  const handleToggleAutoRenew = (item: CartItem, isAutoRenew: boolean) => {
    setItemAutoRenew(
      item.productId,
      item.typeId,
      item.sizeId,
      isAutoRenew,
      isAutoRenew ? (item.frequencyWeeks ?? 4) : undefined
    );
  };

  const handleFrequencyChange = (item: CartItem, weeks: number) => {
    setItemAutoRenew(item.productId, item.typeId, item.sizeId, true, weeks);
  };

  const handleSave = () => {
    onSave();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 pt-4 pb-3 border-b shrink-0">
            <h2 className="text-lg font-bold text-foreground">
              Configure Auto-Renew
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose which items to auto-renew
            </p>
          </div>

          {/* Scrollable Items */}
          <div className="flex-1 min-h-0 px-4">
            <ScrollArea className="h-full">
              <div className="space-y-3 py-4 pr-2">
                {items.map((item) => (
                  <SubscribeItemCard
                    key={`${item.productId}-${item.typeId}-${item.sizeId || 'no-size'}`}
                    item={item}
                    onToggleAutoRenew={(isAutoRenew) =>
                      handleToggleAutoRenew(item, isAutoRenew)
                    }
                    onFrequencyChange={(weeks) =>
                      handleFrequencyChange(item, weeks)
                    }
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-background shrink-0">
            <Button
              variant="shop"
              className="w-full h-12 rounded-xl"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
