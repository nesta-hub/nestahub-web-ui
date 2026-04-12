import { AlertTriangle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface FrequencyConfirmDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFrequency: number;
  newFrequency: number;
  newNextDate: string;
  isImmediate: boolean;
  onConfirm: () => void;
  onPlaceOrderNow?: () => void;
}

export function FrequencyConfirmDrawer({
  open,
  onOpenChange,
  currentFrequency,
  newFrequency,
  newNextDate,
  isImmediate,
  onConfirm,
  onPlaceOrderNow,
}: FrequencyConfirmDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-6 pb-8">
        <DrawerHeader className="px-0 pt-4 pb-2">
          <DrawerTitle className="text-base font-semibold text-foreground">
            Confirm Frequency Change
          </DrawerTitle>
        </DrawerHeader>

        <div className="space-y-4">
          {isImmediate ? (
            <>
              <div className="flex gap-3 items-start p-3 rounded-xl bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">
                  It's already been more than {newFrequency} week{newFrequency !== 1 ? "s" : ""} since your last order.
                </p>
              </div>

              <p className="text-sm text-foreground">
                Would you like to place an order now and set your new frequency to every{" "}
                <span className="font-semibold">{newFrequency} week{newFrequency !== 1 ? "s" : ""}</span> going forward?
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-10"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-10"
                  onClick={() => {
                    onPlaceOrderNow?.();
                    onOpenChange(false);
                  }}
                >
                  Order Now
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-3 items-start p-3 rounded-xl bg-primary/10">
                <CalendarDays className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">
                  Changing to every <span className="font-semibold">{newFrequency} week{newFrequency !== 1 ? "s" : ""}</span> means
                  your next order will be{" "}
                  <span className="font-semibold">{newNextDate}</span>, and every{" "}
                  {newFrequency} week{newFrequency !== 1 ? "s" : ""} after.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-10"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-10"
                  onClick={() => {
                    onConfirm();
                    onOpenChange(false);
                  }}
                >
                  Confirm
                </Button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
