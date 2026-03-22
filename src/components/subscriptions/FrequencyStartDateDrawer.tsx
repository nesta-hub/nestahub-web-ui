import { useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import { format, addWeeks } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

interface FrequencyStartDateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newFrequency: number;
  onConfirm: (startDate: Date) => void;
}

export function FrequencyStartDateDrawer({
  open,
  onOpenChange,
  newFrequency,
  onConfirm,
}: FrequencyStartDateDrawerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const resetAndClose = () => {
    setSelectedDate(undefined);
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (!selectedDate) return;
    onConfirm(selectedDate);
    resetAndClose();
  };

  const nextOrderAfter = selectedDate
    ? addWeeks(selectedDate, newFrequency)
    : null;

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) resetAndClose(); }}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Choose Start Date
          </DrawerTitle>
          <DrawerDescription>
            Pick when your first order with the new frequency should be.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-3">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => {
                const d = new Date(date);
                d.setHours(0, 0, 0, 0);
                return d < today;
              }}
              className={cn("rounded-md border pointer-events-auto")}
            />
          </div>

          {selectedDate && (
            <div className="bg-muted/50 rounded-xl p-4 space-y-2 animate-fade-in">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">First order</span>
                <span className="font-medium text-foreground">{format(selectedDate, "d MMM yyyy")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frequency</span>
                <span className="font-medium text-foreground flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Every {newFrequency} week{newFrequency !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Following order</span>
                <span className="font-medium text-primary">
                  {nextOrderAfter ? format(nextOrderAfter, "d MMM yyyy") : "—"}
                </span>
              </div>
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Confirm
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
