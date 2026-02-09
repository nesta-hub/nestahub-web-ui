import { Button } from "@/components/ui/button";

interface BulkActionButtonsProps {
  onSetAllOneTime: () => void;
  onSetAllAutoRenew: () => void;
  allOneTime: boolean;
  allAutoRenew: boolean;
}

export function BulkActionButtons({
  onSetAllOneTime,
  onSetAllAutoRenew,
  allOneTime,
  allAutoRenew,
}: BulkActionButtonsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Quick Actions</p>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={allOneTime ? "default" : "outline"}
          className={`h-auto py-3 flex flex-col items-center gap-1 ${
            allOneTime ? "bg-primary text-primary-foreground" : ""
          }`}
          onClick={onSetAllOneTime}
        >
          <span className="font-medium">One-time</span>
          <span className="text-xs opacity-80">All Items</span>
        </Button>
        <Button
          variant={allAutoRenew ? "default" : "outline"}
          className={`h-auto py-3 flex flex-col items-center gap-1 ${
            allAutoRenew ? "bg-primary text-primary-foreground" : ""
          }`}
          onClick={onSetAllAutoRenew}
        >
          <span className="font-medium">Auto-Renew</span>
          <span className="text-xs opacity-80">All Items · Save 5%</span>
        </Button>
      </div>
    </div>
  );
}
