import { MapPin, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DeliverySummaryCard } from "./DeliverySummaryCard";
import { formatPrice } from "@/lib/api";

type DeliveryMethod = 'pickup' | 'address';

interface CheckoutDeliverySectionProps {
  selectedMethod: DeliveryMethod | null;
  onSelectMethod: (method: DeliveryMethod) => void;
  onChangeMethod: () => void;
  addressDeliveryFee?: number | null;
}

export function CheckoutDeliverySection({
  selectedMethod,
  onSelectMethod,
  onChangeMethod,
  addressDeliveryFee,
}: CheckoutDeliverySectionProps) {
  // Show summary card if method is selected
  if (selectedMethod) {
    const addressSubtitle = 'From ₦500';

    return (
      <div className="space-y-2">
      <h3 className="text-base font-medium text-muted-foreground">
        Delivery Method
      </h3>
        <DeliverySummaryCard
          icon={
            selectedMethod === 'pickup' ? (
              <MapPin className="w-4 h-4 text-primary" />
            ) : (
              <Truck className="w-4 h-4 text-primary" />
            )
          }
          title={selectedMethod === 'pickup' ? 'Pickup Station' : 'Deliver to Address'}
          subtitle={selectedMethod === 'pickup' ? 'FREE pickup' : addressSubtitle}
          onChangeClick={onChangeMethod}
        />
      </div>
    );
  }

  // Show selection cards
  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-muted-foreground">
        Choose Delivery Method
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        <Card
          className="p-4 cursor-pointer hover:border-primary transition-colors active:scale-[0.98]"
          onClick={() => onSelectMethod('pickup')}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Pickup Station</p>
              <p className="text-xs text-muted-foreground">FREE</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-4 cursor-pointer hover:border-primary transition-colors active:scale-[0.98]"
          onClick={() => onSelectMethod('address')}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Deliver to Address</p>
              <p className="text-xs text-muted-foreground">From ₦500</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
