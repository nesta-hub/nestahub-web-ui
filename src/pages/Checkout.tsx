import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
  CheckoutDeliverySpeedSection,
  CheckoutPaymentOptionSection,
  ContactForm,
  CheckoutPaymentView,
  CheckoutSuccessView,
  DeliveryConfirmationDrawer,
  type PaymentOption,
} from "@/components/checkout";
import { SignInForm } from "@/components/auth/SignInForm";
import { api, formatPrice } from "@/lib/api";
import { useGiftBundle, usePackagingOptions } from "@/hooks/useGifting";
import { isZone1Address, isZone1Or2Address } from "@/components/checkout/CheckoutAddressSection";
import { calculateDeliveryTiming, type DeliveryTiming } from "@/lib/delivery-timing";

type DeliveryMethod = 'pickup' | 'address';
type DeliverySpeed = 'standard' | 'weekend' | 'sameday' | 'nextday';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { items, totalAmount, clearCart } = useCart();
  const { user, session, walletBalance } = useAuth();

  // Curated gift-bundle checkout (source=gift-bundle): priced from the bundle +
  // packaging, with no cart items. Gated so the shop/legacy flow is untouched.
  const isGiftBundle = searchParams.get('source') === 'gift-bundle';
  const giftBundleId = searchParams.get('bundleId');
  const giftPackagingId = searchParams.get('packagingId');
  const { data: giftBundle } = useGiftBundle(isGiftBundle ? giftBundleId : null);
  const { data: packagingOptionsData } = usePackagingOptions();
  const giftPackaging = isGiftBundle
    ? packagingOptionsData?.find((p) => p.id === giftPackagingId) ?? null
    : null;
  const giftBundleProductsTotal =
    (giftBundle?.pkg.price ?? 0) + (giftPackaging?.price ?? 0);

  // Delivery state
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [pickupStation, setPickupStation] = useState<PickupStation | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [addressDeliveryFee, setAddressDeliveryFee] = useState<number | null>(null);
  const [addressLat, setAddressLat] = useState<number | null>(null);
  const [addressLng, setAddressLng] = useState<number | null>(null);
  const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeed | null>(null);
  const [paymentOption, setPaymentOption] = useState<PaymentOption | null>(null);
  const [isZone1, setIsZone1] = useState<boolean>(false);
  const [isZone1Or2, setIsZone1Or2] = useState<boolean>(false); // For weekend delivery eligibility

  // Delivery confirmation drawer state
  const [showDeliveryConfirmation, setShowDeliveryConfirmation] = useState(false);
  const [calculatedDeliveryTiming, setCalculatedDeliveryTiming] = useState<DeliveryTiming | null>(null);

  // Contact state - pre-fill from user data when available
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Pre-fill contact form when user data is available
  useEffect(() => {
    if (user) {
      if (user.name && !fullName) {
        setFullName(user.name);
      }
      if (user.phone && !phoneNumber) {
        setPhoneNumber(user.phone);
      }
    }
  }, [user]);

  // View state
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [serverTotalAmount, setServerTotalAmount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paidWithGiftCard, setPaidWithGiftCard] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);

  // Determine order type from the entry source
  const source = searchParams.get('source');
  const orderType: 'shop' | 'bundle' | 'custom_gift' =
    source === 'gifting' ? 'bundle' : source === 'custom-gift' ? 'custom_gift' : 'shop';
  const bundleId = searchParams.get('bundleId');
  const giftSizeId = searchParams.get('giftSizeId');

  // Handle resume flow: if navigated from Cart with an existing order, skip to payment
  useEffect(() => {
    const state = location.state as { resumeOrderNumber?: string; resumeAmount?: number } | null;
    if (state?.resumeOrderNumber) {
      setOrderNumber(state.resumeOrderNumber);
      setServerTotalAmount(state.resumeAmount ?? null);
      setShowPayment(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect to catalogue if cart is empty (but not when showing payment/success screens)
  useEffect(() => {
    if (items.length === 0 && !showPayment && !showSuccess && !isGiftBundle) {
      navigate('/catalogue');
    }
  }, [items.length, navigate, showPayment, showSuccess, isGiftBundle]);

  // Delivery fee — dynamic based on address zone and delivery speed
  const deliveryFee = (() => {
    if (deliveryMethod === 'pickup') return 0;
    if (deliveryMethod === 'address' && deliverySpeed) {
      // Same day and next day use zone-based fees
      if (deliverySpeed === 'sameday' || deliverySpeed === 'nextday') {
        return addressDeliveryFee ?? 0;
      }
      // Legacy: standard delivery uses zone-based fee
      if (deliverySpeed === 'standard') {
        return addressDeliveryFee ?? 0;
      }
      // Legacy: weekend delivery uses flat ₦500 fee
      if (deliverySpeed === 'weekend') {
        return 50000; // ₦500 in kobo
      }
    }
    return 0;
  })();
  const productsTotal = isGiftBundle ? giftBundleProductsTotal : totalAmount;
  const grandTotal = productsTotal + deliveryFee;

  // Validation
  const isContactValid = fullName.trim().length >= 2 && phoneNumber.trim().length >= 10;
  const hasDeliveryDetails = deliveryMethod === 'pickup' ? !!pickupStation : (!!address && !!deliverySpeed);
  // Payment option only applies to address delivery; pickup skips it
  const isPickup = deliveryMethod === 'pickup';
  const hasPaymentOption = isPickup || !!paymentOption;
  const showContactForm = hasDeliveryDetails && hasPaymentOption;
  const canProceed = deliveryMethod && isContactValid && hasDeliveryDetails && hasPaymentOption;

  // Scroll to contact form when ready
  useEffect(() => {
    if (showContactForm && contactRef.current) {
      setTimeout(() => {
        contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [showContactForm]);

  // Delivery Handlers
  const handleMethodChange = () => {
    setDeliveryMethod(null);
    setPickupStation(null);
    setAddress(null);
    setAddressDeliveryFee(null);
    setAddressLat(null);
    setAddressLng(null);
    setDeliverySpeed(null);
    setPaymentOption(null);
    setIsZone1(false);
  };

  const handleStationChange = () => {
    setPickupStation(null);
  };

  const handleAddressChange = () => {
    setAddress(null);
    setAddressDeliveryFee(null);
    setAddressLat(null);
    setAddressLng(null);
    setDeliverySpeed(null);
    setIsZone1(false);
    setCalculatedDeliveryTiming(null);
    setShowDeliveryConfirmation(false);
  };

  const handleSpeedChange = () => {
    setDeliverySpeed(null);
  };

  const handleDeliveryConfirm = () => {
    if (calculatedDeliveryTiming) {
      setDeliverySpeed(calculatedDeliveryTiming.speed as DeliverySpeed);
      setShowDeliveryConfirmation(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleProceedToPayment = async () => {
    if (!session?.access_token) return;

    // Curated gift bundle: dedicated endpoint, no item list.
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
      clearCart(); // Clear cart immediately after successful order creation
      clearCustomGiftDraft(); // Order placed — discard the temporary custom-gift build draft

      // If pay-on-delivery, skip payment view and go directly to success
      if (paymentOption === 'pay-on-delivery') {
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
    // Gift card covers full order, mark payment as made immediately
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

  // Payment overlay
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

  // Success overlay
  if (showSuccess && orderNumber) {
    return <CheckoutSuccessView orderId={orderNumber} paidWithGiftCard={paidWithGiftCard} />;
  }

  return (
    <Layout showNav={false}>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
          <button type="button" onClick={handleBack}>
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
              {/* Delivery sections */}
              <div className="animate-fade-in-up">
                {/* Delivery Method Section */}
                <CheckoutDeliverySection
                  selectedMethod={deliveryMethod}
                  onSelectMethod={setDeliveryMethod}
                  onChangeMethod={handleMethodChange}
                  addressDeliveryFee={addressDeliveryFee}
                />

                {/* Pickup Section (if pickup selected) */}
                {deliveryMethod === 'pickup' && (
                  <div className="mt-6 animate-fade-in">
                    <CheckoutPickupSection
                      selectedStation={pickupStation}
                      onSelectStation={setPickupStation}
                      onChangeStation={handleStationChange}
                    />
                  </div>
                )}

                {/* Address Section (if address selected) */}
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
                        // Determine if address is in Zone 1 and Zone 1 or 2
                        setIsZone1(isZone1Address(lat, lng));
                        setIsZone1Or2(isZone1Or2Address(lat, lng));
                        // Calculate delivery timing and show confirmation drawer
                        const timing = calculateDeliveryTiming();
                        setCalculatedDeliveryTiming(timing);
                        setShowDeliveryConfirmation(true);
                      }}
                      onChangeAddress={handleAddressChange}
                    />
                  </div>
                )}

                {/* Delivery Confirmation Drawer (after address selected) */}
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
                      // If user closes drawer without confirming, reset address
                      if (!deliverySpeed) {
                        handleAddressChange();
                      }
                    }}
                  />
                )}

                {/* Payment Option (address delivery only) */}
                {hasDeliveryDetails && deliveryMethod === 'address' && (
                  <div className="mt-6 animate-fade-in-up">
                    <CheckoutPaymentOptionSection
                      selectedOption={paymentOption}
                      onSelectOption={setPaymentOption}
                      onChangeOption={() => setPaymentOption(null)}
                    />
                  </div>
                )}

                {/* Contact Form */}
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
            {/* Gift bundle review (no cart items for a curated bundle) */}
            {isGiftBundle && giftBundle && (
              <div className="rounded-lg border border-border/50 divide-y divide-border/50">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-10 h-10 rounded-md bg-secondary/50 overflow-hidden shrink-0">
                    <img src={giftBundle.pkg.heroImage} alt={giftBundle.pkg.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{giftBundle.pkg.name}</p>
                    <p className="text-xs text-muted-foreground">{giftBundle.pkg.items.length} items</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">{formatPrice(giftBundle.pkg.price)}</p>
                </div>
                {giftPackaging && (
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-10 h-10 rounded-md bg-secondary/50 overflow-hidden shrink-0">
                      <img src={giftPackaging.image} alt={giftPackaging.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{giftPackaging.name}</p>
                    </div>
                    <p className="text-sm font-semibold shrink-0">+ {formatPrice(giftPackaging.price)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Itemized review — what's actually in the order/gift box */}
            {items.length > 0 && (
              <div className="rounded-lg border border-border/50 divide-y divide-border/50 max-h-44 overflow-y-auto">
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground sticky top-0 bg-background/95 backdrop-blur">
                  {orderType === 'shop'
                    ? `${items.length} item${items.length > 1 ? 's' : ''}`
                    : `Your gift box · ${items.length} item${items.length > 1 ? 's' : ''}`}
                </p>
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2">
                    <div className="w-10 h-10 rounded-md bg-secondary/50 overflow-hidden shrink-0">
                      {item.image && (
                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.brand} {item.productName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.attributes && item.attributes.length > 0
                          ? item.attributes.map((a) => a.displayValue || a.value).join(' · ')
                          : `Qty ${item.quantity}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{formatPrice(item.unitPrice * item.quantity)}</p>
                      <p className="text-[11px] text-muted-foreground">×{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Order summary */}
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
