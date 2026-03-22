import { useState } from "react";
import { CalendarDays, ChevronLeft } from "lucide-react";
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

interface MoveDateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: string;
  currentFrequency: number;
  lastMoved: boolean;
  onConfirm: (newDate: Date) => void;
}

export function MoveDateDrawer({
  open,
  onOpenChange,
  currentDate,
  currentFrequency,
  lastMoved,
  onConfirm,
}: MoveDateDrawerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [step, setStep] = useState<"calendar" | "confirm">("calendar");

  const today = new Date();
  const currentOrderDate = currentDate ? new Date(currentDate) : today;

  // Max date is 5 days from the current order date, not from today
  const maxDate = new Date(currentOrderDate);
  maxDate.setDate(maxDate.getDate() + 5);

  // Format current date for display
  const formattedCurrentDate = currentDate ? format(new Date(currentDate), "do MMMM yyyy") : "";

  // Calculate following order date for preview
  const followingOrderDate = selectedDate ? addWeeks(selectedDate, currentFrequency) : null;

  const handleContinue = () => {
    if (!selectedDate) return;
    setStep("confirm");
  };

  const handleBack = () => {
    setStep("calendar");
  };

  const handleConfirm = () => {
    if (!selectedDate) return;
    onConfirm(selectedDate);
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelectedDate(undefined);
    setStep("calendar");
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) resetAndClose(); }}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            {step === "confirm" && !lastMoved && (
              <button onClick={handleBack} className="p-1 -ml-2 mr-1">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <CalendarDays className="w-5 h-5 text-primary" />
            Move Order Date
          </DrawerTitle>
          <DrawerDescription>
            {lastMoved
              ? "You already moved this order — this option resets after your next order."
              : step === "calendar"
              ? `Current date: ${formattedCurrentDate}. Pick a new date within the next 5 days.`
              : "Review your changes"}
          </DrawerDescription>
        </DrawerHeader>

        {!lastMoved && (
          <div className="px-4 pb-2">
            {step === "calendar" ? (
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < currentOrderDate || date > maxDate}
                  defaultMonth={currentOrderDate}
                  className={cn("rounded-md border pointer-events-auto")}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary card */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current date</span>
                    <span className="font-medium text-foreground">{formattedCurrentDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">New date</span>
                    <span className="font-medium text-primary">
                      {selectedDate ? format(selectedDate, "do MMMM yyyy") : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frequency</span>
                    <span className="font-medium text-foreground">
                      Every {currentFrequency} week{currentFrequency !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Following order</span>
                    <span className="font-medium text-foreground">
                      {followingOrderDate ? format(followingOrderDate, "do MMMM yyyy") : "—"}
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <p className="text-xs text-muted-foreground text-center">
                  Future orders will be every {currentFrequency} week{currentFrequency !== 1 ? "s" : ""} from this new date.
                </p>
              </div>
            )}
          </div>
        )}

        <DrawerFooter>
          {lastMoved ? (
            <Button
              disabled
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Cannot move again
            </Button>
          ) : step === "calendar" ? (
            <Button onClick={handleContinue} disabled={!selectedDate} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Continue
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={handleBack}>
                Back
              </Button>
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleConfirm}>
                Confirm
              </Button>
            </div>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
