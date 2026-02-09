import { MapPin, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FloatingBackButton } from "./FloatingBackButton";

interface DeliveryMethodSelectorProps {
  onSelectPickup: () => void;
  onSelectAddress: () => void;
  onBack: () => void;
}

export function DeliveryMethodSelector({ onSelectPickup, onSelectAddress, onBack }: DeliveryMethodSelectorProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
        <FloatingBackButton onClick={onBack} />
        <div>
          <h1 className="font-semibold text-lg">Delivery Method</h1>
          <p className="text-sm text-muted-foreground">How would you like to receive your order?</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <Card 
          className="p-4 cursor-pointer hover:border-primary transition-colors active:scale-[0.98]"
          onClick={onSelectPickup}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base">Pickup Station</h3>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  FREE
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Pick up your order from one of our locations
              </p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:border-primary transition-colors active:scale-[0.98]"
          onClick={onSelectAddress}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base">Deliver to Address</h3>
                <span className="text-xs font-medium text-muted-foreground">
                  From ₦1,500
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                We'll deliver directly to your doorstep
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
