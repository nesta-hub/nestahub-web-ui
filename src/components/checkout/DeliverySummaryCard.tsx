import { ReactNode } from "react";

import { Card } from "@/components/ui/card";

interface DeliverySummaryCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  details?: string;
  onChangeClick: () => void;
}

export function DeliverySummaryCard({
  icon,
  title,
  subtitle,
  details,
  onChangeClick,
}: DeliverySummaryCardProps) {
  return (
    <Card className="p-3 bg-card border-border">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
          )}
          {details && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{details}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onChangeClick}
          className="shrink-0 text-xs text-primary font-medium hover:underline"
        >
          Change
        </button>
      </div>
    </Card>
  );
}
