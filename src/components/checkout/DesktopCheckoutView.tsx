import { type ReactNode, useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { metaPixel } from "@/lib/metaPixel";
import { ArrowLeft, ShieldCheck, Clock, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice, DeliveryQuoteStaleError } from "@/lib/api";
import type { PickupStation } from "@/lib/api";
import { useDeliveryOptions } from "@/hooks/useDeliveryOptions";
import { describeOrderDelivery, type OrderDeliveryFacts, type OrderDeliveryFields } from "@/lib/delivery-choice";
import {
  CheckoutDeliverySection,
  CheckoutPickupSection,
  CheckoutAddressSection,
  CheckoutPaymentOptionSection,
  DeliveryOptionsSection,
  ContactForm,
  type PaymentOption,
} from "@/components/checkout";
import { SignInForm } from "@/components/auth/SignInForm";
import { DesktopCheckoutPaymentView } from "./DesktopCheckoutPaymentView";
import { DesktopCheckoutSuccessView } from "./DesktopCheckoutSuccessView";
import {
  PaymentCheckingView,
  PaymentOutcomeView,
} from "@/components/gifting/PaymentOutcomeView";
import { useOrderConfirmationPoll } from "@/hooks/useOrderConfirmationPoll";
import { resolveOutcomeCopy, type CtaAction } from "@/lib/giftOutcomeCopy";

type DeliveryMethod = "pickup" | "address";

export interface CheckoutProceedParams {
  fullName: string;
  phoneNumber: string;
  deliveryMethod: "pickup" | "address";
  paymentOption: PaymentOption | null;
  pickupStationId: string | null;
  deliveryAddress: string | null;
  /** The signed quote, the option chosen and the coordinates it was issued for. Null for pickup. */
  deliveryFields: OrderDeliveryFields | null;
}

interface DesktopCheckoutViewProps {
  productsTotal: number;
  orderSummary: ReactNode;
  onProceed: (params: CheckoutProceedParams) => Promise<{ orderNumber: string; totalAmount: number } & OrderDeliveryFacts>;
  onOrderCreated?: () => void;
  successMessage: string;
  returnToPath: string;
  enableResumeFlow?: boolean;
  enableEmptyCartRedirect?: boolean;
}

export function DesktopCheckoutView({
  productsTotal,
  orderSummary,
  onProceed,
  onOrderCreated,
  successMessage,
  returnToPath,
  enableResumeFlow,
  enableEmptyCartRedirect,
}: DesktopCheckoutViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, walletBalance } = useAuth();

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [pickupStation, setPickupStation] = useState<PickupStation | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [addressLat, setAddressLat] = useState<number | null>(null);
  const [addressLng, setAddressLng] = useState<number | null>(null);
  const [paymentOption, setPaymentOption] = useState<PaymentOption | null>(null);

  // What delivery costs at the chosen address, and when, as the server works it out
  const delivery = useDeliveryOptions(
    session?.access_token,
    addressLat != null && addressLng != null ? { lat: addressLat, lng: addressLng } : null,
  );

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Only a bank transfer has a payment to confirm — see Checkout.tsx.
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [serverTotalAmount, setServerTotalAmount] = useState<number | null>(null);
  // How and when the order is being delivered, as the server stored it
  const [deliverySummary, setDeliverySummary] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      if (user.name && !fullName) setFullName(user.name);
      if (user.phone && !phoneNumber) setPhoneNumber(user.phone);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enableResumeFlow) return;
    const state = location.state as { resumeOrderNumber?: string; resumeAmount?: number } | null;
    if (state?.resumeOrderNumber) {
      setOrderNumber(state.resumeOrderNumber);
      setServerTotalAmount(state.resumeAmount ?? null);
      setShowPayment(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enableEmptyCartRedirect) return;
    if (productsTotal === 0 && !showPayment && !showSuccess) {
      navigate("/catalogue");
    }
  }, [productsTotal, showPayment, showSuccess, navigate, enableEmptyCartRedirect]);

  const deliveryFee = deliveryMethod === "address" ? (delivery.selected?.feeKobo ?? 0) : 0;

  const grandTotal = productsTotal + deliveryFee;

  const isPickup = deliveryMethod === "pickup";
  const hasDeliveryDetails = isPickup ? !!pickupStation : !!address && !!delivery.selected;
  const hasPaymentOption = isPickup || !!paymentOption;
  const showContactForm = hasDeliveryDetails && hasPaymentOption;
  const isContactValid = fullName.trim().length >= 2 && phoneNumber.trim().length >= 10;
  const canProceed = !!deliveryMethod && isContactValid && hasDeliveryDetails && hasPaymentOption;

  useEffect(() => {
    if (showContactForm && contactRef.current) {
      setTimeout(() => contactRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 150);
    }
  }, [showContactForm]);

  const handleMethodChange = () => {
    setDeliveryMethod(null);
    setPickupStation(null);
    setAddress(null);
    setAddressLat(null);
    setAddressLng(null);
    setPaymentOption(null);
  };

  const handleAddressChange = () => {
    setAddress(null);
    setAddressLat(null);
    setAddressLng(null);
  };

  const handleProceedToPayment = async () => {
    if (!session?.access_token) return;
    metaPixel.customEvent('ProceedToPayment', { delivery_method: deliveryMethod, is_gift_bundle: returnToPath === '/gifting/bundles' });
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await onProceed({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        deliveryMethod: deliveryMethod!,
        paymentOption,
        pickupStationId: deliveryMethod === "pickup" ? (pickupStation?.id ?? null) : null,
        deliveryAddress: deliveryMethod === "address" ? address : null,
        deliveryFields: deliveryMethod === "address" ? delivery.orderFields : null,
      });
      setOrderNumber(result.orderNumber);
      setServerTotalAmount(result.totalAmount);
      setDeliverySummary(describeOrderDelivery(result));
      if (paymentOption === "pay-on-delivery") {
        metaPixel.purchase({ value: result.totalAmount / 100, currency: 'NGN', order_id: result.orderNumber });
        setShowSuccess(true);
      } else {
        setShowPayment(true);
      }
      onOrderCreated?.();
    } catch (err) {
      if (err instanceof DeliveryQuoteStaleError) {
        // What they were shown is no longer true: show what is, and let them choose again.
        delivery.applyStale(err);
      }
      setSubmitError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // §1: poll for up to 30s after "Payment Made", then release the buyer.
  const { state: pollState, status: orderStatus } = useOrderConfirmationPoll(
    awaitingConfirmation ? orderNumber : null,
    session?.access_token,
  );

  const handlePaymentConfirmedInternal = () => {
    setShowPayment(false);
    setAwaitingConfirmation(true);
    setShowSuccess(true);
  };

  const handleGiftCardFullCoverage = () => {
    setShowPayment(false);
    setShowSuccess(true);
  };

  if (showPayment && orderNumber) {
    return (
      <DesktopCheckoutPaymentView
        orderId={orderNumber}
        totalAmount={serverTotalAmount ?? grandTotal}
        token={session?.access_token ?? ""}
        walletBalance={walletBalance ?? 0}
        onPaymentConfirmed={handlePaymentConfirmedInternal}
        onGiftCardFullCoverage={handleGiftCardFullCoverage}
        onBack={() => setShowPayment(false)}
        title="Complete payment"
        backLabel="Back to checkout"
      />
    );
  }

  // Bank transfer: the 30-second window and its two outcomes (§1b/§1c).
  if (showSuccess && orderNumber && awaitingConfirmation) {
    if (pollState === "waiting") {
      return <PaymentCheckingView variant="desktop" />;
    }

    const copy = resolveOutcomeCopy({
      authState: "user",
      deliveryMethod: "link", // unused for a regular order
      confirmed: pollState === "confirmed",
      orderKind: "other",
      buyerEmail: orderStatus?.buyerEmail ?? user?.email,
    });

    const handleOutcomeAction = (action: CtaAction) => {
      switch (action) {
        case "order-history":
          navigate("/orders");
          break;
        case "gifting":
          navigate("/gifting");
          break;
        case "shop":
          navigate("/catalogue");
          break;
      }
    };

    return (
      <PaymentOutcomeView
        copy={copy}
        orderNumber={orderNumber}
        giftCards={[]}
        onAction={handleOutcomeAction}
        variant="desktop"
      />
    );
  }

  if (showSuccess && orderNumber) {
    const isPayOnDelivery = paymentOption === "pay-on-delivery";
    const resolvedMessage = isPayOnDelivery
      ? "Your order has been placed! We'll prepare it and get it to you. Pay when it arrives."
      : successMessage;
    const resolvedSteps = isPayOnDelivery
      ? [
          { icon: Package, label: isPickup ? "Order being prepared" : "Order being packed", active: true },
          { icon: Truck, label: isPickup ? "Ready for pickup" : "Out for delivery", active: false },
        ]
      : [
          { icon: Clock, label: "Payment verifying", active: true },
          { icon: Package, label: isPickup ? "Order being prepared" : "Order being packed", active: false },
          { icon: Truck, label: isPickup ? "Ready for pickup" : "Out for delivery", active: false },
        ];
    return (
      <DesktopCheckoutSuccessView
        orderId={orderNumber}
        message={resolvedMessage}
        onViewOrder={() => navigate("/orders")}
        onReturnToShop={() => navigate(returnToPath)}
        steps={resolvedSteps}
        deliverySummary={deliverySummary}
      />
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
        <div className="flex items-center gap-3 px-8 py-6 border-b bg-background/80 backdrop-blur sticky top-20 z-20">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <h1 className="text-lg font-bold text-foreground ml-2">Sign In</h1>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="bg-card rounded-3xl border border-foreground/[0.06] shadow-sm p-8">
              <SignInForm />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Top nav */}
      <div className="border-b bg-background/80 backdrop-blur sticky top-20 z-20">
        <div className="container flex items-center h-14 gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Cart
          </button>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="text-base font-bold text-foreground">Checkout</h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left — checkout steps */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            {/* Delivery */}
            <div className="bg-card rounded-3xl border border-foreground/[0.06] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-border">
                <h2 className="text-sm font-bold text-foreground">Delivery</h2>
              </div>
              <div className="px-6 py-6 space-y-5">
                <CheckoutDeliverySection
                  selectedMethod={deliveryMethod}
                  onSelectMethod={setDeliveryMethod}
                  onChangeMethod={handleMethodChange}
                />
                {deliveryMethod === "pickup" && (
                  <div className="animate-fade-in">
                    <CheckoutPickupSection
                      selectedStation={pickupStation}
                      onSelectStation={setPickupStation}
                      onChangeStation={() => setPickupStation(null)}
                    />
                  </div>
                )}
                {deliveryMethod === "address" && (
                  <div className="animate-fade-in">
                    <CheckoutAddressSection
                      selectedAddress={address}
                      onSelectAddress={(addr, lat, lng) => {
                        setAddress(addr);
                        setAddressLat(lat);
                        setAddressLng(lng);
                      }}
                      onChangeAddress={handleAddressChange}
                    />
                  </div>
                )}
                {deliveryMethod === "address" && address && (
                  <div className="animate-fade-in">
                    <DeliveryOptionsSection
                      options={delivery.options}
                      isLoading={delivery.isLoading}
                      error={delivery.error}
                      onRetry={() => delivery.refetch()}
                      choice={delivery.choice}
                      onChoose={delivery.setChoice}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Payment option (address delivery only) */}
            {hasDeliveryDetails && deliveryMethod === "address" && (
              <div className="bg-card rounded-3xl border border-foreground/[0.06] shadow-sm overflow-hidden animate-fade-in">
                <div className="px-6 py-5 border-b border-border">
                  <h2 className="text-sm font-bold text-foreground">Payment Method</h2>
                </div>
                <div className="px-6 py-6">
                  <CheckoutPaymentOptionSection
                    selectedOption={paymentOption}
                    onSelectOption={setPaymentOption}
                    onChangeOption={() => setPaymentOption(null)}
                  />
                </div>
              </div>
            )}

            {/* Contact */}
            {showContactForm && (
              <div
                ref={contactRef}
                className="bg-card rounded-3xl border border-foreground/[0.06] shadow-sm overflow-hidden animate-fade-in"
              >
                <div className="px-6 py-5 border-b border-border">
                  <h2 className="text-sm font-bold text-foreground">Your Details</h2>
                </div>
                <div className="px-6 py-6">
                  <ContactForm
                    fullName={fullName}
                    phoneNumber={phoneNumber}
                    onFullNameChange={setFullName}
                    onPhoneChange={setPhoneNumber}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right — sticky order summary */}
          <div className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-36 space-y-4">
              <div className="bg-card rounded-3xl border border-foreground/[0.06] shadow-sm p-6 space-y-4">
                <h2 className="text-sm font-bold text-foreground">Order Summary</h2>

                {orderSummary}

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-medium text-emerald-700">
                      {deliveryMethod === "pickup"
                        ? "FREE"
                        : deliveryFee > 0
                          ? formatPrice(deliveryFee)
                          : deliveryMethod
                            ? "—"
                            : "Calculated next"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-lg text-foreground">{formatPrice(grandTotal)}</span>
                </div>

                {submitError && (
                  <p className="text-sm text-destructive text-center">{submitError}</p>
                )}

                <Button
                  variant="shop"
                  className="w-full h-12 text-base font-semibold rounded-2xl"
                  disabled={!canProceed || isSubmitting}
                  onClick={handleProceedToPayment}
                >
                  {isSubmitting
                    ? "Placing Order…"
                    : paymentOption === "pay-on-delivery"
                      ? "Place Order"
                      : "Proceed to Payment"}
                </Button>
              </div>

              <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" />
                Secure &amp; encrypted checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
