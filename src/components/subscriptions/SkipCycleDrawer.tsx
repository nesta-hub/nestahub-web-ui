import { SkipForward } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

interface SkipCycleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  currentDate: string;
  newDate: string;
  lastSkipped: boolean;
  onConfirm: () => void;
}

export function SkipCycleDrawer({
  open,
  onOpenChange,
  productName,
  currentDate,
  newDate,
  lastSkipped,
  onConfirm,
}: SkipCycleDrawerProps) {
  // Format dates for display
  const formattedCurrentDate = currentDate ? format(new Date(currentDate), "do MMMM yyyy") : "—";
  const formattedNewDate = newDate; // Already formatted from getSkipNewDate

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <SkipForward className="w-5 h-5 text-primary" />
            Skip This Order
          </DrawerTitle>
          <DrawerDescription>
            {lastSkipped
              ? "You skipped your last order — this option resets after your next order."
              : `Skip your upcoming ${productName} order.`}
          </DrawerDescription>
        </DrawerHeader>

        {!lastSkipped && (
          <div className="px-4 pb-2 space-y-3">
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Skipping</span>
                <span className="font-medium text-foreground">{formattedCurrentDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New next order</span>
                <span className="font-medium text-primary">{formattedNewDate}</span>
              </div>
            </div>
          </div>
        )}

        <DrawerFooter>
          <Button
            onClick={() => { onConfirm(); onOpenChange(false); }}
            disabled={lastSkipped}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {lastSkipped ? "Cannot skip again" : "Confirm Skip"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
