import { Package, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { OrderTypeInfoPill } from "./OrderTypeInfoPill";

type OrderType = 'one-off' | 'auto-renew';

interface CheckoutOrderTypeSectionProps {
  selectedType: OrderType | null;
  confirmed: boolean;
  onSelectOneOff: () => void;
  onSelectAutoRenew: () => void;
  onLearnMore: () => void;
}

export function CheckoutOrderTypeSection({
  selectedType,
  confirmed,
  onSelectOneOff,
  onSelectAutoRenew,
  onLearnMore,
}: CheckoutOrderTypeSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-muted-foreground">Choose order type</h3>

      <div className="grid grid-cols-2 gap-3">
        {/* One-Off Card */}
        <Card
          onClick={onSelectOneOff}
          className={cn(
            "relative flex flex-col items-center justify-center p-4 cursor-pointer transition-all",
            confirmed && selectedType === 'one-off'
              ? "border-primary bg-primary/5"
              : "hover:border-primary/50"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold text-foreground">One-Off</span>
          <span className="text-xs text-muted-foreground mt-0.5">Order just this once</span>
        </Card>

        {/* Auto-Renew Card */}
        <Card
          onClick={onSelectAutoRenew}
          className={cn(
            "relative flex flex-col items-center justify-center p-4 cursor-pointer transition-all",
            confirmed && selectedType === 'auto-renew'
              ? "border-primary bg-primary/5"
              : "hover:border-primary/50"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <RefreshCw className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold text-foreground">Auto-Renew</span>
          <span className="text-xs text-muted-foreground mt-0.5">Deliver on schedule</span>
        </Card>
      </div>

      <OrderTypeInfoPill onLearnMore={onLearnMore} />
    </div>
  );
}
