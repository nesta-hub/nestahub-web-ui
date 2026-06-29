import { Calendar, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/api";
import type { DeliveryTiming } from "@/lib/delivery-timing";

interface DeliveryEstimateCardProps {
  timing: DeliveryTiming;
  deliveryFee: number; // kobo
}

export function DeliveryEstimateCard({ timing, deliveryFee }: DeliveryEstimateCardProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Delivery Estimate</h3>
      <Card className="p-3 bg-card border-border space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Estimated delivery</p>
            <p className="text-sm font-medium text-foreground">{timing.deliveryDate}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{timing.displayLabel}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 border-t border-border pt-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Delivery fee</p>
            <p className="text-sm font-medium text-foreground">
              {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
