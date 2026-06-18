import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { ProductDetailContent } from "./ProductDetailContent";

interface ShopProductDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Product slug or id to render. */
  productKey: string | null;
}

/**
 * Shop-only product detail drawer. Wraps the ported (API-wired)
 * ProductDetailContent. Distinct from the shared ProductDetailDrawer used by
 * gifting/subscriptions in `select` mode.
 */
export function ShopProductDrawer({ open, onOpenChange, productKey }: ShopProductDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-describedby={undefined} className="max-h-[92vh]">
        <VisuallyHidden.Root>
          <DrawerTitle>Product details</DrawerTitle>
        </VisuallyHidden.Root>
        {productKey && (
          <div className="pb-2">
            <ProductDetailContent
              productKey={productKey}
              fitContent
              onAdded={() => onOpenChange(false)}
            />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
