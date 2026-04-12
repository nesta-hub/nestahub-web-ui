import { useState, useMemo } from "react";
import { ArrowLeft, ShoppingCart, Minus, Plus, Hash, Check } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { FloatingCartIcon } from "@/components/cart/FloatingCartIcon";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  getMySubscriptions,
  updateSubscriptionFrequency,
  updateSubscriptionQuantity,
  updateSubscriptionVariant,
  moveSubscriptionNextDate,
  skipSubscriptionCycle,
  cancelSubscriptionWithReason,
  changeSubscriptionVariant,
  formatPrice,
  MySubscription,
  api,
  ProductCard as APIProductCard,
} from "@/lib/api";
import { CloudinaryPresets } from "@/lib/cloudinary";
import { ManageSubscriptionDrawer } from "@/components/subscriptions/ManageSubscriptionDrawer";
import { MoveDateDrawer } from "@/components/subscriptions/MoveDateDrawer";
import { SkipCycleDrawer } from "@/components/subscriptions/SkipCycleDrawer";
import { CancelSubscriptionDrawer } from "@/components/subscriptions/CancelSubscriptionDrawer";
import { FrequencyConfirmDrawer } from "@/components/subscriptions/FrequencyConfirmDrawer";
import { FrequencyStartDateDrawer } from "@/components/subscriptions/FrequencyStartDateDrawer";
import { FrequencySelectDrawer } from "@/components/subscriptions/FrequencySelectDrawer";
import { ProductDetailDrawer } from "@/components/catalogue/ProductDetailDrawer";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

const FREQUENCY_OPTIONS = [
  { weeks: 1, label: "1 wk" },
  { weeks: 2, label: "2 wks" },
  { weeks: 3, label: "3 wks" },
  { weeks: 4, label: "4 wks" },
  { weeks: 5, label: "5 wks" },
  { weeks: 6, label: "6 wks" },
  { weeks: 7, label: "7 wks" },
  { weeks: 8, label: "8 wks" },
];

function parseDate(dateStr: string): Date {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function isWithinDays(dateStr: string, days: number): boolean {
  const d = parseDate(dateStr);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

function getEffectiveStatus(sub: MySubscription): string {
  if (sub.status === "cancelled" || sub.status === "paused") return sub.status;
  if (isWithinDays(sub.nextRenewalDate ?? "", 3)) return "order_due";
  return "active";
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700 border-green-200" },
  order_due: { label: "Order Due", className: "bg-orange-100 text-orange-700 border-orange-200" },
  paused: { label: "Paused", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

interface SubscriptionsViewProps {
  onBack: () => void;
}

export function SubscriptionsView({ onBack }: SubscriptionsViewProps) {
  const { session } = useAuth();
  const { addToCart, openCart, itemCount, items: cartItems } = useCart();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const token = session?.access_token ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["my-subscriptions"],
    queryFn: () => getMySubscriptions(token),
    enabled: !!token,
  });

  const subs = data?.subscriptions ?? [];

  // Sort subscriptions by nextRenewalDate ascending (earliest first)
  const sortedSubs = useMemo(() => {
    return [...subs].sort((a, b) => {
      if (!a.nextRenewalDate) return 1;
      if (!b.nextRenewalDate) return -1;
      return new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime();
    });
  }, [subs]);

  // Calculate active subs and total savings
  const activeSubs = sortedSubs.filter(s => s.status === 'active');
  const totalSavings = activeSubs.reduce(
    (sum, s) => sum + ((s.regularPrice - (s.subscriptionPrice || s.unitPrice)) * s.quantity),
    0,
  );

  // Drawer states
  const [manageSub, setManageSub] = useState<MySubscription | null>(null);
  const [moveDateSub, setMoveDateSub] = useState<MySubscription | null>(null);
  const [skipCycleSub, setSkipCycleSub] = useState<MySubscription | null>(null);
  const [cancelSub, setCancelSub] = useState<MySubscription | null>(null);
  const [freqConfirmOpen, setFreqConfirmOpen] = useState(false);
  const [freqStartDateOpen, setFreqStartDateOpen] = useState(false);

  // Quantity change drawer states
  const [quantitySub, setQuantitySub] = useState<MySubscription | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState(1);

  // Product change states
  const [productChangeSub, setProductChangeSub] = useState<MySubscription | null>(null);
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);

  // Frequency change drawer states
  const [frequencySub, setFrequencySub] = useState<MySubscription | null>(null);
  const [pendingFrequency, setPendingFrequency] = useState<number | null>(null);

  // Legacy frequency select drawer states (keeping for compatibility)
  const [freqSelectSub, setFreqSelectSub] = useState<MySubscription | null>(null);
  const [freqSelectOpen, setFreqSelectOpen] = useState(false);

  // Pending frequency change (for confirmation flow)
  const [pendingFreqChange, setPendingFreqChange] = useState<{
    subId: string;
    currentFreq: number;
    newFreq: number;
  } | null>(null);

  // Helper function to check if a subscription is in cart
  const isSubscriptionInCart = (subscriptionId: string) => {
    return cartItems.some(item => item.subscriptionId === subscriptionId);
  };

  // Fetch category products when changing product
  const { data: categoryProductsData } = useQuery({
    queryKey: ["products", "category", productChangeSub?.categoryId],
    queryFn: () => api.getProducts({ category: productChangeSub!.categoryId, limit: 20 }),
    enabled: !!productChangeSub?.categoryId,
  });

  // Mutations
  const moveNextDateMutation = useMutation({
    mutationFn: ({
      subId,
      newDate,
      resetSchedule,
      newFrequencyWeeks,
    }: {
      subId: string;
      newDate: Date;
      resetSchedule: boolean;
      newFrequencyWeeks?: number;
    }) => moveSubscriptionNextDate(subId, newDate.toISOString(), resetSchedule, token, newFrequencyWeeks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
      setMoveDateSub(null);
    },
  });

  const skipCycleMutation = useMutation({
    mutationFn: (subId: string) => skipSubscriptionCycle(subId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
      setSkipCycleSub(null);
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
    mutationFn: ({ subId, frequencyWeeks, startDate }: {
      subId: string;
      frequencyWeeks: number;
      startDate?: Date;
    }) => updateSubscriptionFrequency(subId, frequencyWeeks, token),
    onSuccess: (_, variables) => {
      // If a custom start date was provided, also update the next renewal date
      if (variables.startDate) {
        moveNextDateMutation.mutate({
          subId: variables.subId,
          newDate: variables.startDate,
          resetSchedule: true,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
      toast.success("Frequency updated", {
        description: `Now every ${variables.frequencyWeeks} week${variables.frequencyWeeks !== 1 ? "s" : ""}`,
      });
      setPendingFreqChange(null);
      setFreqConfirmOpen(false);
      setFreqStartDateOpen(false);
      setFreqSelectSub(null);
      setFreqSelectOpen(false);
    },
  });

  const changeQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      updateSubscriptionQuantity(id, quantity, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
      toast.success("Quantity updated", {
        description: `Now receiving ${variables.quantity} per order`
      });
      setQuantitySub(null);
    },
  });

  const variantChangeMutation = useMutation({
    mutationFn: ({ subId, variantId, quantity }: { subId: string; variantId: string; quantity?: number }) =>
      changeSubscriptionVariant(subId, variantId, token, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
      toast.success("Product updated successfully");
      setProductChangeSub(null);
      setProductDrawerOpen(false);
      setSelectedProductSlug(null);
    },
  });

  // Handlers
  const handleMoveDateConfirm = (newDate: Date, resetSchedule?: boolean, newFrequencyWeeks?: number) => {
    if (!moveDateSub) return;
    const formatted = newDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    moveNextDateMutation.mutate({
      subId: moveDateSub.id,
      newDate,
      resetSchedule: resetSchedule ?? true,
      newFrequencyWeeks,
    });
    const frequency = newFrequencyWeeks ?? moveDateSub.frequencyWeeks;
    toast.success("Order date updated", {
      description: `Next order: ${formatted}. Future orders will be every ${frequency} week${frequency !== 1 ? "s" : ""} from this date.`,
    });
  };

  const handleSkipConfirm = () => {
    if (!skipCycleSub) return;
    skipCycleMutation.mutate(skipCycleSub.id);
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + skipCycleSub.frequencyWeeks * 7);
    const formatted = newDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    toast.success("Order skipped", { description: `Next order: ${formatted}` });
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
    setPendingFreqChange({
      subId: frequencySub.id,
      currentFreq: frequencySub.frequencyWeeks,
      newFreq: pendingFrequency,
    });
    setFrequencySub(null);
    setPendingFrequency(null);
    setFreqConfirmOpen(true);
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
        attributes: sub.variantAttributes.map(attr => ({
          attributeName: attr.name,
          value: attr.value,
          displayValue: attr.value,
        })),
        unitPrice: sub.subscriptionPrice || sub.unitPrice,
        image: sub.imageUrl || undefined,
        isAutoRenew: true,
        frequencyWeeks: sub.frequencyWeeks,
        subscriptionPrice: sub.subscriptionPrice || undefined,
        subscriptionId: sub.id, // Pass subscription ID to prevent duplicate creation
      },
      sub.quantity,
    );
    toast.success("Added to cart", {
      action: {
        label: "Go to Cart",
        onClick: () => setTimeout(() => navigate('/cart'), 100),
      },
      cancel: {
        label: "Shop Other Items",
        onClick: () => setTimeout(() => navigate('/catalogue'), 100),
      },
    });
  };

  const getDateBadgeClass = (dateStr: string | null) => {
    if (!dateStr) return "bg-emerald-500/15 text-emerald-700";
    const parsed = parseDate(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    const diffDays = Math.floor((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "bg-red-500/15 text-red-700";
    if (diffDays <= 7) return "bg-amber-500/15 text-amber-700";
    return "bg-emerald-500/15 text-emerald-700";
  };

  const handleChangeFrequency = (sub: MySubscription, newFrequency: number) => {
    setPendingFreqChange({
      subId: sub.id,
      currentFreq: sub.frequencyWeeks,
      newFreq: newFrequency,
    });
    setFreqConfirmOpen(true);
  };

  const handleFrequencyConfirm = () => {
    if (!pendingFreqChange) return;
    freqMutation.mutate({
      subId: pendingFreqChange.subId,
      frequencyWeeks: pendingFreqChange.newFreq,
    });
  };

  const handleFrequencyStartDateConfirm = (startDate: Date) => {
    if (!pendingFreqChange) return;

    // Pass startDate directly to mutation - don't rely on state timing
    freqMutation.mutate({
      subId: pendingFreqChange.subId,
      frequencyWeeks: pendingFreqChange.newFreq,
      startDate: startDate,
    });
  };

  const getSkipNewDate = (sub: MySubscription): string => {
    if (!sub.nextRenewalDate) return "—";

    const d = new Date(sub.nextRenewalDate);
    d.setDate(d.getDate() + sub.frequencyWeeks * 7);
    return format(d, "do MMMM yyyy");
  };

  const formatNextDelivery = (date: string | null): string => {
    if (!date) return "Paused";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Compute new next date for frequency change
  const computeNewNextDate = (sub: MySubscription, newFreqWeeks: number): Date => {
    if (!sub.nextRenewalDate) {
      const d = new Date();
      d.setDate(d.getDate() + newFreqWeeks * 7);
      return d;
    }
    const currentNext = new Date(sub.nextRenewalDate);
    if (isNaN(currentNext.getTime())) {
      const d = new Date();
      d.setDate(d.getDate() + newFreqWeeks * 7);
      return d;
    }
    // Calculate last order date: currentNext - currentFrequency
    const lastOrder = new Date(currentNext);
    lastOrder.setDate(lastOrder.getDate() - sub.frequencyWeeks * 7);
    // Calculate new next: lastOrder + newFrequency
    const newNext = new Date(lastOrder);
    newNext.setDate(newNext.getDate() + newFreqWeeks * 7);
    return newNext;
  };

  // Find the correct product slug from category products by matching name/brand
  const productSlugForChange = useMemo(() => {
    if (!productChangeSub || !categoryProductsData) return null;

    console.log('🔍 Looking for product:', productChangeSub.productName, productChangeSub.productBrand);
    console.log('📦 Available products:', categoryProductsData.products.map(p => `${p.brand} ${p.name}`));

    const matchedProduct = categoryProductsData.products.find(
      p => p.name === productChangeSub.productName && p.brand === productChangeSub.productBrand
    );

    if (matchedProduct) {
      console.log('✅ Found matching product:', matchedProduct.slug);
      return matchedProduct.slug;
    } else {
      console.log('❌ No matching product found, using first product');
      return categoryProductsData.products[0]?.slug || null;
    }
  }, [productChangeSub, categoryProductsData]);

  return (
    <div className="px-6 py-6">
      {itemCount > 0 && <FloatingCartIcon />}
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-1 -ml-1 text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">My Subscriptions</h1>
      </div>

      {/* Overview Strip */}
      {activeSubs.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 mb-5 flex items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">
            {activeSubs.length} {activeSubs.length === 1 ? "item" : "items"}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-primary font-semibold">Saving an extra {formatPrice(totalSavings)}</span>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading...</p>
      ) : activeSubs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No active subscriptions</p>
      ) : (
        <>
          {/* Individual Subscription Cards */}
          <div className="divide-y divide-border">
            {activeSubs.map((sub) => {
            const qty = sub.quantity;
            const displayVariant = sub.variantAttributes.map((a) => a.value).join(" · ");

            return (
              <div key={sub.id} className="py-4">
                <div className="flex gap-3">
                  {/* Product image */}
                  <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                    {sub.imageUrl ? (
                      <img
                        src={CloudinaryPresets.card(sub.imageUrl)}
                        alt={`${sub.productBrand} ${sub.productName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Row 1: Name + Next date badge */}
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {sub.productBrand} {sub.productName}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`${getDateBadgeClass(sub.nextRenewalDate)} text-[10px] px-2 py-0 flex-shrink-0 ml-2`}
                      >
                        Next: {formatNextDelivery(sub.nextRenewalDate)}
                      </Badge>
                    </div>

                    {/* Row 2: Variant + Qty */}
                    <p className="text-xs text-muted-foreground mb-1">
                      {[displayVariant, `Qty: ${qty}`].filter(Boolean).join(" · ")}
                    </p>

                    {/* Row 3: Frequency */}
                    <p className="text-xs text-muted-foreground mb-1">
                      Every {sub.frequencyWeeks} week{sub.frequencyWeeks !== 1 ? "s" : ""}
                    </p>

                    {/* Row 4: Pricing */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold text-foreground">
                        {formatPrice((sub.subscriptionPrice || sub.unitPrice) * sub.quantity)}
                      </span>
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(sub.regularPrice * sub.quantity)}
                      </span>
                    </div>

                    {/* CTAs */}
                    {sub.status === "active" && (
                      <div className="flex gap-2 w-full">
                        {isSubscriptionInCart(sub.id) ? (
                          <Button className="flex-1 h-9 text-xs rounded-lg gap-1.5" disabled>
                            <Check className="w-3.5 h-3.5" />
                            Added to Cart
                          </Button>
                        ) : (
                          <Button
                            className="flex-1 h-9 text-xs rounded-lg gap-1.5"
                            onClick={() => handleAddToCart(sub)}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Order Now
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="flex-1 h-9 text-xs rounded-lg"
                          onClick={() => setManageSub(sub)}
                        >
                          Make Changes
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}

      {/* Manage Subscription Drawer */}
      <ManageSubscriptionDrawer
        open={!!manageSub}
        onOpenChange={(open) => !open && setManageSub(null)}
        subscription={manageSub}
        onChangeFrequency={() => {
          if (manageSub) {
            setFrequencySub(manageSub);
            setPendingFrequency(manageSub.frequencyWeeks);
          }
          setManageSub(null);
        }}
        onMoveDate={() => {
          if (manageSub) setMoveDateSub(manageSub);
          setManageSub(null);
        }}
        onChangeQuantity={() => {
          if (manageSub) {
            setQuantitySub(manageSub);
            setPendingQuantity(manageSub.quantity);
          }
          setManageSub(null);
        }}
        onCancel={() => {
          if (manageSub) setCancelSub(manageSub);
          setManageSub(null);
        }}
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

      {/* Cancel Subscription Drawer */}
      <CancelSubscriptionDrawer
        open={!!cancelSub}
        onOpenChange={(open) => !open && setCancelSub(null)}
        productName={cancelSub ? `${cancelSub.productBrand} ${cancelSub.productName}` : ""}
        onConfirm={handleCancelConfirm}
        onChangeFrequency={() => {
          setCancelSub(null);
          if (cancelSub) {
            setFrequencySub(cancelSub);
            setPendingFrequency(cancelSub.frequencyWeeks);
          }
        }}
        onMoveDate={() => {
          setCancelSub(null);
          if (cancelSub) setMoveDateSub(cancelSub);
        }}
      />

      {/* Frequency Confirm Drawer */}
      {(() => {
        const sub = pendingFreqChange
          ? subs.find((s) => s.id === pendingFreqChange.subId)
          : null;
        const newNext = sub && pendingFreqChange ? computeNewNextDate(sub, pendingFreqChange.newFreq) : new Date();
        const isImmediate = newNext < new Date();
        const formatDateShort = (d: Date) =>
          d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

        return (
          <FrequencyConfirmDrawer
            open={freqConfirmOpen}
            onOpenChange={(open) => {
              setFreqConfirmOpen(open);
              // Don't clear pendingFreqChange here - user might be opening start date drawer
              // Only clear on successful completion or explicit cancellation
            }}
            currentFrequency={pendingFreqChange?.currentFreq ?? 4}
            newFrequency={pendingFreqChange?.newFreq ?? 4}
            newNextDate={formatDateShort(newNext)}
            isImmediate={isImmediate}
            onConfirm={handleFrequencyConfirm}
            onPlaceOrderNow={() => {
              if (sub && pendingFreqChange) {
                navigate(
                  `/subscriptions/reorder?subId=${sub.id}&switchContext=weekly&newFreq=${pendingFreqChange.newFreq}`
                );
              }
            }}
            onChooseStartDate={() => {
              setFreqConfirmOpen(false);
              setFreqStartDateOpen(true);
            }}
          />
        );
      })()}

      {/* Frequency Start Date Drawer */}
      <FrequencyStartDateDrawer
        open={freqStartDateOpen}
        onOpenChange={(open) => {
          setFreqStartDateOpen(open);
          // Only clear pendingFreqChange if user is explicitly closing/canceling
          // Don't clear on confirm - that's handled in the mutation onSuccess
          if (!open && !freqMutation.isPending) {
            setPendingFreqChange(null);
          }
        }}
        newFrequency={pendingFreqChange?.newFreq ?? 4}
        onConfirm={handleFrequencyStartDateConfirm}
      />

      {/* Quantity Change Drawer */}
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

              {/* Price Preview */}
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
                {pendingQuantity !== quantitySub.quantity && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                    <span className="text-muted-foreground">Change:</span>
                    <span className={pendingQuantity > quantitySub.quantity ? "text-orange-600" : "text-green-600"}>
                      {pendingQuantity > quantitySub.quantity ? "+" : ""}
                      {formatPrice(((quantitySub.subscriptionPrice || quantitySub.unitPrice) * (pendingQuantity - quantitySub.quantity)))}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <Button variant="outline" onClick={() => setQuantitySub(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="shop"
                className="flex-1"
                onClick={() => {
                  changeQuantityMutation.mutate({ id: quantitySub.id, quantity: pendingQuantity });
                }}
              >
                Save
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Product Change - List products from category */}
      {productChangeSub && productSlugForChange && (
        <ProductDetailDrawer
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setProductChangeSub(null);
              setProductDrawerOpen(false);
              setSelectedProductSlug(null);
            }
          }}
          productSlug={productSlugForChange}
          mode="select"
          preferSubscriptionPrice={true}
          initialVariantId={productChangeSub.variantId}
          initialQuantity={productChangeSub.quantity}
          onSelect={(variant: any, quantity: number) => {
            if (productChangeSub) {
              variantChangeMutation.mutate({
                subId: productChangeSub.id,
                variantId: variant.id,
                quantity: quantity,
              });
            }
          }}
        />
      )}

      {/* Change Frequency Drawer */}
      {frequencySub && (
        <Drawer open={!!frequencySub} onOpenChange={() => { setFrequencySub(null); setPendingFrequency(null); }}>
          <DrawerContent className="px-6 pb-8">
            <DrawerHeader className="px-0 pt-4 pb-2">
              <DrawerTitle className="text-base font-semibold">Change Frequency</DrawerTitle>
              <DrawerDescription className="text-sm text-muted-foreground">
                {frequencySub.productBrand} {frequencySub.productName}
              </DrawerDescription>
            </DrawerHeader>

            <div className="space-y-4">
              {/* Inline frequency selector grid - NO "Current:" text */}
              <div className="grid grid-cols-4 gap-2">
                {FREQUENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.weeks}
                    onClick={() => setPendingFrequency(opt.weeks)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                      pendingFrequency === opt.weeks ? "border-primary bg-primary/10" : "border-border bg-background"
                    )}
                  >
                    <span className={cn("text-sm font-bold", pendingFrequency === opt.weeks ? "text-primary" : "text-muted-foreground")}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
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
    </div>
  );
}
