import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResumeOrderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingOrderNumber: string;
  existingTotalAmount: number;
  paymentOption: string | null;
  onResume: () => void;
  onCancelAndNew: () => void;
  isCancelling: boolean;
}

export function ResumeOrderDrawer({
  open,
  onOpenChange,
  existingOrderNumber,
  paymentOption,
  onResume,
  onCancelAndNew,
  isCancelling,
}: ResumeOrderDrawerProps) {
  const isMobile = useIsMobile();
  const isPayOnDelivery = paymentOption === 'pay-on-delivery';

  const title = isPayOnDelivery
    ? 'Do you want to go ahead and create a duplicate order?'
    : 'You have a similar unfinished order!';

  const description = !isPayOnDelivery
    ? 'You started an order recently with these exact items. Would you like to proceed paying for that, or cancel it and let this be a new order?'
    : null;

  const subtext = isPayOnDelivery
    ? `You have a pending order (${existingOrderNumber}) with these exact items.`
    : `Order: ${existingOrderNumber}`;

  const primaryLabel = isPayOnDelivery ? 'Yes, Proceed' : 'Resume Payment';
  const secondaryLabel = !isPayOnDelivery && isCancelling ? null : isPayOnDelivery ? 'Cancel' : 'Cancel Old & Start New';

  const buttons = (
    <div className="flex flex-col gap-3 w-full">
      <Button
        variant="shop"
        className="w-full h-12 rounded-xl text-base"
        onClick={onResume}
      >
        {primaryLabel}
      </Button>
      <Button
        variant="outline"
        className={`w-full h-12 rounded-xl text-base ${
          isPayOnDelivery
            ? 'border-border hover:bg-secondary'
            : 'text-destructive border-destructive/30 hover:bg-destructive/5'
        }`}
        onClick={isPayOnDelivery ? () => onOpenChange(false) : onCancelAndNew}
        disabled={!isPayOnDelivery && isCancelling}
      >
        {!isPayOnDelivery && isCancelling ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Cancelling...
          </>
        ) : (
          secondaryLabel
        )}
      </Button>
    </div>
  );

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-3xl p-8 gap-0">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold text-foreground">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-sm text-muted-foreground mt-2">
                {description}
              </DialogDescription>
            )}
            <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>
          </DialogHeader>
          {buttons}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="px-6 pt-6 pb-2 text-left">
          <DrawerTitle className="text-lg font-bold text-foreground">{title}</DrawerTitle>
          {description && (
            <DrawerDescription className="text-sm text-muted-foreground mt-2">
              {description}
            </DrawerDescription>
          )}
          <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>
        </DrawerHeader>
        <DrawerFooter className="px-6 pt-2 pb-8">
          {buttons}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
