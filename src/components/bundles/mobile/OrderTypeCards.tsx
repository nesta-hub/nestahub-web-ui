import { useState, useRef } from "react";
import { Check, Minus, Plus, CalendarIcon } from "lucide-react";
import { format, addDays, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { formatPrice, getSubscriptionPrice } from "@/data/bundleData";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type OrderType = 'subscribe' | 'one-time' | null;

interface OrderTypeCardsProps {
  basePrice: number;
  orderType: OrderType;
  onSelect: (type: 'subscribe' | 'one-time') => void;
  frequency: number;
  onFrequencyChange: (weeks: number) => void;
  startDate: Date;
  onStartDateChange: (date: Date) => void;
}

export function OrderTypeCards({ 
  basePrice, 
  orderType, 
  onSelect,
  frequency,
  onFrequencyChange,
  startDate,
  onStartDateChange
}: OrderTypeCardsProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const subscriptionRef = useRef<HTMLDivElement>(null);
  const subscriptionPrice = getSubscriptionPrice(basePrice);
  const tomorrow = addDays(new Date(), 1);
  
  // Format the delivery message
  const getDeliveryMessage = () => {
    const dateStr = isTomorrow(startDate) 
      ? `tomorrow ${format(startDate, "d MMM yyyy")}`
      : format(startDate, "d MMM yyyy");
    return `Your bundle will be delivered every ${frequency} weeks starting ${dateStr}`;
  };
  
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">Pick your order type</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Auto-Renew Card */}
        <button
          onClick={() => onSelect('subscribe')}
          className={cn(
            "relative flex flex-col p-4 rounded-2xl text-left",
            "border transition-all duration-200 card-inner-highlight",
            orderType === 'subscribe' 
              ? "bg-primary/5 ring-2 ring-primary shadow-card border-primary"
              : orderType === null
              ? "bg-card border-border"
              : "bg-card border-border opacity-60"
          )}
        >
          {/* Save badge */}
          <span className="badge-savings self-start mb-2">SAVE 5%</span>
          
          <span className="font-bold text-base">Auto-Renew</span>
          
          {/* Pricing */}
          <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-lg font-bold">{formatPrice(subscriptionPrice)}</span>
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(basePrice)}
            </span>
          </div>
          
          <Separator className="my-3" />
          
          {/* Benefits */}
          <ul className="space-y-1.5 text-xs">
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>Ships every 2 weeks</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>Skip or cancel anytime</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>5% savings always</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>WhatsApp management</span>
            </li>
          </ul>
          
          {/* Radio indicator */}
          <div className={cn(
            "mt-3 w-5 h-5 rounded-full border-2 flex items-center justify-center self-center",
            orderType === 'subscribe' 
              ? "border-primary bg-primary" 
              : "border-muted-foreground"
          )}>
            {orderType === 'subscribe' && (
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
            )}
          </div>
        </button>
        
        {/* One-time Card */}
        <button
          onClick={() => onSelect('one-time')}
          className={cn(
            "relative flex flex-col p-4 rounded-2xl text-left",
            "border transition-all duration-200 card-inner-highlight",
            orderType === 'one-time' 
              ? "bg-primary/5 ring-2 ring-primary shadow-card border-primary"
              : orderType === null
              ? "bg-card border-border"
              : "bg-card border-border opacity-60"
          )}
        >
          {/* Spacer for alignment */}
          <div className="h-5 mb-2" />
          
          <span className="font-bold text-base">One-time</span>
          
          {/* Pricing */}
          <div className="mt-1.5">
            <span className="text-lg font-bold">{formatPrice(basePrice)}</span>
          </div>
          
          <Separator className="my-3" />
          
          {/* Benefits */}
          <ul className="space-y-1.5 text-xs">
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>One month's supply</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
              <span>No commitment</span>
            </li>
          </ul>
          
          {/* Spacer for equal height */}
          <div className="flex-1" />
          
          {/* Radio indicator */}
          <div className={cn(
            "mt-3 w-5 h-5 rounded-full border-2 flex items-center justify-center self-center",
            orderType === 'one-time' 
              ? "border-primary bg-primary" 
              : "border-muted-foreground"
          )}>
            {orderType === 'one-time' && (
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
            )}
          </div>
        </button>
      </div>
      
      {/* Subscription controls - only show when Auto-Renew selected */}
      {orderType === 'subscribe' && (
        <div ref={subscriptionRef} className="mt-4 space-y-4 p-4 bg-card border border-border rounded-xl animate-fade-in-up">
          {/* Frequency selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Subscription Frequency
            </label>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onFrequencyChange(Math.max(2, frequency - 1));
                }}
                disabled={frequency <= 2}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold w-24 text-center">
                {frequency} weeks
              </span>
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onFrequencyChange(Math.min(6, frequency + 1));
                }}
                disabled={frequency >= 6}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Start date picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Start Date
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button className="w-full p-3 border rounded-lg text-left flex justify-between items-center bg-background">
                  <span>{format(startDate, "EEEE, MMMM d, yyyy")}</span>
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      onStartDateChange(date);
                      setCalendarOpen(false);
                    }
                  }}
                  disabled={(date) => date < tomorrow}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Delivery confirmation message */}
          <p className="text-sm text-muted-foreground text-center">
            {getDeliveryMessage()}
          </p>
        </div>
      )}
    </div>
  );
}
