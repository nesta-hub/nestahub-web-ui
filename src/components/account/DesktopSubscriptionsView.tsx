import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  RefreshCw,
  ShoppingCart,
  Minus,
  Plus,
  Sparkles,
  Settings2,
  Truck,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMySubscriptions,
  updateSubscriptionFrequency,
  updateSubscriptionQuantity,
  moveSubscriptionNextDate,
  cancelSubscriptionWithReason,
  formatPrice,
  MySubscription,
} from "@/lib/api";
import { CloudinaryPresets } from "@/lib/cloudinary";
import { ManageSubscriptionDrawer } from "@/components/subscriptions/ManageSubscriptionDrawer";
import { MoveDateDrawer } from "@/components/subscriptions/MoveDateDrawer";
import { SkipCycleDrawer } from "@/components/subscriptions/SkipCycleDrawer";
import { CancelSubscriptionDrawer } from "@/components/subscriptions/CancelSubscriptionDrawer";
import { FrequencyConfirmDrawer } from "@/components/subscriptions/FrequencyConfirmDrawer";
import { FrequencyStartDateDrawer } from "@/components/subscriptions/FrequencyStartDateDrawer";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { format } from "date-fns";

const FREQUENCY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8].map((w) => ({
  weeks: w,
  label: `${w} wk${w !== 1 ? "s" : ""}`,
}));

function parseDate(dateStr: string): Date {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 999;
  const d = parseDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatNextDelivery(date: string | null): string {
  if (!date) return "Paused";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface DesktopSubscriptionsViewProps {
  onBack: () => void;
}

export function DesktopSubscriptionsView({ onBack }: DesktopSubscriptionsViewProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { addToCart, items: cartItems } = useCart();
  const queryClient = useQueryClient();
  const token = session?.access_token ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["my-subscriptions"],
    queryFn: () => getMySubscriptions(token),
    enabled: !!token,
  });

  const subs = data?.subscriptions ?? [];
  const sortedSubs = useMemo(
    () =>
      [...subs].sort((a, b) => {
        if (!a.nextRenewalDate) return 1;
        if (!b.nextRenewalDate) return -1;
        return new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime();
      }),
    [subs]
  );

  const activeSubs = sortedSubs.filter((s) => s.status === "active");
  const totalSavings = activeSubs.reduce(
    (sum, s) => sum + (s.regularPrice - (s.subscriptionPrice || s.unitPrice)) * s.quantity,
    0
  );
  const cycleTotal = activeSubs.reduce(
    (sum, s) => sum + (s.subscriptionPrice || s.unitPrice) * s.quantity,
    0
  );
  const nextSub = activeSubs[0];

  // Drawer states
  const [manageSub, setManageSub] = useState<MySubscription | null>(null);
  const [moveDateSub, setMoveDateSub] = useState<MySubscription | null>(null);
  const [skipCycleSub, setSkipCycleSub] = useState<MySubscription | null>(null);
  const [cancelSub, setCancelSub] = useState<MySubscription | null>(null);
  const [frequencySub, setFrequencySub] = useState<MySubscription | null>(null);
  const [pendingFrequency, setPendingFrequency] = useState<number | null>(null);
  const [freqConfirmOpen, setFreqConfirmOpen] = useState(false);
  const [freqStartDateOpen, setFreqStartDateOpen] = useState(false);
  const [quantitySub, setQuantitySub] = useState<MySubscription | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState(1);

  const [pendingFreqChange, setPendingFreqChange] = useState<{
    subId: string;
    currentFreq: number;
    newFreq: number;
  } | null>(null);

  const isSubscriptionInCart = (id: string) =>
    cartItems.some((item) => item.subscriptionId === id);

  // Mutations
  const moveNextDateMutation = useMutation({
    mutationFn: ({ subId, newDate, resetSchedule }: { subId: string; newDate: Date; resetSchedule: boolean }) =>
      moveSubscriptionNextDate(subId, newDate.toISOString(), resetSchedule, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
      setMoveDateSub(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ subId, reason }: { subId: string; reason?: string }) =>
      cancelSubscriptionWithReason(subId, reason, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
      setCancelSub(null);
    },
  });

  const freqMutation = useMutation({
    mutationFn: ({ subId, frequencyWeeks }: { subId: string; frequencyWeeks: number }) =>
      updateSubscriptionFrequency(subId, frequencyWeeks, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
      toast.success("Frequency updated", {
        description: `Now every ${variables.frequencyWeeks} week${variables.frequencyWeeks !== 1 ? "s" : ""}`,
      });
      setPendingFreqChange(null);
      setFreqConfirmOpen(false);
      setFreqStartDateOpen(false);
      setFrequencySub(null);
      setPendingFrequency(null);
    },
  });

  const changeQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      updateSubscriptionQuantity(id, quantity, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
      toast.success("Quantity updated", { description: `Now receiving ${variables.quantity} per order` });
      setQuantitySub(null);
    },
  });

  const handleMoveDateConfirm = (newDate: Date, resetSchedule?: boolean) => {
    if (!moveDateSub) return;
    const formatted = newDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    moveNextDateMutation.mutate({ subId: moveDateSub.id, newDate, resetSchedule: resetSchedule ?? true });
    toast.success("Order date updated", { description: `Next order: ${formatted}` });
  };

  const handleSkipConfirm = () => {
    if (!skipCycleSub) return;
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + skipCycleSub.frequencyWeeks * 7);
    const formatted = newDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    toast.success("Order skipped", { description: `Next order: ${formatted}` });
    setSkipCycleSub(null);
  };

  const handleCancelConfirm = (reason?: string) => {
    if (!cancelSub) return;
    cancelMutation.mutate({ subId: cancelSub.id, reason });
    toast.success("Subscription cancelled", {
      description: reason ? `Reason: ${reason}` : "Your subscription has been cancelled.",
    });
  };

  const handleFrequencySelect = () => {
    if (!frequencySub || pendingFrequency === null) return;
    setPendingFreqChange({ subId: frequencySub.id, currentFreq: frequencySub.frequencyWeeks, newFreq: pendingFrequency });
    setFrequencySub(null);
    setPendingFrequency(null);
    setFreqConfirmOpen(true);
  };

  const handleFrequencyConfirm = () => {
    if (!pendingFreqChange) return;
    freqMutation.mutate({ subId: pendingFreqChange.subId, frequencyWeeks: pendingFreqChange.newFreq });
  };

  const computeNewNextDate = (sub: MySubscription, newFreqWeeks: number): Date => {
    if (!sub.nextRenewalDate) {
      const d = new Date();
      d.setDate(d.getDate() + newFreqWeeks * 7);
      return d;
    }
    const currentNext = new Date(sub.nextRenewalDate);
    const lastOrder = new Date(currentNext);
    lastOrder.setDate(lastOrder.getDate() - sub.frequencyWeeks * 7);
    const newNext = new Date(lastOrder);
    newNext.setDate(newNext.getDate() + newFreqWeeks * 7);
    return newNext;
  };

  const getSkipNewDate = (sub: MySubscription): string => {
    if (!sub.nextRenewalDate) return "—";
    const d = new Date(sub.nextRenewalDate);
    d.setDate(d.getDate() + sub.frequencyWeeks * 7);
    return format(d, "do MMMM yyyy");
  };

  const handleAddToCart = (sub: MySubscription) => {
    addToCart(
      {
        variantId: sub.variantId,
        productId: sub.productId,
        productName: sub.productName,
        brand: sub.productBrand,
        slug: sub.productSlug || sub.productId,
        typeId: sub.variantId,
        typeName: sub.productName,
        attributes: sub.variantAttributes.map((attr) => ({
          attributeName: attr.name,
          value: attr.value,
          displayValue: attr.value,
        })),
        unitPrice: sub.subscriptionPrice || sub.unitPrice,
        image: sub.imageUrl || undefined,
        isAutoRenew: true,
        frequencyWeeks: sub.frequencyWeeks,
        subscriptionPrice: sub.subscriptionPrice || undefined,
        subscriptionId: sub.id,
      },
      sub.quantity
    );
    toast.success("Added to cart", {
      action: { label: "Go to Cart", onClick: () => setTimeout(() => navigate("/cart"), 100) },
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Top nav */}
      <div className="border-b bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="container flex items-center h-14 gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Account
          </button>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="text-base font-bold text-foreground">My Subscriptions</h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left — summary */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-20 space-y-4">
              {/* Hero summary card */}
              <div className="rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-primary/10">
                <div className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-[0.18em] font-semibold mb-3">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Active subscriptions
                  </div>
                  <p className="text-[40px] leading-none font-bold text-foreground tabular-nums">
                    {isLoading ? "—" : activeSubs.length}
                  </p>
                  <p className="text-muted-foreground text-xs mt-3 leading-relaxed">
                    {nextSub
                      ? `Next delivery on ${formatNextDelivery(nextSub.nextRenewalDate)}`
                      : "Subscribe to save 5% on every order."}
                  </p>
                </div>
                <div className="border-t border-primary/10 grid grid-cols-2 divide-x divide-primary/10">
                  <div className="px-5 py-3.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      Per cycle
                    </p>
                    <p className="text-sm font-bold text-foreground tabular-nums">
                      {formatPrice(cycleTotal)}
                    </p>
                  </div>
                  <div className="px-5 py-3.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      Saved / cycle
                    </p>
                    <p className="text-sm font-bold text-emerald-700 tabular-nums">
                      {formatPrice(totalSavings)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Why subscribe */}
              <div className="rounded-2xl border border-foreground/[0.06] bg-card p-5 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-foreground">Why subscribe</h3>
                {[
                  { icon: Sparkles, text: "5% off every recurring order, automatically" },
                  { icon: Truck, text: "Free standard delivery on every cycle" },
                  { icon: Settings2, text: "Skip, pause or change frequency anytime" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
                <button
                  onClick={() => navigate("/catalogue")}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Browse products to subscribe →
                </button>
              </div>
            </div>
          </aside>

          {/* Right — subscription list */}
          <div className="col-span-12 lg:col-span-8">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-48 rounded-3xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : activeSubs.length === 0 ? (
              <div className="bg-card rounded-3xl border border-foreground/[0.06] shadow-sm flex flex-col items-center justify-center py-24 text-center px-6">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <RefreshCw className="w-6 h-6 text-muted-foreground/60" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">No active subscriptions</p>
                <p className="text-xs text-muted-foreground mb-6 max-w-[36ch]">
                  Subscribe to products you use regularly and save 5% on every order.
                </p>
                <Button variant="shop" onClick={() => navigate("/catalogue")}>
                  Browse Products
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSubs.map((sub) => {
                  const qty = sub.quantity;
                  const displayVariant = sub.variantAttributes.map((a) => a.value).join(" · ");
                  const days = daysUntil(sub.nextRenewalDate);
                  const urgencyClass =
                    days <= 0
                      ? "bg-red-100 text-red-700 border-red-200"
                      : days <= 7
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-emerald-100 text-emerald-700 border-emerald-200";
                  const urgencyLabel =
                    days <= 0 ? "Due today" : days === 1 ? "Due tomorrow" : `In ${days} days`;

                  return (
                    <div
                      key={sub.id}
                      className="bg-card rounded-3xl border border-foreground/[0.06] shadow-[0_2px_12px_-4px_hsl(28_25%_25%/0.10)] hover:shadow-[0_4px_20px_-4px_hsl(28_25%_25%/0.16)] transition-shadow overflow-hidden"
                    >
                      <div className="flex gap-5 p-5">
                        {/* Image */}
                        <div className="relative w-32 h-32 rounded-2xl bg-secondary/50 overflow-hidden shrink-0">
                          {sub.imageUrl ? (
                            <img
                              src={CloudinaryPresets.card(sub.imageUrl)}
                              alt={`${sub.productBrand} ${sub.productName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30 flex items-center justify-center">
                              <RefreshCw className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-lg font-bold text-foreground leading-tight truncate">
                                {sub.productBrand} {sub.productName}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {[displayVariant, `Qty: ${qty}`].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-2 py-0.5 font-semibold shrink-0 border",
                                urgencyClass
                              )}
                            >
                              {urgencyLabel}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap mt-3">
                            <span className="inline-flex items-center gap-1 text-[11px] bg-secondary/60 text-foreground/70 font-medium px-2.5 py-1 rounded-full">
                              <Calendar className="w-3 h-3" /> Every {sub.frequencyWeeks}{" "}
                              wk{sub.frequencyWeeks !== 1 ? "s" : ""}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Next: {formatNextDelivery(sub.nextRenewalDate)}
                            </span>
                          </div>

                          <div className="mt-auto pt-3 flex items-end justify-between gap-3">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-xl font-bold text-foreground">
                                {formatPrice((sub.subscriptionPrice || sub.unitPrice) * sub.quantity)}
                              </span>
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(sub.regularPrice * sub.quantity)}
                              </span>
                              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                                Save{" "}
                                {formatPrice(
                                  (sub.regularPrice - (sub.subscriptionPrice || sub.unitPrice)) *
                                    sub.quantity
                                )}
                              </span>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="outline"
                                className="h-9 text-xs rounded-xl"
                                onClick={() => setManageSub(sub)}
                              >
                                Manage
                              </Button>
                              {isSubscriptionInCart(sub.id) ? (
                                <Button className="h-9 text-xs gap-1.5 rounded-xl" disabled>
                                  <Check className="w-3.5 h-3.5" /> Added
                                </Button>
                              ) : (
                                <Button
                                  className="h-9 text-xs gap-1.5 rounded-xl"
                                  onClick={() => handleAddToCart(sub)}
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" /> Order Now
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manage Drawer */}
      <ManageSubscriptionDrawer
        open={!!manageSub}
        onOpenChange={(open) => !open && setManageSub(null)}
        subscription={manageSub}
        onChangeFrequency={() => {
          if (manageSub) { setFrequencySub(manageSub); setPendingFrequency(manageSub.frequencyWeeks); }
          setManageSub(null);
        }}
        onMoveDate={() => { if (manageSub) setMoveDateSub(manageSub); setManageSub(null); }}
        onChangeQuantity={() => {
          if (manageSub) { setQuantitySub(manageSub); setPendingQuantity(manageSub.quantity); }
          setManageSub(null);
        }}
        onCancel={() => { if (manageSub) setCancelSub(manageSub); setManageSub(null); }}
      />

      {/* Move Date Drawer */}
      <MoveDateDrawer
        open={!!moveDateSub}
        onOpenChange={(open) => !open && setMoveDateSub(null)}
        currentDate={moveDateSub?.nextRenewalDate ?? ""}
        currentFrequency={moveDateSub?.frequencyWeeks ?? 4}
        alreadyMoved={moveDateSub?.lastMoved ?? false}
        onConfirm={handleMoveDateConfirm}
      />

      {/* Skip Cycle Drawer */}
      <SkipCycleDrawer
        open={!!skipCycleSub}
        onOpenChange={(open) => !open && setSkipCycleSub(null)}
        productName={skipCycleSub ? `${skipCycleSub.productBrand} ${skipCycleSub.productName}` : ""}
        currentDate={skipCycleSub?.nextRenewalDate ?? ""}
        newDate={skipCycleSub ? getSkipNewDate(skipCycleSub) : ""}
        lastSkipped={skipCycleSub?.lastSkipped ?? false}
        onConfirm={handleSkipConfirm}
      />

      {/* Cancel Drawer */}
      <CancelSubscriptionDrawer
        open={!!cancelSub}
        onOpenChange={(open) => !open && setCancelSub(null)}
        productName={cancelSub ? `${cancelSub.productBrand} ${cancelSub.productName}` : ""}
        onConfirm={handleCancelConfirm}
        onChangeFrequency={() => {
          setCancelSub(null);
          if (cancelSub) { setFrequencySub(cancelSub); setPendingFrequency(cancelSub.frequencyWeeks); }
        }}
        onMoveDate={() => { setCancelSub(null); if (cancelSub) setMoveDateSub(cancelSub); }}
      />

      {/* Frequency Confirm Drawer */}
      {(() => {
        const sub = pendingFreqChange ? subs.find((s) => s.id === pendingFreqChange.subId) : null;
        const newNext = sub && pendingFreqChange ? computeNewNextDate(sub, pendingFreqChange.newFreq) : new Date();
        const isImmediate = newNext < new Date();
        const formatDateShort = (d: Date) =>
          d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        return (
          <FrequencyConfirmDrawer
            open={freqConfirmOpen}
            onOpenChange={(open) => { setFreqConfirmOpen(open); }}
            currentFrequency={pendingFreqChange?.currentFreq ?? 4}
            newFrequency={pendingFreqChange?.newFreq ?? 4}
            newNextDate={formatDateShort(newNext)}
            isImmediate={isImmediate}
            onConfirm={handleFrequencyConfirm}
            onPlaceOrderNow={() => {
              if (sub) handleAddToCart(sub);
              setPendingFreqChange(null);
              setFreqConfirmOpen(false);
            }}
            onChooseStartDate={() => { setFreqConfirmOpen(false); setFreqStartDateOpen(true); }}
          />
        );
      })()}

      {/* Frequency Start Date Drawer */}
      <FrequencyStartDateDrawer
        open={freqStartDateOpen}
        onOpenChange={(open) => {
          setFreqStartDateOpen(open);
          if (!open && !freqMutation.isPending) setPendingFreqChange(null);
        }}
        newFrequency={pendingFreqChange?.newFreq ?? 4}
        onConfirm={(startDate) => {
          if (!pendingFreqChange) return;
          freqMutation.mutate({ subId: pendingFreqChange.subId, frequencyWeeks: pendingFreqChange.newFreq });
          moveNextDateMutation.mutate({ subId: pendingFreqChange.subId, newDate: startDate, resetSchedule: true });
        }}
      />

      {/* Change Frequency Drawer */}
      {frequencySub && (
        <Drawer open={!!frequencySub} onOpenChange={() => { setFrequencySub(null); setPendingFrequency(null); }}>
          <DrawerContent className="px-6 pb-8">
            <DrawerHeader className="px-0 pt-4 pb-2">
              <DrawerTitle className="text-base font-semibold">Change Frequency</DrawerTitle>
              <DrawerDescription>
                {frequencySub.productBrand} {frequencySub.productName}
              </DrawerDescription>
            </DrawerHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {FREQUENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.weeks}
                    onClick={() => setPendingFrequency(opt.weeks)}
                    className={cn(
                      "flex items-center justify-center py-3 rounded-xl border-2 transition-all text-sm font-medium",
                      pendingFrequency === opt.weeks
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setFrequencySub(null); setPendingFrequency(null); }}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={pendingFrequency === null || pendingFrequency === frequencySub.frequencyWeeks}
                  onClick={handleFrequencySelect}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Change Quantity Drawer */}
      {quantitySub && (
        <Drawer open={!!quantitySub} onOpenChange={() => setQuantitySub(null)}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Change Quantity</DrawerTitle>
              <DrawerDescription>
                {quantitySub.productBrand} {quantitySub.productName}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-6 py-4">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPendingQuantity(Math.max(1, pendingQuantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold w-16 text-center">{pendingQuantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPendingQuantity(pendingQuantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current total:</span>
                  <span className="font-semibold">
                    {formatPrice((quantitySub.subscriptionPrice || quantitySub.unitPrice) * quantitySub.quantity)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">New total:</span>
                  <span className="font-semibold text-primary">
                    {formatPrice((quantitySub.subscriptionPrice || quantitySub.unitPrice) * pendingQuantity)}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <Button variant="outline" onClick={() => setQuantitySub(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="shop"
                className="flex-1"
                onClick={() => changeQuantityMutation.mutate({ id: quantitySub.id, quantity: pendingQuantity })}
              >
                Save
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
