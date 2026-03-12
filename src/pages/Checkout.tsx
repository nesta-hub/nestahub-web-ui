import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import type { PickupStation } from "@/lib/api";
import {
  CheckoutDeliverySection,
  CheckoutPickupSection,
  CheckoutAddressSection,
  CheckoutDeliverySpeedSection,
  ContactForm,
  CheckoutPaymentView,
  CheckoutSuccessView,
} from "@/components/checkout";
import { SignInForm } from "@/components/auth/SignInForm";
import { api, formatPrice } from "@/lib/api";
import { isZone1Address } from "@/components/checkout/CheckoutAddressSection";

type DeliveryMethod = 'pickup' | 'address';
type DeliverySpeed = 'standard' | 'weekend';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, totalAmount, clearCart } = useCart();
  const { user, session } = useAuth();

  // Delivery state
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [pickupStation, setPickupStation] = useState<PickupStation | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [addressDeliveryFee, setAddressDeliveryFee] = useState<number | null>(null);
  const [addressLat, setAddressLat] = useState<number | null>(null);
  const [addressLng, setAddressLng] = useState<number | null>(null);
  const [deliverySpeed, setDeliverySpeed] = useState<DeliverySpeed | null>(null);
  const [isZone1, setIsZone1] = useState<boolean>(false);

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

  // Determine order type: 'bundle' if coming from gifting page, else 'shop'
  const orderType = searchParams.get('source') === 'gifting' ? 'bundle' : 'shop';
  const bundleId = searchParams.get('bundleId');

  // Redirect to catalogue if cart is empty (but not when showing payment/success screens)
  useEffect(() => {
    if (items.length === 0 && !showPayment && !showSuccess) {
      navigate('/catalogue');
    }
  }, [items.length, navigate, showPayment, showSuccess]);

  // Delivery fee — dynamic based on address zone and delivery speed
  const deliveryFee = (() => {
    if (deliveryMethod === 'pickup') return 0;
    if (deliveryMethod === 'address' && deliverySpeed) {
      if (deliverySpeed === 'standard') {
        return addressDeliveryFee ?? 0;
      }
      // Weekend delivery: FREE for zone 1 only (not available for other zones yet)
      if (deliverySpeed === 'weekend') {
        return isZone1 ? 0 : 0; // FREE for Zone 1, unavailable for others (should not reach here)
      }
    }
    return 0;
  })();
  const grandTotal = totalAmount + deliveryFee;

  // Validation
  const isContactValid = fullName.trim().length >= 2 && phoneNumber.trim().length >= 10;
  const hasDeliveryDetails = deliveryMethod === 'pickup' ? !!pickupStation : (!!address && !!deliverySpeed);
  const canProceed = deliveryMethod && isContactValid && hasDeliveryDetails;

  // Scroll to contact form when delivery details are confirmed
  useEffect(() => {
    if (hasDeliveryDetails && contactRef.current) {
      setTimeout(() => {
        contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [hasDeliveryDetails]);

  // Delivery Handlers
  const handleMethodChange = () => {
    setDeliveryMethod(null);
    setPickupStation(null);
    setAddress(null);
    setAddressDeliveryFee(null);
    setAddressLat(null);
    setAddressLng(null);
    setDeliverySpeed(null);
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
  };

  const handleSpeedChange = () => {
    setDeliverySpeed(null);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleProceedToPayment = async () => {
    if (!session?.access_token) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const orderItems = items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        isAutoRenew: item.isAutoRenew ?? false,
        frequencyWeeks: item.isAutoRenew ? (item.frequencyWeeks ?? null) : null,
      }));

      const result = await api.createOrder(
        {
          orderType: orderType as 'shop' | 'bundle',
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          deliveryMethod: deliveryMethod!,
          deliverySpeed: deliveryMethod === 'address' ? (deliverySpeed ?? undefined) : undefined,
          pickupStationId: deliveryMethod === 'pickup' ? pickupStation?.id ?? null : null,
          deliveryAddress: deliveryMethod === 'address' ? address : null,
          deliveryLat: deliveryMethod === 'address' && addressLat != null ? addressLat : undefined,
          deliveryLng: deliveryMethod === 'address' && addressLng != null ? addressLng : undefined,
          bundleId: bundleId ?? null,
          items: orderItems,
        },
        session.access_token,
      );

      setOrderNumber(result.orderNumber);
      setServerTotalAmount(result.totalAmount);
      clearCart(); // Clear cart immediately after successful order creation
      setShowPayment(true);
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
                        // Determine if address is in Zone 1
                        setIsZone1(isZone1Address(lat, lng));
                      }}
                      onChangeAddress={handleAddressChange}
                    />
                  </div>
                )}

                {/* Delivery Speed (if address is set) */}
                {deliveryMethod === 'address' && address && (
                  <div className="mt-6 animate-fade-in">
                    <CheckoutDeliverySpeedSection
                      selectedSpeed={deliverySpeed}
                      onSelectSpeed={setDeliverySpeed}
                      onChangeSpeed={handleSpeedChange}
                      address={address}
                      standardDeliveryFee={addressDeliveryFee ?? 0}
                      isZone1={isZone1}
                    />
                  </div>
                )}

                {/* Contact Form - shows when station/address is selected */}
                {hasDeliveryDetails && (
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
            {/* Order summary */}
            <div className="bg-primary/5 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Products</span>
                <span className="font-medium">{formatPrice(totalAmount)}</span>
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
              disabled={!isContactValid || isSubmitting}
            >
              {isSubmitting ? 'Placing Order...' : 'Proceed to Payment'}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Checkout;
