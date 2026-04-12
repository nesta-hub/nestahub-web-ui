import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

const CANCEL_REASONS = [
  "Price",
  "No longer needed",
  "Frequency didn't work",
  "Switching product",
  "Other",
];

interface CancelSubscriptionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  onConfirm: (reason?: string) => void;
  onMoveDate: () => void;
  onChangeFrequency: () => void;
}

export function CancelSubscriptionDrawer({
  open,
  onOpenChange,
  productName,
  onConfirm,
  onMoveDate,
  onChangeFrequency,
}: CancelSubscriptionDrawerProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [showReasons, setShowReasons] = useState(false);

  const handleClose = () => {
    setSelectedReason(null);
    setShowReasons(false);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle>Cancel Subscription</DrawerTitle>
          <DrawerDescription>
            {showReasons
              ? "Optional: let us know why you're cancelling."
              : `Before you cancel your ${productName} subscription, would you consider one of these instead?`}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2">
          {!showReasons ? (
            <div className="space-y-2">
              <button
                onClick={() => { handleClose(); onChangeFrequency(); }}
                className="w-full p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-center"
              >
                <p className="text-sm font-medium text-foreground">Change frequency</p>
                <p className="text-xs text-muted-foreground">Adjust how often you order this item</p>
              </button>
              <button
                onClick={() => { handleClose(); onMoveDate(); }}
                className="w-full p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-center"
              >
                <p className="text-sm font-medium text-foreground">Move next order date</p>
                <p className="text-xs text-muted-foreground">Push your next order to a later date</p>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              {CANCEL_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason === selectedReason ? null : reason)}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                    selectedReason === reason
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>
          )}
        </div>

        <DrawerFooter>
          {!showReasons ? (
            <Button
              variant="destructive"
              onClick={() => setShowReasons(true)}
              className="w-full"
            >
              I still want to cancel
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={() => { onConfirm(selectedReason ?? undefined); handleClose(); }}
              className="w-full"
            >
              Confirm Cancellation
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
