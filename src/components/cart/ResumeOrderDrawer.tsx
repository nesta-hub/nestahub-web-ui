import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ResumeOrderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingOrderNumber: string;
  existingTotalAmount: number;
  onResume: () => void;
  onCancelAndNew: () => void;
  isCancelling: boolean;
}

export function ResumeOrderDrawer({
  open,
  onOpenChange,
  existingOrderNumber,
  onResume,
  onCancelAndNew,
  isCancelling,
}: ResumeOrderDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="px-6 pt-6 pb-2 text-left">
          <DrawerTitle className="text-lg font-bold text-foreground">
            You have a similar unfinished order!
          </DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground mt-2">
            You started an order recently with these exact items. Would you like to proceed paying
            for that, or cancel it and let this be a new order?
          </DrawerDescription>
          <p className="text-xs text-muted-foreground/70 mt-1">Order: {existingOrderNumber}</p>
        </DrawerHeader>

        <DrawerFooter className="px-6 pt-2 pb-8 gap-3">
          <Button
            variant="shop"
            className="w-full h-12 rounded-xl text-base"
            onClick={onResume}
          >
            Resume Payment
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl text-base text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={onCancelAndNew}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Old & Start New'
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
