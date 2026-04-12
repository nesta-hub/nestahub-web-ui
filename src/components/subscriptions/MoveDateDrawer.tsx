import { useState } from "react";
import { format, differenceInDays } from "date-fns";
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
  alreadyMoved?: boolean;
  onConfirm: (newDate: Date, resetSchedule?: boolean, newFrequencyWeeks?: number) => void;
}

export function MoveDateDrawer({
  open,
  onOpenChange,
  currentDate,
  currentFrequency,
  alreadyMoved,
  onConfirm,
}: MoveDateDrawerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [step, setStep] = useState<"calendar" | "confirm" | "frequency">("calendar");
  const [proposedFrequency, setProposedFrequency] = useState<number | null>(null);
  const [updateFrequency, setUpdateFrequency] = useState<boolean>(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // Parse currentDate safely
  const currentNextDate = new Date(currentDate);
  if (isNaN(currentNextDate.getTime())) {
    // Fallback to tomorrow if invalid date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    currentNextDate.setTime(tomorrow.getTime());
  } else {
    currentNextDate.setHours(0, 0, 0, 0);
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined);
      setDateError(null);
      return;
    }

    setSelectedDate(date);

    // Calculate days difference from current next date
    const daysDiff = differenceInDays(date, currentNextDate);

    // Calculate proposed frequency
    const additionalWeeks = Math.round(daysDiff / 7);
    const newFrequency = currentFrequency + additionalWeeks;

    // Check if proposed frequency exceeds 8 weeks
    if (newFrequency > 8) {
      setDateError("This date is too far away. Maximum frequency is 8 weeks.");
      return;
    }

    setDateError(null);

    // Only propose frequency change if > 7 days away AND frequency would change
    if (daysDiff > 7 && additionalWeeks !== 0) {
      setProposedFrequency(newFrequency);
    } else {
      setProposedFrequency(null);
    }
  };

  const handleContinue = () => {
    if (!selectedDate || dateError) return;

    // If we have a proposed frequency, show frequency confirmation step
    if (proposedFrequency !== null) {
      setStep("frequency");
    } else {
      setStep("confirm");
    }
  };

  const handleFrequencyDecision = (accept: boolean) => {
    setUpdateFrequency(accept);
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!selectedDate) return;

    const newFreq = updateFrequency && proposedFrequency !== null ? proposedFrequency : undefined;
    onConfirm(selectedDate, true, newFreq);
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelectedDate(undefined);
    setStep("calendar");
    setProposedFrequency(null);
    setUpdateFrequency(false);
    setDateError(null);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) resetAndClose(); }}>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle>Move Next Order Date</DrawerTitle>
          <DrawerDescription>
            {step === "calendar"
              ? `Current date: ${format(currentNextDate, "PPP")}. Pick a new date.`
              : step === "frequency"
              ? "Update your delivery frequency?"
              : "Confirm your changes"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2">
          {step === "calendar" ? (
            <div className="space-y-3">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    const d = new Date(date);
                    d.setHours(0, 0, 0, 0);
                    return d < currentNextDate;
                  }}
                  className={cn("rounded-md border pointer-events-auto")}
                />
              </div>
              {dateError && (
                <div className="text-center">
                  <p className="text-sm text-destructive">{dateError}</p>
                </div>
              )}
            </div>
          ) : step === "frequency" ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                You're moving your order date from{" "}
                <span className="font-medium text-foreground">
                  {format(currentNextDate, "PPP")}
                </span>{" "}
                to{" "}
                <span className="font-medium text-foreground">
                  {selectedDate ? format(selectedDate, "PPP") : ""}
                </span>
                .
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm mb-2">
                  Based on this new date, we recommend updating your delivery frequency:
                </p>
                <p className="text-base">
                  <span className="text-muted-foreground">Current: Every {currentFrequency} week{currentFrequency !== 1 ? "s" : ""}</span>
                  {" → "}
                  <span className="font-semibold text-foreground">New: Every {proposedFrequency} week{proposedFrequency !== 1 ? "s" : ""}</span>
                </p>
              </div>
          
            </div>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Your new next order date will be{" "}
                <span className="font-medium text-foreground">
                  {selectedDate ? format(selectedDate, "PPP") : ""}
                </span>
                .
              </p>
              <p className="text-sm text-muted-foreground">
                Your schedule will follow every{" "}
                <span className="font-medium text-foreground">
                  {updateFrequency && proposedFrequency !== null ? proposedFrequency : currentFrequency} week
                  {(updateFrequency && proposedFrequency !== null ? proposedFrequency : currentFrequency) !== 1 ? "s" : ""}
                </span>{" "}
                after that.
              </p>
            </div>
          )}
        </div>

        <DrawerFooter>
          {step === "calendar" ? (
            <Button
              onClick={handleContinue}
              disabled={!selectedDate || !!dateError}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Continue
            </Button>
          ) : step === "frequency" ? (
            <div className="w-full space-y-2">
              <Button
                onClick={() => handleFrequencyDecision(true)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Yes, update to {proposedFrequency} weeks
              </Button>
              <Button
                onClick={() => handleFrequencyDecision(false)}
                variant="outline"
                className="w-full"
              >
                No, keep {currentFrequency} weeks
              </Button>
            </div>
          ) : (
            <Button onClick={handleConfirm} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Confirm
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
