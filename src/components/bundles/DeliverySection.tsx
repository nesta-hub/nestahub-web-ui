import { useState } from "react";
import { format, addDays, getDate } from "date-fns";
import { CalendarIcon, Check } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DeliveryFrequency, SubscriptionConfig } from "@/data/bundleData";
import { formatPrice, getSubscriptionPrice } from "@/data/bundleData";

interface DeliverySectionProps {
  basePrice: number;
  config: SubscriptionConfig;
  onConfigChange: (config: SubscriptionConfig) => void;
}

export function DeliverySection({
  basePrice,
  config,
  onConfigChange,
}: DeliverySectionProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const tomorrow = addDays(new Date(), 1);
  const subscriptionPrice = getSubscriptionPrice(basePrice);
  const savings = basePrice - subscriptionPrice;

  const handleFrequencyChange = (frequency: DeliveryFrequency) => {
    onConfigChange({ ...config, frequency });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onConfigChange({ ...config, startDate: date });
      setCalendarOpen(false);
    }
  };

  const handleDeliveryTypeChange = (isSubscription: boolean) => {
    onConfigChange({
      ...config,
      frequency: isSubscription ? "bi-weekly" : "one-time",
    });
  };

  const isSubscription = config.frequency !== "one-time";

  // Generate confirmation message based on frequency
  const getConfirmationMessage = () => {
    const day = getDate(config.startDate);
    const dayWithSuffix = getDayWithSuffix(day);
    const formattedDate = format(config.startDate, "MMMM d");

    if (config.frequency === "bi-weekly") {
      return `Delivered every 2 weeks starting ${formattedDate}`;
    } else if (config.frequency === "monthly") {
      return `Delivered monthly on the ${dayWithSuffix}`;
    }
    return "";
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Delivery</h3>

      {/* One-time vs Subscribe toggle */}
      <div className="space-y-3">
        {/* One-time option */}
        <button
          className={cn(
            "w-full p-4 rounded-lg border text-left transition-all",
            "flex items-center justify-between",
            !isSubscription
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
          onClick={() => handleDeliveryTypeChange(false)}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                !isSubscription ? "border-primary" : "border-muted-foreground"
              )}
            >
              {!isSubscription && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </div>
            <span className="font-medium text-foreground">One-time Purchase</span>
          </div>
          <span className="font-semibold text-foreground">
            {formatPrice(basePrice)}
          </span>
        </button>

        {/* Subscribe option */}
        <button
          className={cn(
            "w-full p-4 rounded-lg border text-left transition-all",
            "flex items-center justify-between",
            isSubscription
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
          onClick={() => handleDeliveryTypeChange(true)}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                isSubscription ? "border-primary" : "border-muted-foreground"
              )}
            >
              {isSubscription && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </div>
            <span className="font-medium text-foreground">Subscribe</span>
          </div>
          <div className="text-right">
            <span className="font-semibold text-foreground">
              {formatPrice(subscriptionPrice)}
            </span>
            <p className="text-xs text-green-600">Save 5%</p>
          </div>
        </button>
      </div>

      {/* Subscription options */}
      {isSubscription && (
        <div className="space-y-4 pt-2">
          {/* Frequency tabs */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Frequency:</label>
            <Tabs
              value={config.frequency}
              onValueChange={(v) => handleFrequencyChange(v as DeliveryFrequency)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bi-weekly">Every 2 Weeks</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Start date picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Start Date:</label>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {format(config.startDate, "MMMM d, yyyy")}
                </span>
              </div>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Change
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={config.startDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < tomorrow}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Confirmation message */}
          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-green-700 dark:text-green-400">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{getConfirmationMessage()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to add ordinal suffix to day number
function getDayWithSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return `${day}th`;
  }
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}
