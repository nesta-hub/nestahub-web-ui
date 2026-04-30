import { Calendar, MapPin, Wallet } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/api";
import type { DeliverySpeed } from "@/lib/delivery-timing";

interface DeliveryConfirmationDrawerProps {
  open: boolean;
  address: string;
  deliveryDate: string; // e.g., "Wednesday, 29 Apr"
  deliverySpeed: DeliverySpeed;
  deliveryFee: number; // in kobo
  onProceed: () => void;
  onCancel: () => void;
}

export function DeliveryConfirmationDrawer({
  open,
  address,
  deliveryDate,
  deliverySpeed,
  deliveryFee,
  onProceed,
  onCancel,
}: DeliveryConfirmationDrawerProps) {
  const deliveryTypeText = deliverySpeed === 'sameday'
    ? 'Same day delivery'
    : 'Next day delivery';

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Confirm delivery</DrawerTitle>
          <DrawerDescription>
            Review your delivery details before proceeding.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-3">
          {/* Address */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Delivery address</p>
              <p className="text-sm font-medium text-foreground">{address}</p>
            </div>
          </div>

          {/* Delivery date */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Delivery date</p>
              <p className="text-sm font-medium text-foreground">{deliveryDate}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{deliveryTypeText}</p>
            </div>
          </div>

          {/* Delivery fee */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Delivery fee</p>
              <p className="text-sm font-medium text-foreground">
                {formatPrice(deliveryFee)}
              </p>
            </div>
          </div>
        </div>

        <DrawerFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1 h-12" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="shop"
            className="flex-1 h-12 font-semibold"
            onClick={onProceed}
          >
            Proceed
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
