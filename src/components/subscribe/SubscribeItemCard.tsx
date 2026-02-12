import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CartItem } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/api";
import { Minus, Plus } from "lucide-react";

interface SubscribeItemCardProps {
  item: CartItem;
  onToggleAutoRenew: (isAutoRenew: boolean) => void;
  onFrequencyChange: (weeks: number) => void;
}

export function SubscribeItemCard({
  item,
  onToggleAutoRenew,
  onFrequencyChange,
}: SubscribeItemCardProps) {
  const isAutoRenew = item.isAutoRenew ?? false;
  const frequencyWeeks = item.frequencyWeeks ?? 4;
  const totalPrice = item.unitPrice * item.quantity;

  const handleDecreaseFrequency = () => {
    if (frequencyWeeks > 2) {
      onFrequencyChange(frequencyWeeks - 1);
    }
  };

  const handleIncreaseFrequency = () => {
    if (frequencyWeeks < 8) {
      onFrequencyChange(frequencyWeeks + 1);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      {/* Product Info */}
      <div className="flex gap-3 mb-3">
        {item.image && (
          <div className="w-14 h-14 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
            <img
              src={item.image}
              alt={item.productName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">
            {item.brand} {item.productName}
          </h4>
          <p className="text-sm text-muted-foreground">
            {item.typeName}
            {item.sizeName && ` · ${item.sizeName}`}
            {` · Qty: ${item.quantity}`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {formatPrice(totalPrice)}
          </p>
        </div>
      </div>

      {/* Auto-Renew Switch */}
      <div className="flex items-center justify-between py-2">
        <Label htmlFor={`auto-renew-${item.productId}`} className="text-sm font-medium text-foreground cursor-pointer">
          Auto-Renew
        </Label>
        <Switch
          id={`auto-renew-${item.productId}`}
          checked={isAutoRenew}
          onCheckedChange={onToggleAutoRenew}
        />
      </div>

      {/* Frequency Control (shown only when auto-renew is enabled) */}
      {isAutoRenew && (
        <div className="bg-secondary/50 rounded-lg p-3 mt-2">
          <p className="text-sm text-muted-foreground mb-2">Delivery Frequency</p>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleDecreaseFrequency}
              disabled={frequencyWeeks <= 2}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="font-medium text-foreground min-w-[80px] text-center">
              {frequencyWeeks} weeks
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleIncreaseFrequency}
              disabled={frequencyWeeks >= 8}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
