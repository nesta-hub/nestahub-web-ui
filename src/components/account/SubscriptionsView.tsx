import { useState, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  getMySubscriptions,
  updateSubscriptionFrequency,
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

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700 border-green-200" },
  paused: { label: "Paused", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

interface SubscriptionsViewProps {
  onBack: () => void;
}

export function SubscriptionsView({ onBack }: SubscriptionsViewProps) {
  const { session } = useAuth();
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

  // Group subscriptions by nextRenewalDate (only active subs within 7 days)
  const consolidatedGroups = useMemo(() => {
    const groups = new Map<string, MySubscription[]>();

    sortedSubs.forEach(sub => {
      if (sub.status !== 'active' || !sub.nextRenewalDate) return;

      // Use date-only key (YYYY-MM-DD) for grouping
      const dateKey = new Date(sub.nextRenewalDate).toISOString().split('T')[0];
      const existing = groups.get(dateKey) || [];
      groups.set(dateKey, [...existing, sub]);
    });

    // Filter to only show groups with 2+ subscriptions within 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);

    return Array.from(groups.entries())
      .filter(([dateKey, groupSubs]) => {
        const renewalDate = new Date(dateKey);
        renewalDate.setHours(0, 0, 0, 0);
        return groupSubs.length >= 2 && renewalDate <= in7Days;
      })
      .map(([dateKey, groupSubs]) => ({
        renewalDate: dateKey,
        subscriptions: groupSubs,
        totalPrice: groupSubs.reduce((sum, s) => sum + (s.unitPrice * s.quantity), 0),
        totalSavings: groupSubs.reduce((sum, s) => sum + ((s.regularPrice - s.unitPrice) * s.quantity), 0),
      }));
  }, [sortedSubs]);

  // Drawer states
  const [manageSub, setManageSub] = useState<MySubscription | null>(null);
  const [moveDateSub, setMoveDateSub] = useState<MySubscription | null>(null);
  const [skipCycleSub, setSkipCycleSub] = useState<MySubscription | null>(null);
  const [cancelSub, setCancelSub] = useState<MySubscription | null>(null);
  const [freqConfirmOpen, setFreqConfirmOpen] = useState(false);
  const [freqStartDateOpen, setFreqStartDateOpen] = useState(false);

  // Product change states
  const [productChangeSub, setProductChangeSub] = useState<MySubscription | null>(null);
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);

  // Frequency select drawer states
  const [freqSelectSub, setFreqSelectSub] = useState<MySubscription | null>(null);
  const [freqSelectOpen, setFreqSelectOpen] = useState(false);

  // Pending frequency change (for confirmation flow)
  const [pendingFreqChange, setPendingFreqChange] = useState<{
    subId: string;
    currentFreq: number;
    newFreq: number;
  } | null>(null);

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
    }: {
      subId: string;
      newDate: Date;
      resetSchedule: boolean;
    }) => moveSubscriptionNextDate(subId, newDate.toISOString(), resetSchedule, token),
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
  const handleMoveDateConfirm = (newDate: Date) => {
    if (!moveDateSub) return;
    const formatted = newDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    moveNextDateMutation.mutate({
      subId: moveDateSub.id,
      newDate,
      resetSchedule: true, // Always reset - it's what actually happens
    });
    toast.success("Order date updated", {
      description: `Next order: ${formatted}. Future orders will be every ${moveDateSub.frequencyWeeks} week${moveDateSub.frequencyWeeks !== 1 ? "s" : ""} from this date.`,
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-1 -ml-1 text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">
          My Subscriptions ({subs.length} {subs.length === 1 ? "item" : "items"})
        </h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading...</p>
      ) : subs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No active subscriptions</p>
      ) : (
        <>
          {/* Consolidated Order Banners */}
          {consolidatedGroups.map(group => {
            const renewalDate = new Date(group.renewalDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            renewalDate.setHours(0, 0, 0, 0);

            const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const dateLabel = daysUntil === 0
              ? 'today'
              : daysUntil === 1
              ? 'tomorrow'
              : `on ${renewalDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

            return (
              <div key={group.renewalDate} className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-semibold text-foreground mb-3">
                  {group.subscriptions.length} items due {dateLabel}
                </p>

                <div className="flex flex-wrap gap-x-2 gap-y-1 mb-3">
                  {group.subscriptions.map(sub => (
                    <span key={sub.id} className="text-xs text-muted-foreground">
                      {sub.productBrand} {sub.productName} · Qty: {sub.quantity}
                    </span>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full h-9 text-xs"
                  onClick={() => {
                    const subIds = group.subscriptions.map(s => s.id).join(',');
                    navigate(`/subscriptions/reorder?subIds=${subIds}`);
                  }}
                >
                  Order {group.subscriptions.length} items now
                </Button>
              </div>
            );
          })}

          {/* Individual Subscription Cards */}
          <div className="divide-y divide-border">
            {sortedSubs.map((sub) => {
            const config = statusConfig[sub.status] ?? {
              label: sub.status,
              className: "bg-secondary text-muted-foreground border-border",
            };
            const displayName = `${sub.productBrand} ${sub.productName}`;
            const displayVariant = sub.variantAttributes.map((a) => a.value).join(" · ");

            return (
              <div key={sub.id} className="py-4">
                <div className="flex gap-3">
                  {/* Product image */}
                  <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                    {sub.imageUrl ? (
                      <img
                        src={CloudinaryPresets.card(sub.imageUrl)}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Row 1: Name + status */}
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-2 py-0 flex-shrink-0 ml-2", config.className)}
                      >
                        {config.label}
                      </Badge>
                    </div>

                    {/* Row 2: Variant + Quantity */}
                    {displayVariant && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {displayVariant} · Qty: {sub.quantity}
                      </p>
                    )}

                    {/* Row 3: Frequency + Next */}
                    <div className="flex items-center gap-2 mb-1 text-xs">
                      <span className="text-muted-foreground">
                        Every {sub.frequencyWeeks} week{sub.frequencyWeeks !== 1 ? "s" : ""}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary text-[10px] px-2 py-0"
                      >
                        Next: {formatNextDelivery(sub.nextRenewalDate)}
                      </Badge>
                    </div>

                    {/* Row 4: Price */}
                    <p className="text-xs font-semibold text-foreground mb-3">
                      {formatPrice(sub.unitPrice * sub.quantity)}
                    </p>

                    {/* Side-by-side CTAs */}
                    {sub.status === "active" && (
                      <div className="flex gap-2 w-full">
                        <Button
                          className="flex-1 h-9 text-xs rounded-lg"
                          onClick={() => navigate(`/subscriptions/reorder?subId=${sub.id}`)}
                        >
                          Order Now
                        </Button>
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
        onChangeProduct={() => {
          if (manageSub) {
            setProductChangeSub(manageSub);
            // Note: Product drawer will open when categoryProductsData loads
          }
          setManageSub(null);
        }}
        onChangeFrequency={() => {
          if (manageSub) {
            setFreqSelectSub(manageSub);
            setFreqSelectOpen(true);
          }
          setManageSub(null);
        }}
        onMoveDate={() => {
          if (manageSub) setMoveDateSub(manageSub);
          setManageSub(null);
        }}
        onSkipCycle={() => {
          if (manageSub) setSkipCycleSub(manageSub);
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
        lastMoved={moveDateSub?.lastMoved ?? false}
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
        onSkipInstead={() => {
          setCancelSub(null);
          if (cancelSub) setSkipCycleSub(cancelSub);
        }}
        onChangeFrequency={() => {
          setCancelSub(null);
          if (cancelSub) {
            const newFreq = prompt(
              `Current frequency: Every ${cancelSub.frequencyWeeks} week(s)\n\nEnter new frequency (1-8 weeks):`,
              cancelSub.frequencyWeeks.toString()
            );
            if (newFreq && !isNaN(parseInt(newFreq))) {
              const freq = parseInt(newFreq);
              if (freq >= 1 && freq <= 8) {
                handleChangeFrequency(cancelSub, freq);
              }
            }
          }
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

      {/* Frequency Select Drawer */}
      <FrequencySelectDrawer
        open={freqSelectOpen}
        onOpenChange={(open) => {
          setFreqSelectOpen(open);
          if (!open) setFreqSelectSub(null);
        }}
        currentFrequency={freqSelectSub?.frequencyWeeks ?? 4}
        productName={freqSelectSub ? `${freqSelectSub.productBrand} ${freqSelectSub.productName}` : ""}
        onConfirm={(newFrequency) => {
          if (freqSelectSub) {
            handleChangeFrequency(freqSelectSub, newFrequency);
          }
        }}
      />
    </div>
  );
}
