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
  onChooseStartDate?: () => void;
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
  onChooseStartDate,
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
          {/* Info / Warning card */}
          <div className={`flex gap-3 items-start p-3 rounded-xl ${isImmediate ? "bg-destructive/10" : "bg-primary/10"}`}>
            {isImmediate ? (
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            ) : (
              <CalendarDays className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            )}
            <div className="space-y-1">
              {isImmediate ? (
                <p className="text-sm text-foreground">
                  Changing to every <span className="font-semibold">{newFrequency} week{newFrequency !== 1 ? "s" : ""}</span> would
                  require you to choose a new start date, as it's past {newFrequency} week{newFrequency !== 1 ? "s" : ""} from your last order.
                </p>
              ) : (
                <p className="text-sm text-foreground">
                  Changing to every <span className="font-semibold">{newFrequency} week{newFrequency !== 1 ? "s" : ""}</span> means
                  your next order will be{" "}
                  <span className="font-semibold">{newNextDate}</span>, and every{" "}
                  {newFrequency} week{newFrequency !== 1 ? "s" : ""} after.
                </p>
              )}
            </div>
          </div>

          {/* Summary row */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Current: Every {currentFrequency} week{currentFrequency !== 1 ? "s" : ""}</span>
            <span>New: Every {newFrequency} week{newFrequency !== 1 ? "s" : ""}</span>
          </div>

          {/* Actions */}
          {isImmediate ? (
            <div className="flex flex-col gap-2">
              <Button
                className="w-full h-10"
                onClick={() => {
                  onPlaceOrderNow?.();
                  onOpenChange(false);
                }}
              >
                Place first order now
              </Button>
              <Button
                variant="outline"
                className="w-full h-10"
                onClick={() => {
                  onChooseStartDate?.();
                  onOpenChange(false);
                }}
              >
                Choose a different start date
              </Button>
            </div>
          ) : (
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
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
