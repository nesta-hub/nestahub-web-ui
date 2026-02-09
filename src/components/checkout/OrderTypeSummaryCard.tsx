import { Package, RefreshCw } from "lucide-react";
import { CartItem } from "@/contexts/CartContext";
import { DeliverySummaryCard } from "./DeliverySummaryCard";

type OrderType = 'one-off' | 'auto-renew';

interface OrderTypeSummaryCardProps {
  orderType: OrderType;
  items: CartItem[];
  onChangeOrderType: () => void;
}

export function OrderTypeSummaryCard({
  orderType,
  items,
  onChangeOrderType,
}: OrderTypeSummaryCardProps) {
  // Generate summary text based on items' auto-renew status
  const getSummaryText = (): string[] => {
    const autoRenewItems = items.filter((i) => i.isAutoRenew);
    const oneTimeItems = items.filter((i) => !i.isAutoRenew);

    const parts: string[] = [];

    if (autoRenewItems.length > 0) {
      // Group by frequency
      const byFrequency = autoRenewItems.reduce((acc, item) => {
        const freq = item.frequencyWeeks ?? 4;
        if (!acc[freq]) acc[freq] = [];
        acc[freq].push(item.productName);
        return acc;
      }, {} as Record<number, string[]>);

      Object.entries(byFrequency).forEach(([freq, names]) => {
        parts.push(`${names.join(", ")}: every ${freq} weeks`);
      });
    }

    if (oneTimeItems.length > 0) {
      const names = oneTimeItems.map((i) => i.productName).join(", ");
      parts.push(`${names}: one-time only`);
    }

    return parts;
  };

  if (orderType === 'one-off') {
    return (
      <DeliverySummaryCard
        icon={<Package className="w-5 h-5 text-primary" />}
        title="One-Off Order"
        subtitle="All items ordered just this once"
        onChangeClick={onChangeOrderType}
      />
    );
  }

  const summaryLines = getSummaryText();

  return (
    <DeliverySummaryCard
      icon={<RefreshCw className="w-5 h-5 text-primary" />}
      title="Auto-Renew Configured"
      subtitle={
        <div className="space-y-0.5">
          {summaryLines.map((line, idx) => (
            <p key={idx} className="text-sm text-muted-foreground">
              {line}
            </p>
          ))}
        </div>
      }
      onChangeClick={onChangeOrderType}
    />
  );
}
