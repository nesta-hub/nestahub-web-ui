import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Pause, Play, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  getMySubscriptions,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  updateSubscriptionFrequency,
  updateSubscriptionVariant,
  formatPrice,
  MySubscription,
  ProductCard as APIProductCard,
} from "@/lib/api";
import { ProductCard } from "@/components/catalogue/ProductCard";
import { ProductDetailDrawer } from "@/components/catalogue/ProductDetailDrawer";
import { CloudinaryPresets } from "@/lib/cloudinary";

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700 border-green-200" },
  paused: { label: "Paused", className: "bg-amber-100 text-amber-700 border-amber-200" },
};

const FREQUENCY_OPTIONS = [
  { weeks: 1, label: "1 week" },
  { weeks: 2, label: "2 weeks" },
  { weeks: 3, label: "3 weeks" },
  { weeks: 4, label: "4 weeks" },
  { weeks: 5, label: "5 weeks" },
  { weeks: 6, label: "6 weeks" },
  { weeks: 7, label: "7 weeks" },
  { weeks: 8, label: "8 weeks" },
];

interface SubscriptionsViewProps {
  onBack: () => void;
}

export function SubscriptionsView({ onBack }: SubscriptionsViewProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const token = session?.access_token ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["my-subscriptions"],
    queryFn: () => getMySubscriptions(token),
    enabled: !!token,
  });

  const subs = data?.subscriptions ?? [];

  // Edit mode
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"product" | "frequency" | null>(null);

  // Pending changes within edit mode
  const [pendingFrequency, setPendingFrequency] = useState<number | null>(null);
  const [pendingProduct, setPendingProduct] = useState<{
    variantId: string;
    displayName: string; // "Brand ProductName"
    displayVariant: string; // "Jumbo · Size 3"
  } | null>(null);

  // Confirmation dialog
  const [confirmAction, setConfirmAction] = useState<{
    type: "pause" | "resume" | "delete";
    subId: string;
  } | null>(null);

  // Product select drawer
  const [drawerProductSlug, setDrawerProductSlug] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Category products for the product carousel (fetched lazily)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const { data: categoryProductsData } = useQuery({
    queryKey: ["category-products", activeCategoryId],
    queryFn: () => api.getProducts({ category: activeCategoryId!, limit: 20 }),
    enabled: !!activeCategoryId,
  });

  // Frequency carousel scroll ref
  const freqScrollRef = useRef<HTMLDivElement>(null);

  // When entering edit mode, reset pending changes and load category products
  const startEdit = (sub: MySubscription) => {
    setEditingSubId(sub.id);
    setEditingField(null);
    setPendingFrequency(null);
    setPendingProduct(null);
    setActiveCategoryId(sub.categoryId);
  };

  // Scroll frequency carousel to current value
  useEffect(() => {
    if (editingField === "frequency" && freqScrollRef.current && editingSubId) {
      const sub = subs.find((s) => s.id === editingSubId);
      const currentWeeks = pendingFrequency ?? sub?.frequencyWeeks ?? 1;
      const idx = FREQUENCY_OPTIONS.findIndex((o) => o.weeks === currentWeeks);
      if (idx > 0) {
        const card = freqScrollRef.current.children[idx] as HTMLElement;
        if (card) {
          card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }
    }
  }, [editingField, editingSubId]);

  // Mutations
  const pauseMutation = useMutation({
    mutationFn: (subId: string) => pauseSubscription(subId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (subId: string) => resumeSubscription(subId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (subId: string) => cancelSubscription(subId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
    },
  });

  const freqMutation = useMutation({
    mutationFn: ({ subId, frequencyWeeks }: { subId: string; frequencyWeeks: number }) =>
      updateSubscriptionFrequency(subId, frequencyWeeks, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
    },
  });

  const variantMutation = useMutation({
    mutationFn: ({ subId, variantId }: { subId: string; variantId: string }) =>
      updateSubscriptionVariant(subId, variantId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] });
    },
  });

  const handleDone = async () => {
    if (!editingSubId) return;

    if (pendingFrequency !== null) {
      await freqMutation.mutateAsync({ subId: editingSubId, frequencyWeeks: pendingFrequency });
    }
    if (pendingProduct) {
      await variantMutation.mutateAsync({
        subId: editingSubId,
        variantId: pendingProduct.variantId,
      });
    }

    setEditingSubId(null);
    setEditingField(null);
    setPendingFrequency(null);
    setPendingProduct(null);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const { type, subId } = confirmAction;
    if (type === "delete") {
      cancelMutation.mutate(subId);
    } else if (type === "pause") {
      pauseMutation.mutate(subId);
    } else {
      resumeMutation.mutate(subId);
    }
    setConfirmAction(null);
  };

  const handleCarouselProductClick = (product: APIProductCard) => {
    setDrawerProductSlug(product.slug);
    setDrawerOpen(true);
  };

  // onSelect from ProductDetailDrawer in 'select' mode: (enrichedVariant, quantity)
  // enrichedVariant has .id, .attributes[], .product.{name, brand}
  const handleDrawerSelect = (enrichedVariant: any, _quantity: number) => {
    const displayName = `${enrichedVariant.product?.brand ?? ""} ${enrichedVariant.product?.name ?? ""}`.trim();
    const displayVariant = (enrichedVariant.attributes ?? [])
      .map((a: any) => a.displayValue || a.value)
      .join(" · ");
    setPendingProduct({
      variantId: enrichedVariant.id,
      displayName,
      displayVariant,
    });
    setEditingField(null);
  };

  // Helper to get display values for a sub (accounting for pending changes)
  const getDisplayValues = (sub: MySubscription) => {
    const isEditing = editingSubId === sub.id;
    if (isEditing && pendingProduct) {
      return {
        name: pendingProduct.displayName,
        variant: pendingProduct.displayVariant,
        frequency: pendingFrequency ?? sub.frequencyWeeks,
      };
    }
    return {
      name: `${sub.productBrand} ${sub.productName}`,
      variant: sub.variantAttributes.map((a) => a.value).join(" · "),
      frequency: isEditing && pendingFrequency !== null ? pendingFrequency : sub.frequencyWeeks,
    };
  };

  const formatNextDelivery = (date: string | null): string => {
    if (!date) return "Paused";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const confirmMessages: Record<string, { title: string; description: string }> = {
    pause: {
      title: "Pause Subscription",
      description: "Are you sure you want to pause this subscription?",
    },
    resume: {
      title: "Resume Subscription",
      description: "Are you sure you want to resume this subscription?",
    },
    delete: {
      title: "Cancel Subscription",
      description: "Are you sure you want to cancel this subscription? This cannot be undone.",
    },
  };

  const categoryProducts = categoryProductsData?.products ?? [];

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
        <div className="divide-y divide-border">
          {subs.map((sub) => {
            const config = statusConfig[sub.status] ?? {
              label: sub.status,
              className: "bg-secondary text-muted-foreground border-border",
            };
            const isEditing = editingSubId === sub.id;
            const display = getDisplayValues(sub);

            return (
              <div key={sub.id} className="py-4">
                {isEditing ? (
                  /* ──── Edit Mode ──── */
                  <div className="space-y-3 animate-fade-in">
                    {/* Product row */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-muted-foreground">Product</span>
                          <p className="text-sm font-medium text-foreground truncate">
                            {display.name}, {display.variant}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setEditingField(editingField === "product" ? null : "product")
                          }
                          className="text-xs font-medium text-primary ml-3 shrink-0"
                        >
                          {editingField === "product" ? "Cancel" : "Change"}
                        </button>
                      </div>

                      {/* Product carousel */}
                      {editingField === "product" && (
                        <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide pb-2 snap-x animate-fade-in">
                          {categoryProducts.map((p) => (
                            <ProductCard
                              key={p.id}
                              product={p}
                              onClick={() => handleCarouselProductClick(p)}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Frequency row */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-muted-foreground">
                            Frequency
                          </span>
                          <p className="text-sm font-medium text-foreground">
                            Every {display.frequency} week
                            {display.frequency !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setEditingField(editingField === "frequency" ? null : "frequency")
                          }
                          className="text-xs font-medium text-primary ml-3 shrink-0"
                        >
                          {editingField === "frequency" ? "Cancel" : "Change"}
                        </button>
                      </div>

                      {/* Frequency carousel */}
                      {editingField === "frequency" && (
                        <div
                          ref={freqScrollRef}
                          className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-6 px-6"
                        >
                          {FREQUENCY_OPTIONS.map((opt) => {
                            const currentFreq = display.frequency;
                            const isSelected = opt.weeks === currentFreq;
                            return (
                              <button
                                key={opt.weeks}
                                onClick={() => {
                                  setPendingFrequency(opt.weeks);
                                  setEditingField(null);
                                }}
                                className={cn(
                                  "flex flex-col items-center justify-center min-w-[76px] p-3 rounded-xl border-2 transition-all shrink-0",
                                  isSelected
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-background"
                                )}
                              >
                                <RefreshCw
                                  className={cn(
                                    "w-4 h-4 mb-1",
                                    isSelected ? "text-primary" : "text-muted-foreground"
                                  )}
                                />
                                <span
                                  className={cn(
                                    "text-xs font-bold",
                                    isSelected ? "text-primary" : "text-muted-foreground"
                                  )}
                                >
                                  {opt.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Done + Cancel buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs flex-1"
                        onClick={() => {
                          setEditingSubId(null);
                          setEditingField(null);
                          setPendingFrequency(null);
                          setPendingProduct(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs flex-1"
                        onClick={handleDone}
                        disabled={freqMutation.isPending || variantMutation.isPending}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ──── Normal Mode ──── */
                  <div className="flex gap-3">
                    {/* Product image */}
                    <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                      {sub.imageUrl ? (
                        <img
                          src={CloudinaryPresets.card(sub.imageUrl)}
                          alt={display.name}
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
                        <p className="text-sm font-medium text-foreground truncate">
                          {display.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0 flex-shrink-0 ml-2 ${config.className}`}
                        >
                          {config.label}
                        </Badge>
                      </div>

                      {/* Row 2: Variant */}
                      {display.variant && (
                        <p className="text-xs text-muted-foreground mb-2">{display.variant}</p>
                      )}

                      {/* Row 3: Frequency + Next */}
                      <div className="flex items-center gap-2 mb-1 text-xs">
                        <span className="text-muted-foreground">
                          Every {display.frequency} week{display.frequency !== 1 ? "s" : ""}
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

                      {/* Row 5: Action buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5 flex-1"
                          onClick={() =>
                            setConfirmAction({
                              type: sub.status === "active" ? "pause" : "resume",
                              subId: sub.id,
                            })
                          }
                        >
                          {sub.status === "active" ? (
                            <>
                              <Pause className="w-3.5 h-3.5" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" /> Resume
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5 flex-1"
                          onClick={() => startEdit(sub)}
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() =>
                            setConfirmAction({ type: "delete", subId: sub.id })
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Product select drawer */}
      <ProductDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        productSlug={drawerProductSlug}
        mode="select"
        preferSubscriptionPrice={true}
        onSelect={handleDrawerSelect}
      />

      {/* Confirmation drawer */}
      <Drawer open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {confirmAction ? confirmMessages[confirmAction.type].title : ""}
            </DrawerTitle>
            <DrawerDescription>
              {confirmAction ? confirmMessages[confirmAction.type].description : ""}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button
              onClick={handleConfirmAction}
              disabled={
                pauseMutation.isPending ||
                resumeMutation.isPending ||
                cancelMutation.isPending
              }
            >
              Confirm
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
