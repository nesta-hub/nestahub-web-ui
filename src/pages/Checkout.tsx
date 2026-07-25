import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, Package, RefreshCw } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { clearCustomGiftDraft } from "@/lib/giftDraft";
import type { PickupStation } from "@/lib/api";
import {
  CheckoutDeliverySection,
  CheckoutPickupSection,
  CheckoutAddressSection,
  CheckoutPaymentOptionSection,
  ContactForm,
  CheckoutPaymentView,
  CheckoutSuccessView,
  DeliveryConfirmationDrawer,
  type PaymentOption,
} from "@/components/checkout";
import { SignInForm } from "@/components/auth/SignInForm";
import { api, formatPrice } from "@/lib/api";
import { metaPixel } from "@/lib/metaPixel";
import { useGiftBundle, usePackagingOptions } from "@/hooks/useGifting";
import { isZone1Address, isZone1Or2Address } from "@/components/checkout/CheckoutAddressSection";
import { calculateDeliveryTiming, type DeliveryTiming } from "@/lib/delivery-timing";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopCheckoutView } from "@/components/checkout/DesktopCheckoutView";
import { formatGiftPrice } from "@/data/giftCatalogue";
import type { GiftPackage } from "@/data/giftCatalogue";
import type { PackagingOption } from "@/lib/giftAdapter";
import type { CartItem } from "@/contexts/CartContext";

type DeliveryMethod = 'pickup' | 'address';
type DeliverySpeed = 'standard' | 'weekend' | 'sameday' | 'nextday';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { items, totalAmount, clearCart } = useCart();
  const isMobile = useIsMobile();
  const { user, session, walletBalance } = useAuth();

  // Curated gift-bundle checkout
  const isGiftBundle = searchParams.get('source') === 'gift-bundle';
  const giftBundleId = searchParams.get('bundleId');
  const giftPackagingId = searchParams.get('packagingId');
  const { data: giftBundle } = useGiftBundle(isGiftBundle ? giftBundleId : null);
  const { data: packagingOptionsData } = usePackagingOptions();
  const giftPackaging = isGiftBundle
    ? packagingOptionsData?.find((p) => p.id === giftPackagingId) ?? null
    : null;
  const giftBundleProductsTotal =
    ((giftBundle?.pkg.price ?? 0) + (giftPackaging?.price ?? 0)) * 100;

  // Delivery state (mobile only — desktop handled inside DesktopCheckoutView)
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [pickupStation, setPickupStation] = useState<PickupStation | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [addressDeliveryFee, setAddressDeliveryFee] = useState<number | null>(null);
  const [addressLat, setAddressLat] = useState<number | null>(null);
  const [addressLng, setAddressLng] = useState<number | null>(null);
  const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeed | null>(null);
  const [paymentOption, setPaymentOption] = useState<PaymentOption | null>(null);
  const [isZone1Or2, setIsZone1Or2] = useState<boolean>(false);

  // Delivery confirmation drawer state (mobile)
  const [showDeliveryConfirmation, setShowDeliveryConfirmation] = useState(false);
  const [calculatedDeliveryTiming, setCalculatedDeliveryTiming] = useState<DeliveryTiming | null>(null);

  // Contact state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (user) {
      if (user.name && !fullName) setFullName(user.name);
      if (user.phone && !phoneNumber) setPhoneNumber(user.phone);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // View state (mobile)
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [serverTotalAmount, setServerTotalAmount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paidWithGiftCard, setPaidWithGiftCard] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);

  const source = searchParams.get('source');
  const orderType: 'shop' | 'bundle' | 'custom_gift' =
    source === 'gifting' ? 'bundle' : source === 'custom-gift' ? 'custom_gift' : 'shop';
  const bundleId = searchParams.get('bundleId');
  const giftSizeId = searchParams.get('giftSizeId');

  // Resume flow (mobile)
  useEffect(() => {
    const state = location.state as { resumeOrderNumber?: string; resumeAmount?: number } | null;
    if (state?.resumeOrderNumber) {
      setOrderNumber(state.resumeOrderNumber);
      setServerTotalAmount(state.resumeAmount ?? null);
      setShowPayment(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect to catalogue if cart is empty (mobile only — desktop handled inside DesktopCheckoutView)
  useEffect(() => {
    if (isMobile && items.length === 0 && !showPayment && !showSuccess && !isGiftBundle) {
      navigate('/catalogue');
    }
  }, [isMobile, items.length, navigate, showPayment, showSuccess, isGiftBundle]);

  const deliveryFee = (() => {
    if (deliveryMethod === 'pickup') return 0;
    if (deliveryMethod === 'address' && deliverySpeed) {
      if (deliverySpeed === 'weekend') return 50000;
      return addressDeliveryFee ?? 0;
    }
    return 0;
  })();
  const productsTotal = isGiftBundle ? giftBundleProductsTotal : totalAmount;
  const grandTotal = productsTotal + deliveryFee;

  const isContactValid = fullName.trim().length >= 2 && phoneNumber.trim().length >= 10;
  const hasDeliveryDetails = deliveryMethod === 'pickup' ? !!pickupStation : (!!address && !!deliverySpeed);
  const isPickup = deliveryMethod === 'pickup';
  const hasPaymentOption = isPickup || !!paymentOption;
  const showContactForm = hasDeliveryDetails && hasPaymentOption;
  const canProceed = deliveryMethod && isContactValid && hasDeliveryDetails && hasPaymentOption;

  useEffect(() => {
    if (showContactForm && contactRef.current) {
      setTimeout(() => {
        contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [showContactForm]);

  const handleMethodChange = () => {
    setDeliveryMethod(null);
    setPickupStation(null);
    setAddress(null);
    setAddressDeliveryFee(null);
    setAddressLat(null);
    setAddressLng(null);
    setDeliverySpeed(null);
    setPaymentOption(null);
  };

  const handleAddressChange = () => {
    setAddress(null);
    setAddressDeliveryFee(null);
    setAddressLat(null);
    setAddressLng(null);
    setDeliverySpeed(null);
    setCalculatedDeliveryTiming(null);
    setShowDeliveryConfirmation(false);
  };

  const handleDeliveryConfirm = () => {
    if (calculatedDeliveryTiming) {
      setDeliverySpeed(calculatedDeliveryTiming.speed as DeliverySpeed);
      setShowDeliveryConfirmation(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!session?.access_token) return;

    metaPixel.customEvent('ProceedToPayment', {
      delivery_method: deliveryMethod,
      is_gift_bundle: isGiftBundle,
    });

    if (isGiftBundle && giftBundleId) {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const result = await api.createGiftBundleOrder(
          {
            bundleId: giftBundleId,
            fullName: fullName.trim(),
            phoneNumber: phoneNumber.trim() || undefined,
            deliveryMethod: deliveryMethod!,
            deliverySpeed: deliveryMethod === 'address' ? (deliverySpeed ?? undefined) : undefined,
            paymentOption: deliveryMethod === 'address' ? (paymentOption ?? undefined) : undefined,
            pickupStationId: deliveryMethod === 'pickup' ? (pickupStation?.id ?? null) : null,
            deliveryAddress: deliveryMethod === 'address' ? address : null,
            deliveryLat: deliveryMethod === 'address' && addressLat != null ? addressLat : undefined,
            deliveryLng: deliveryMethod === 'address' && addressLng != null ? addressLng : undefined,
            packagingOptionId: giftPackagingId ?? undefined,
          },
          session.access_token,
        );
        setOrderNumber(result.orderNumber);
        setServerTotalAmount(result.totalAmount);
        if (paymentOption === 'pay-on-delivery') {
          metaPixel.purchase({ value: result.totalAmount / 100, currency: 'NGN', order_id: result.orderNumber });
          setShowSuccess(true);
        } else {
          setShowPayment(true);
        }
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const orderItems = items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        isAutoRenew: item.isAutoRenew ?? false,
        frequencyWeeks: item.isAutoRenew ? (item.frequencyWeeks ?? null) : null,
        subscriptionId: item.subscriptionId ?? undefined,
      }));

      const result = await api.createOrder(
        {
          orderType,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          deliveryMethod: deliveryMethod!,
          deliverySpeed: deliveryMethod === 'address' ? (deliverySpeed ?? undefined) : undefined,
          paymentOption: deliveryMethod === 'address' ? (paymentOption ?? undefined) : undefined,
          pickupStationId: deliveryMethod === 'pickup' ? pickupStation?.id ?? null : null,
          deliveryAddress: deliveryMethod === 'address' ? address : null,
          deliveryLat: deliveryMethod === 'address' && addressLat != null ? addressLat : undefined,
          deliveryLng: deliveryMethod === 'address' && addressLng != null ? addressLng : undefined,
          bundleId: orderType === 'bundle' ? (bundleId ?? null) : null,
          giftSizeId: orderType === 'custom_gift' ? (giftSizeId ?? null) : null,
          items: orderItems,
        },
        session.access_token,
      );

      setOrderNumber(result.orderNumber);
      setServerTotalAmount(result.totalAmount);
      clearCart();
      clearCustomGiftDraft();

      if (paymentOption === 'pay-on-delivery') {
        metaPixel.purchase({ value: result.totalAmount / 100, currency: 'NGN', order_id: result.orderNumber });
        setShowSuccess(true);
      } else {
        setShowPayment(true);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentConfirmed = () => {
    setShowPayment(false);
    setShowSuccess(true);
  };

  const handleGiftCardFullCoverage = async () => {
    if (!session?.access_token || !orderNumber) return;
    try {
      await api.markPaymentMade(orderNumber, session.access_token);
      setPaidWithGiftCard(true);
      setShowPayment(false);
      setShowSuccess(true);
    } catch (err) {
      console.error('Failed to confirm gift card payment:', err);
    }
  };

  // Mobile payment overlay
  if (showPayment && orderNumber) {
    return (
      <CheckoutPaymentView
        orderId={orderNumber}
        totalAmount={serverTotalAmount ?? grandTotal}
        token={session?.access_token ?? ''}
        walletBalance={walletBalance ?? 0}
        onPaymentConfirmed={handlePaymentConfirmed}
        onGiftCardFullCoverage={handleGiftCardFullCoverage}
        onBack={() => setShowPayment(false)}
      />
    );
  }

  // Mobile success overlay
  if (showSuccess && orderNumber) {
    return <CheckoutSuccessView orderId={orderNumber} paidWithGiftCard={paidWithGiftCard} paymentOption={paymentOption ?? undefined} />;
  }

  // Desktop gift bundle — loading guard while bundle data fetches
  if (!isMobile && isGiftBundle && !giftBundle) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  // Desktop gift bundle checkout
  if (!isMobile && isGiftBundle && giftBundle) {
    return (
      <DesktopCheckoutView
        productsTotal={giftBundleProductsTotal}
        orderSummary={
          <BundleOrderSummary pkg={giftBundle.pkg} selectedPackaging={giftPackaging} />
        }
        onProceed={async (params) =>
          api.createGiftBundleOrder(
            {
              bundleId: giftBundleId!,
              packagingOptionId: giftPackagingId ?? undefined,
              fullName: params.fullName,
              phoneNumber: params.phoneNumber || undefined,
              deliveryMethod: params.deliveryMethod,
              deliverySpeed: params.deliveryMethod === 'address' ? (params.deliverySpeed ?? undefined) : undefined,
              paymentOption: params.deliveryMethod === 'address' ? (params.paymentOption ?? undefined) : undefined,
              pickupStationId: params.pickupStationId,
              deliveryAddress: params.deliveryAddress,
              deliveryLat: params.deliveryLat ?? undefined,
              deliveryLng: params.deliveryLng ?? undefined,
            },
            session!.access_token,
          )
        }
        successMessage="We're verifying your payment. You'll receive a confirmation via email once it's confirmed, and we'll get your order on the way."
        returnToPath="/gifting/bundles"
      />
    );
  }

  // Desktop shop checkout
  if (!isMobile) {
    return (
      <Layout>
        <DesktopCheckoutView
          productsTotal={totalAmount}
          orderSummary={<ShopOrderSummary items={items} />}
          onProceed={async (params) => {
            const orderItems = items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              isAutoRenew: item.isAutoRenew ?? false,
              frequencyWeeks: item.isAutoRenew ? (item.frequencyWeeks ?? null) : null,
              subscriptionId: item.subscriptionId ?? undefined,
            }));
            return api.createOrder(
              {
                orderType,
                fullName: params.fullName,
                phoneNumber: params.phoneNumber,
                deliveryMethod: params.deliveryMethod,
                deliverySpeed: params.deliveryMethod === 'address' ? (params.deliverySpeed ?? undefined) : undefined,
                paymentOption: params.deliveryMethod === 'address' ? (params.paymentOption ?? undefined) : undefined,
                pickupStationId: params.deliveryMethod === 'pickup' ? params.pickupStationId : null,
                deliveryAddress: params.deliveryMethod === 'address' ? params.deliveryAddress : null,
                deliveryLat: params.deliveryMethod === 'address' && params.deliveryLat != null ? params.deliveryLat : undefined,
                deliveryLng: params.deliveryMethod === 'address' && params.deliveryLng != null ? params.deliveryLng : undefined,
                bundleId: orderType === 'bundle' ? (bundleId ?? null) : null,
                giftSizeId: orderType === 'custom_gift' ? (giftSizeId ?? null) : null,
                items: orderItems,
              },
              session!.access_token,
            );
          }}
          onOrderCreated={() => { setTimeout(() => { clearCart(); clearCustomGiftDraft(); }, 0); }}
          successMessage="We're verifying your payment. You'll receive a confirmation via WhatsApp once it's confirmed, and we'll get your order on the way."
          returnToPath="/catalogue"
          enableResumeFlow
          enableEmptyCartRedirect
        />
      </Layout>
    );
  }

  // Mobile layout
  return (
    <Layout showNav={false}>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
          <button type="button" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Checkout</h1>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-4 space-y-6">
          {!user ? (
            <div className="animate-fade-in">
              <SignInForm />
            </div>
          ) : (
            <>
              <div className="animate-fade-in-up">
                <CheckoutDeliverySection
                  selectedMethod={deliveryMethod}
                  onSelectMethod={setDeliveryMethod}
                  onChangeMethod={handleMethodChange}
                  addressDeliveryFee={addressDeliveryFee}
                />

                {deliveryMethod === 'pickup' && (
                  <div className="mt-6 animate-fade-in">
                    <CheckoutPickupSection
                      selectedStation={pickupStation}
                      onSelectStation={setPickupStation}
                      onChangeStation={() => setPickupStation(null)}
                    />
                  </div>
                )}

                {deliveryMethod === 'address' && (
                  <div className="mt-6 animate-fade-in">
                    <CheckoutAddressSection
                      selectedAddress={address}
                      deliveryFee={addressDeliveryFee}
                      onSelectAddress={(addr, fee, lat, lng) => {
                        setAddress(addr);
                        setAddressDeliveryFee(fee);
                        setAddressLat(lat);
                        setAddressLng(lng);
                        setIsZone1Or2(isZone1Or2Address(lat, lng));
                        const timing = calculateDeliveryTiming();
                        setCalculatedDeliveryTiming(timing);
                        setShowDeliveryConfirmation(true);
                      }}
                      onChangeAddress={handleAddressChange}
                    />
                  </div>
                )}

                {deliveryMethod === 'address' && address && calculatedDeliveryTiming && (
                  <DeliveryConfirmationDrawer
                    open={showDeliveryConfirmation}
                    address={address}
                    deliverySpeed={calculatedDeliveryTiming.speed}
                    deliveryDate={calculatedDeliveryTiming.deliveryDate}
                    deliveryFee={addressDeliveryFee ?? 0}
                    onProceed={handleDeliveryConfirm}
                    onCancel={() => {
                      setShowDeliveryConfirmation(false);
                      if (!deliverySpeed) handleAddressChange();
                    }}
                  />
                )}

                {hasDeliveryDetails && deliveryMethod === 'address' && (
                  <div className="mt-6 animate-fade-in-up">
                    <CheckoutPaymentOptionSection
                      selectedOption={paymentOption}
                      onSelectOption={setPaymentOption}
                      onChangeOption={() => setPaymentOption(null)}
                    />
                  </div>
                )}

                {showContactForm && (
                  <div ref={contactRef} className="mt-6 animate-fade-in-up">
                    <ContactForm
                      fullName={fullName}
                      phoneNumber={phoneNumber}
                      onFullNameChange={setFullName}
                      onPhoneChange={setPhoneNumber}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer with CTA */}
        {hasDeliveryDetails && (
          <div className="p-4 border-t shrink-0 animate-fade-in space-y-3">
            <div className="bg-primary/5 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Products</span>
                <span className="font-medium">{formatPrice(productsTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium">
                  {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="border-t border-border/50 pt-2 flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {submitError && (
              <p className="text-sm text-destructive text-center">{submitError}</p>
            )}
            <Button
              variant="shop"
              className="w-full h-12 text-base font-semibold"
              onClick={handleProceedToPayment}
              disabled={!canProceed || isSubmitting}
            >
              {isSubmitting ? 'Placing Order...' : (paymentOption === 'pay-on-delivery' ? 'Place Order' : 'Proceed to Payment')}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Checkout;

// ─── Order summary sub-components ───────────────────────────────────────────

function ShopOrderSummary({ items }: { items: CartItem[] }) {
  const renewalGroups = items
    .filter((i) => i.isAutoRenew && i.frequencyWeeks)
    .reduce(
      (acc, i) => {
        const freq = i.frequencyWeeks!;
        const price = i.subscriptionPrice ?? i.unitPrice;
        acc[freq] = (acc[freq] || 0) + price * i.quantity;
        return acc;
      },
      {} as Record<number, number>,
    );

  const sortedRenewals = Object.entries(renewalGroups)
    .map(([weeks, amount]) => ({ weeks: Number(weeks), amount }))
    .sort((a, b) => a.weeks - b.weeks);

  return (
    <>
      <div className="space-y-3">
        {items.map((item) => {
          const displayPrice =
            item.isAutoRenew && item.subscriptionPrice
              ? item.subscriptionPrice
              : item.unitPrice;
          const lineTotal = displayPrice * item.quantity;
          return (
            <div key={`${item.productId}-${item.typeId}`} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/50 overflow-hidden shrink-0">
                {item.image && (
                  <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{item.productName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {item.typeName}
                  {item.sizeName ? ` · ${item.sizeName}` : ""} · Qty {item.quantity}
                  {item.isAutoRenew && <span className="ml-1 text-primary">Subscribe</span>}
                </p>
              </div>
              <p className="text-xs font-semibold text-foreground shrink-0">{formatPrice(lineTotal)}</p>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border pt-4 flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium">
          {formatPrice(items.reduce((s, i) => {
            const p = i.isAutoRenew && i.subscriptionPrice ? i.subscriptionPrice : i.unitPrice;
            return s + p * i.quantity;
          }, 0))}
        </span>
      </div>

      {sortedRenewals.length > 0 && (
        <div className="bg-card rounded-2xl border border-foreground/[0.06] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground">Future subscription payments</h3>
          </div>
          <div className="space-y-1.5">
            {sortedRenewals.map(({ weeks, amount }) => (
              <div key={weeks} className="flex justify-between text-sm">
                <span className="text-muted-foreground">In {weeks} week{weeks !== 1 ? "s" : ""}</span>
                <span className="font-medium">{formatPrice(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function BundleOrderSummary({
  pkg,
  selectedPackaging,
}: {
  pkg: GiftPackage;
  selectedPackaging: PackagingOption | null;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-secondary/50 overflow-hidden shrink-0">
          <img src={pkg.heroImage} alt={pkg.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{pkg.name}</p>
          <p className="text-xs text-muted-foreground">{pkg.items.length} items included</p>
        </div>
      </div>

      <div className="space-y-2 text-sm border-t border-border pt-3">
        <div className="flex justify-between gap-2 text-muted-foreground">
          <span>Bundle</span>
          <span className="font-medium text-foreground">{formatGiftPrice(pkg.price)}</span>
        </div>
        {selectedPackaging && (
          <div className="flex justify-between gap-2 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {selectedPackaging.name}
            </span>
            <span className="font-medium text-foreground">+ {formatGiftPrice(selectedPackaging.price)}</span>
          </div>
        )}
      </div>
    </>
  );
}
