import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import {
  SubscribeExplainer,
  BulkActionButtons,
  SubscribeItemCard,
  SubscribeSummary,
} from "@/components/subscribe";

export default function Subscribe() {
  const navigate = useNavigate();
  const {
    items,
    subscriptionStartDate,
    setSubscriptionStartDate,
    setItemAutoRenew,
    setAllItemsAutoRenew,
  } = useCart();

  // Redirect to catalogue if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate("/catalogue");
    }
  }, [items.length, navigate]);

  const hasAnyAutoRenew = useMemo(
    () => items.some((item) => item.isAutoRenew),
    [items]
  );

  const allOneTime = useMemo(
    () => items.every((item) => !item.isAutoRenew),
    [items]
  );

  const allAutoRenew = useMemo(
    () => items.length > 0 && items.every((item) => item.isAutoRenew),
    [items]
  );

  const tomorrow = addDays(new Date(), 1);

  const handleBack = () => {
    navigate(-1);
  };

  const handleContinueToCheckout = () => {
    navigate("/checkout");
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">
            Configure Your Order
          </h1>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-48">
        <div className="px-4 py-4 space-y-6">
          {/* Explainer Card */}
          <SubscribeExplainer />

          {/* Bulk Action Buttons */}
          <BulkActionButtons
            onSetAllOneTime={() => setAllItemsAutoRenew(false)}
            onSetAllAutoRenew={() => setAllItemsAutoRenew(true, 4)}
            allOneTime={allOneTime}
            allAutoRenew={allAutoRenew}
          />

          {/* Items List */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Your Items</p>
            {items.map((item) => (
              <SubscribeItemCard
                key={item.variantId}
                item={item}
                onToggleAutoRenew={(isAutoRenew) =>
                  setItemAutoRenew(
                    item.variantId,
                    isAutoRenew,
                    isAutoRenew ? 4 : undefined
                  )
                }
                onFrequencyChange={(weeks) =>
                  setItemAutoRenew(
                    item.variantId,
                    true,
                    weeks
                  )
                }
              />
            ))}
          </div>

          {/* Start Date (only if any auto-renew) */}
          {hasAnyAutoRenew && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Start Date
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12",
                      !subscriptionStartDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {subscriptionStartDate
                      ? format(subscriptionStartDate, "EEEE, MMMM d, yyyy")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={subscriptionStartDate}
                    onSelect={(date) => date && setSubscriptionStartDate(date)}
                    disabled={(date) => date < tomorrow}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 space-y-4">
        <SubscribeSummary items={items} />
        <Button
          variant="shop"
          className="w-full h-12 rounded-xl"
          onClick={handleContinueToCheckout}
        >
          Continue to Checkout
        </Button>
      </div>
    </div>
  );
}
