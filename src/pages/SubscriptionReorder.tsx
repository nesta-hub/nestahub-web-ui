import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { SignInForm } from "@/components/auth/SignInForm";
import { CheckoutDeliverySection } from "@/components/checkout/CheckoutDeliverySection";
import { CheckoutPickupSection } from "@/components/checkout/CheckoutPickupSection";
import { CheckoutAddressSection, getDeliveryFee, isZone1Or2Address } from "@/components/checkout/CheckoutAddressSection";
import { CheckoutDeliverySpeedSection } from "@/components/checkout/CheckoutDeliverySpeedSection";
import { CheckoutPaymentView } from "@/components/checkout/CheckoutPaymentView";
import { useQuery } from "@tanstack/react-query";
import { getMySubscriptions, formatPrice, getPickupStations, reorderSubscription, reorderMultipleSubscriptions } from "@/lib/api";
import { CloudinaryPresets } from "@/lib/cloudinary";
import type { PickupStation } from "@/lib/api";
import { toast } from "sonner";

type DeliveryMethod = "pickup" | "address";
type DeliverySpeed = "standard" | "weekend";
type Step = "confirm" | "payment" | "success";

const SubscriptionReorder = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const token = session?.access_token ?? "";
  const [searchParams] = useSearchParams();
  const subId = searchParams.get("subId");
  const subIdsParam = searchParams.get("subIds");

  // Parse multiple subscription IDs or single subscription ID
  const subscriptionIds = useMemo(() => {
    if (subIdsParam) return subIdsParam.split(',');
    if (subId) return [subId];
    return [];
  }, [subIdsParam, subId]);

  const { data: subsData, isLoading: subsLoading } = useQuery({
    queryKey: ["my-subscriptions"],
    queryFn: () => getMySubscriptions(token),
    enabled: !!token && subscriptionIds.length > 0,
  });

  // Fetch all matching subscriptions
  const selectedSubs = useMemo(() => {
    if (!subsData) return [];
    return subsData.subscriptions.filter(s => subscriptionIds.includes(s.id));
  }, [subsData, subscriptionIds]);

  const isMultipleOrder = selectedSubs.length > 1;

  // Fetch pickup stations
  const { data: pickupStationsData } = useQuery({
    queryKey: ["pickup-stations"],
    queryFn: () => getPickupStations(),
  });

  const [step, setStep] = useState<Step>("confirm");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<PickupStation | null>(null);
  const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeed | null>(null);
  const [addressLat, setAddressLat] = useState<number | null>(null);
  const [addressLng, setAddressLng] = useState<number | null>(null);
  const [addressDeliveryFee, setAddressDeliveryFee] = useState<number | null>(null);
  const [isZone1Or2, setIsZone1Or2] = useState<boolean>(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Track if we've initialized state from subscription data
  const hasInitialized = useRef(false);

  // Auto-populate delivery info from most recent order across all subscriptions
  useEffect(() => {
    console.log('🔄 [SubscriptionReorder useEffect] Running with:', {
      hasSelectedSubs: selectedSubs.length > 0,
      subCount: selectedSubs.length,
      hasPickupStations: !!pickupStationsData,
      pickupStationsCount: pickupStationsData?.length || 0,
      hasInitialized: hasInitialized.current,
    });

    // Only run once when both subscriptions and pickup stations data are available
    if (selectedSubs.length > 0 && pickupStationsData && !hasInitialized.current) {
      console.log('✅ [SubscriptionReorder] Conditions met! Initializing state...');
      hasInitialized.current = true;

      // Find most recent delivery info across all subscriptions
      // Use the first subscription's last delivery info (they should all be similar for grouped orders)
      const recentSub = selectedSubs[0];

      if (recentSub.lastDeliveryMethod) {
        console.log('🚚 [SubscriptionReorder] Setting deliveryMethod:', recentSub.lastDeliveryMethod);
        setDeliveryMethod(recentSub.lastDeliveryMethod as DeliveryMethod);
      }

      if (recentSub.lastDeliveryAddress) {
        console.log('📍 [SubscriptionReorder] Setting selectedAddress:', recentSub.lastDeliveryAddress);
        setSelectedAddress(recentSub.lastDeliveryAddress);
      }

      // Auto-populate delivery speed if user used address delivery last time
      if (recentSub.lastDeliverySpeed) {
        console.log('⚡ [SubscriptionReorder] Setting deliverySpeed:', recentSub.lastDeliverySpeed);
        setDeliverySpeed(recentSub.lastDeliverySpeed as DeliverySpeed);
      }

      // Auto-populate coordinates and calculate delivery fee
      if (recentSub.lastDeliveryLat != null && recentSub.lastDeliveryLng != null) {
        console.log('🌍 [SubscriptionReorder] Setting coordinates:', recentSub.lastDeliveryLat, recentSub.lastDeliveryLng);
        setAddressLat(recentSub.lastDeliveryLat);
        setAddressLng(recentSub.lastDeliveryLng);

        // Calculate delivery fee from coordinates
        const fee = getDeliveryFee(recentSub.lastDeliveryLat, recentSub.lastDeliveryLng);
        if (fee !== 'unsupported') {
          console.log('💰 [SubscriptionReorder] Calculated delivery fee:', fee);
          setAddressDeliveryFee(fee);
        }

        // Determine if address is in Zone 1 or 2 for weekend delivery eligibility
        const zone1Or2 = isZone1Or2Address(recentSub.lastDeliveryLat, recentSub.lastDeliveryLng);
        console.log('📍 [SubscriptionReorder] Is Zone 1 or 2:', zone1Or2);
        setIsZone1Or2(zone1Or2);
      }

      if (recentSub.lastPickupStationId && pickupStationsData.length > 0) {
        console.log('🔍 [SubscriptionReorder] Looking for pickup station:', recentSub.lastPickupStationId);
        const station = pickupStationsData.find((s) => s.id === recentSub.lastPickupStationId);
        if (station) {
          console.log('✅ [SubscriptionReorder] Found station:', station.name);
          setSelectedStation(station);
        } else {
          console.log('❌ [SubscriptionReorder] Station not found in list!');
        }
      }
    } else {
      console.log('❌ [SubscriptionReorder] Conditions NOT met - skipping initialization');
    }
  }, [selectedSubs, pickupStationsData]);

  // Handle order creation before payment
  const handleProceedToPayment = async () => {
    if (subscriptionIds.length === 0 || !deliveryMethod) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = isMultipleOrder
        ? await reorderMultipleSubscriptions(
            subscriptionIds,
            deliveryMethod,
            {
              deliveryAddress: selectedAddress || undefined,
              deliverySpeed: deliverySpeed || undefined,
              deliveryLat: addressLat ?? undefined,
              deliveryLng: addressLng ?? undefined,
              pickupStationId: selectedStation?.id,
            },
            undefined, // No payment ref yet - order created before payment
            token
          )
        : await reorderSubscription(
            subscriptionIds[0],
            deliveryMethod,
            {
              deliveryAddress: selectedAddress || undefined,
              deliverySpeed: deliverySpeed || undefined,
              deliveryLat: addressLat ?? undefined,
              deliveryLng: addressLng ?? undefined,
              pickupStationId: selectedStation?.id,
            },
            undefined, // No payment ref yet - order created before payment
            token
          );

      setOrderNumber(result.orderId);
      setStep("payment");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create order. Please try again.');
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || subsLoading) {
    return (
      <Layout showNav={false}>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout showNav={false}>
        <SignInForm
          title="Sign in to reorder"
          description="Sign in to place your subscription order"
          containerClassName="flex-1 flex flex-col items-center justify-center px-6 py-16"
        />
      </Layout>
    );
  }

  if (selectedSubs.length === 0) {
    return (
      <Layout showNav={false}>
        <div className="px-6 py-12 text-center">
          <p className="text-muted-foreground">Subscription{isMultipleOrder ? 's' : ''} not found.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/subscriptions")}
          >
            Back to Subscriptions
          </Button>
        </div>
      </Layout>
    );
  }

  // Calculate combined product total for all subscriptions
  const productTotal = selectedSubs.reduce((sum, s) => sum + (s.unitPrice * s.quantity), 0);

  // Calculate delivery fee based on method and speed
  const deliveryFee = (() => {
    if (deliveryMethod === 'pickup') return 0;
    if (deliveryMethod === 'address' && deliverySpeed) {
      if (deliverySpeed === 'standard') {
        return addressDeliveryFee ?? 0;
      }
      // Weekend delivery: ₦500 for all zones
      if (deliverySpeed === 'weekend') {
        return 50000; // ₦500 in kobo
      }
    }
    return 0;
  })();

  const orderTotal = productTotal + deliveryFee;

  const canProceed =
    deliveryMethod === "pickup"
      ? !!selectedStation
      : deliveryMethod === "address"
      ? !!selectedAddress && !!deliverySpeed
      : false;

  // Payment step
  if (step === "payment" && orderNumber) {
    return (
      <Layout showNav={false}>
        <CheckoutPaymentView
          orderId={orderNumber}
          totalAmount={orderTotal}
          token={token}
          onPaymentConfirmed={(paymentRef?: string) => {
            // Payment completed, proceed to success
            setStep("success");
          }}
          onBack={() => setStep("confirm")}
          hideGiftCardRedeem={true}
        />
      </Layout>
    );
  }

  // Success step
  if (step === "success" && orderNumber) {
    const newFreqParam = searchParams.get("newFreq");
    const effectiveFrequency = newFreqParam ? parseInt(newFreqParam, 10) : selectedSubs[0].frequencyWeeks;

    // Calculate the future renewal date from the current subscription's nextRenewalDate
    const currentRenewalDate = new Date(selectedSubs[0].nextRenewalDate);
    const nextDate = new Date(currentRenewalDate);
    nextDate.setDate(currentRenewalDate.getDate() + effectiveFrequency * 7);

    const nextFormatted = nextDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-fade-in">
          {/* Success icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Order Placed!
          </h1>

          {/* Order ID */}
          <p className="text-muted-foreground mb-6">
            Order ID: <span className="font-semibold text-foreground">{orderNumber}</span>
          </p>

          {/* Confirmation message */}
          <Card className="w-full p-4 bg-muted/50 max-w-sm mb-4">
            <p className="text-sm text-muted-foreground">
              We'll verify your payment and send a confirmation via Email. Please keep your phone handy!
            </p>
          </Card>

          {/* Subscription details */}
          <Card className="w-full p-4 bg-emerald-50/50 border-emerald-200 max-w-sm">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Next reorder</span>
                <span className="font-medium text-foreground">{nextFormatted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frequency</span>
                <span className="font-medium text-foreground">
                  Every {effectiveFrequency} week{effectiveFrequency !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-background shrink-0">
          <Button
            variant="shop"
            className="w-full h-12 text-base font-semibold"
            onClick={() => navigate("/orders")}
          >
            View Order
          </Button>
        </div>
      </div>
    );
  }

  // Confirm step
  return (
    <Layout showNav={false}>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
          <button
            onClick={() => navigate("/subscriptions")}
            className="p-1 -ml-1 text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Confirm Order</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 animate-fade-in">
          {/* Switch context banner */}
          {searchParams.get("switchContext") === "weekly" && (
            <div className="flex items-center justify-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 animate-fade-in">
              <span className="text-sm font-medium">
                Switching to new frequency — here's your first order
              </span>
            </div>
          )}

          {/* Product cards */}
          {isMultipleOrder ? (
            <Card className="p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">
                {selectedSubs.length} Items in this order
              </p>
              <div className="space-y-3 divide-y divide-border">
                {selectedSubs.map((s) => {
                  const displayName = `${s.productBrand} ${s.productName}`;
                  const displayVariant = s.variantAttributes.map((a) => a.value).join(" · ");
                  const lineTotal = s.unitPrice * s.quantity;
                  const regularTotal = s.regularPrice * s.quantity;

                  return (
                    <div key={s.id} className="flex gap-3 pt-3 first:pt-0">
                      <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                        {s.imageUrl ? (
                          <img
                            src={CloudinaryPresets.card(s.imageUrl)}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{displayVariant} · Qty: {s.quantity}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-semibold text-foreground">
                            {formatPrice(lineTotal)}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(regularTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card className="p-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden shrink-0">
                  {selectedSubs[0].imageUrl ? (
                    <img
                      src={CloudinaryPresets.card(selectedSubs[0].imageUrl)}
                      alt={`${selectedSubs[0].productBrand} ${selectedSubs[0].productName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {selectedSubs[0].productBrand} {selectedSubs[0].productName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedSubs[0].variantAttributes.map((a) => a.value).join(" · ")}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-semibold text-foreground">
                      {formatPrice(orderTotal)}
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(selectedSubs[0].regularPrice * selectedSubs[0].quantity)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Delivery option */}
          <div className="space-y-1.5">
            <CheckoutDeliverySection
              selectedMethod={deliveryMethod}
              onSelectMethod={(method) => setDeliveryMethod(method)}
              onChangeMethod={() => {
                setDeliveryMethod(null);
                setSelectedAddress(null);
                setSelectedStation(null);
              }}
            />

            {deliveryMethod && selectedSubs[0].nextRenewalDate && (
              <p className="text-xs text-muted-foreground leading-relaxed px-1">
                {deliveryMethod === "pickup"
                  ? `Your order${isMultipleOrder ? 's' : ''} will be prepared on ${new Date(selectedSubs[0].nextRenewalDate).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "short", year: "numeric" }
                    )} and available for pickup immediately.`
                  : `Your order${isMultipleOrder ? 's' : ''} will be prepared on ${new Date(selectedSubs[0].nextRenewalDate).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "short", year: "numeric" }
                    )} and delivered the next day.`}
              </p>
            )}
          </div>

          {/* Pickup station or address selection */}
          {deliveryMethod === "pickup" && (
            <CheckoutPickupSection
              selectedStation={selectedStation}
              onSelectStation={setSelectedStation}
              onChangeStation={() => setSelectedStation(null)}
            />
          )}

          {deliveryMethod === "address" && (
            <>
              <CheckoutAddressSection
                selectedAddress={selectedAddress}
                deliveryFee={addressDeliveryFee}
                onSelectAddress={(address, fee, lat, lng) => {
                  setSelectedAddress(address);
                  setAddressDeliveryFee(fee);
                  setAddressLat(lat);
                  setAddressLng(lng);
                  setIsZone1Or2(isZone1Or2Address(lat, lng));
                }}
                onChangeAddress={() => {
                  setSelectedAddress(null);
                  setAddressDeliveryFee(null);
                  setAddressLat(null);
                  setAddressLng(null);
                  setDeliverySpeed(null);
                  setIsZone1Or2(false);
                }}
              />

              {/* Delivery Speed Selection - show after address is set */}
              {selectedAddress && (
                <div className="mt-6 animate-fade-in">
                  <CheckoutDeliverySpeedSection
                    selectedSpeed={deliverySpeed}
                    onSelectSpeed={setDeliverySpeed}
                    onChangeSpeed={() => setDeliverySpeed(null)}
                    address={selectedAddress}
                    standardDeliveryFee={addressDeliveryFee ?? 0}
                    isZone1Or2={isZone1Or2}
                  />
                </div>
              )}
            </>
          )}

        
        </div>

        {/* Sticky footer with price breakdown */}
        {canProceed && (
          <div className="p-4 border-t bg-background shrink-0 space-y-3">
            {/* Price Breakdown */}
            <div className="bg-primary/5 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Products</span>
                <span className="font-medium">{formatPrice(productTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium">
                  {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="border-t border-border/50 pt-2 flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">{formatPrice(orderTotal)}</span>
              </div>
            </div>

            {submitError && (
              <p className="text-sm text-destructive text-center">{submitError}</p>
            )}

            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleProceedToPayment}
              disabled={!canProceed || isSubmitting}
            >
              {isSubmitting ? 'Creating Order...' : 'Proceed to Payment'}
            </Button>
          </div>
        )}

        {!canProceed && (
          <div className="p-4 border-t bg-background shrink-0">
            {submitError && (
              <p className="text-sm text-destructive text-center mb-3">{submitError}</p>
            )}

            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleProceedToPayment}
              disabled={!canProceed || isSubmitting}
            >
              {isSubmitting ? 'Creating Order...' : `Confirm & Pay ${formatPrice(orderTotal)}`}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SubscriptionReorder;
