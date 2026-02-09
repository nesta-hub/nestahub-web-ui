import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/contexts/CartContext";
import { CartItemRow } from "./CartItemRow";
import { formatPrice } from "@/data/catalogueData";
import { ShoppingBag } from "lucide-react";

export function CartDrawer() {
  const navigate = useNavigate();
  const { items, itemCount, totalAmount, isCartOpen, closeCart } = useCart();

  const handleProceed = () => {
    closeCart();
    navigate("/checkout");
  };

  return (
    <Drawer open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <DrawerContent className="h-[75vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 pt-2 pb-4 flex-shrink-0">
            <h2 className="text-lg font-bold text-foreground">
              Your Cart {itemCount > 0 && `(${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
            </h2>
          </div>

          {/* Scrollable Items */}
          {items.length > 0 ? (
            <>
              <div className="flex-1 min-h-0 px-6">
                <ScrollArea className="h-full">
                  <div className="space-y-3 pb-4 pr-2">
                    {items.map((item) => (
                      <CartItemRow
                        key={`${item.productId}-${item.typeId}-${item.sizeId || 'no-size'}`}
                        item={item}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-xl font-bold text-foreground">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
                <Button
                  variant="shop"
                  className="w-full h-12 rounded-xl text-base"
                  onClick={handleProceed}
                >
                  Checkout
                </Button>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-center">
                Your cart is empty
              </p>
              <p className="text-sm text-muted-foreground/70 text-center mt-1">
                Add some products to get started
              </p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
