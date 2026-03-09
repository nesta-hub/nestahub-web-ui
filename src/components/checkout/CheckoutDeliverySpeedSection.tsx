import { Truck, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DeliverySummaryCard } from "./DeliverySummaryCard";
import { formatPrice } from "@/lib/api";

type DeliverySpeed = 'standard' | 'weekend';

interface CheckoutDeliverySpeedSectionProps {
  selectedSpeed: DeliverySpeed | null;
  onSelectSpeed: (speed: DeliverySpeed) => void;
  onChangeSpeed: () => void;
  address?: string | null;
  standardDeliveryFee: number; // in kobo
  isZone1: boolean;
}

// Weekend delivery fee: ₦500 (50000 kobo)
const WEEKEND_DELIVERY_FEE = 50000;

/** Returns "This Saturday" or "Next Saturday" based on current day */
function getNextSaturday(): string {
  const today = new Date();
  return today.getDay() === 6 ? "Next Saturday" : "This Saturday";
}

/** Formats the date for next Saturday delivery */
function formatNextSaturday(): string {
  const today = new Date();
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));

  return saturday.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Formats the date for next day delivery */
function formatNextDay(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function CheckoutDeliverySpeedSection({
  selectedSpeed,
  onSelectSpeed,
  onChangeSpeed,
  address,
  standardDeliveryFee,
  isZone1,
}: CheckoutDeliverySpeedSectionProps) {
  if (selectedSpeed) {
    return (
      <div className="space-y-2">
        <h3 className="text-base font-medium text-muted-foreground">Delivery Option</h3>
        <DeliverySummaryCard
          icon={
            selectedSpeed === 'standard' ? (
              <Truck className="w-4 h-4 text-primary" />
            ) : (
              <Calendar className="w-4 h-4 text-primary" />
            )
          }
          title={selectedSpeed === 'standard' ? 'Standard Delivery' : 'Weekend Drop-off'}
          subtitle={formatPrice(selectedSpeed === 'standard' ? standardDeliveryFee : WEEKEND_DELIVERY_FEE)}
          onChangeClick={onChangeSpeed}
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
          <Truck className="w-3 h-3 shrink-0" />
          {selectedSpeed === 'standard'
            ? `Next day delivery · ${formatNextDay()}`
            : `${getNextSaturday()} delivery · ${formatNextSaturday()}`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-muted-foreground">Choose Delivery Option</h3>

      <div className="grid grid-cols-2 gap-3">
        <Card
          className="p-4 cursor-pointer hover:border-primary transition-colors active:scale-[0.98]"
          onClick={() => onSelectSpeed('standard')}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Standard Delivery</p>
              <p className="text-xs text-muted-foreground">Next day · {formatPrice(standardDeliveryFee)}</p>
            </div>
          </div>
        </Card>

        <Card
          className={`p-4 transition-colors ${
            isZone1
              ? 'cursor-pointer hover:border-primary active:scale-[0.98]'
              : 'opacity-60 cursor-not-allowed'
          }`}
          onClick={() => isZone1 && onSelectSpeed('weekend')}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Weekend Drop-off</p>
              {isZone1 ? (
                <p className="text-xs text-muted-foreground">{getNextSaturday()} · {formatPrice(WEEKEND_DELIVERY_FEE)}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{formatPrice(WEEKEND_DELIVERY_FEE)} · Coming soon to your address</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
