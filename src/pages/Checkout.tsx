import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { generateOrderId, PickupStation } from "@/data/bundleData";
import {
  CheckoutDeliverySection,
  CheckoutPickupSection,
  CheckoutAddressSection,
  ContactForm,
  CheckoutPaymentView,
  CheckoutSuccessView,
  CheckoutOrderTypeSection,
  OrderTypeSummaryCard,
  AutoRenewConfigDrawer,
  AutoRenewExplainerDrawer,
} from "@/components/checkout";
import { SignInForm } from "@/components/auth/SignInForm";

type DeliveryMethod = 'pickup' | 'address';
type OrderType = 'one-off' | 'auto-renew';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFromGifting = searchParams.get('source') === 'gifting';
  const { items, totalAmount, setAllItemsAutoRenew } = useCart();
  const { user, loading: authLoading } = useAuth();

  // Order type state - skip if from gifting (default to one-off)
  const [orderType, setOrderType] = useState<OrderType | null>(isFromGifting ? 'one-off' : null);
  const [orderTypeConfirmed, setOrderTypeConfirmed] = useState(isFromGifting);
  const [isAutoRenewDrawerOpen, setIsAutoRenewDrawerOpen] = useState(false);
  const [isExplainerDrawerOpen, setIsExplainerDrawerOpen] = useState(false);

  // Delivery state
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [pickupStation, setPickupStation] = useState<PickupStation | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  // Contact state - used for BOTH flows - pre-fill from user if authenticated
  const [fullName, setFullName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');

  // View state
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId] = useState(() => generateOrderId());
  const contactRef = useRef<HTMLDivElement>(null);

  // Pre-fill contact info when user data loads
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

  // Redirect to catalogue if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/catalogue');
    }
  }, [items.length, navigate]);

  // Validation
  const isContactValid = fullName.trim().length >= 2 && phoneNumber.trim().length >= 10;
  const hasDeliveryDetails = deliveryMethod === 'pickup' ? !!pickupStation : !!address;
  const canProceed = orderTypeConfirmed && deliveryMethod && isContactValid && hasDeliveryDetails;

  // For gifting flow, skip order type UI entirely
  const showOrderTypeSection = !isFromGifting;

  // Scroll to contact form when delivery details are confirmed
  useEffect(() => {
    if (hasDeliveryDetails && contactRef.current) {
      setTimeout(() => {
        contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [hasDeliveryDetails]);

  // Order Type Handlers
  const handleSelectOneOff = () => {
    setOrderType('one-off');
    setAllItemsAutoRenew(false);
    setOrderTypeConfirmed(true);
  };

  const handleSelectAutoRenew = () => {
    // Set all items to auto-renew by default when opening drawer
    setAllItemsAutoRenew(true, 4);
    setIsAutoRenewDrawerOpen(true);
  };

  const handleAutoRenewSave = () => {
    setOrderType('auto-renew');
    setOrderTypeConfirmed(true);
  };

  const handleChangeOrderType = () => {
    setOrderType(null);
    setOrderTypeConfirmed(false);
  };

  // Delivery Handlers
  const handleMethodChange = () => {
    setDeliveryMethod(null);
    setPickupStation(null);
    setAddress(null);
  };

  const handleStationChange = () => {
    setPickupStation(null);
  };

  const handleAddressChange = () => {
    setAddress(null);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handlePaymentConfirmed = () => {
    setShowPayment(false);
    setShowSuccess(true);
  };

  // Payment overlay
  if (showPayment) {
    return (
      <CheckoutPaymentView
        orderId={orderId}
        totalAmount={totalAmount}
        onPaymentConfirmed={handlePaymentConfirmed}
        onBack={() => setShowPayment(false)}
      />
    );
  }

  // Success overlay
  if (showSuccess) {
    return <CheckoutSuccessView orderId={orderId} />;
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
          {/* Show loading while checking auth state */}
          {authLoading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !user ? (
            <div className="animate-fade-in">
              <SignInForm />
            </div>
          ) : (
            <>
              {/* Order Type Section - FIRST (hidden for gifting flow) */}
              {showOrderTypeSection && (
                <>
                  {!orderTypeConfirmed ? (
                    <div className="animate-fade-in">
                      <CheckoutOrderTypeSection
                        selectedType={orderType}
                        confirmed={orderTypeConfirmed}
                        onSelectOneOff={handleSelectOneOff}
                        onSelectAutoRenew={handleSelectAutoRenew}
                        onLearnMore={() => setIsExplainerDrawerOpen(true)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 animate-fade-in">
                      <h3 className="font-semibold text-foreground">Order Type</h3>
                      <OrderTypeSummaryCard
                        orderType={orderType!}
                        items={items}
                        onChangeOrderType={handleChangeOrderType}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Delivery sections - only show after order type is confirmed */}
              {orderTypeConfirmed && (
                <div className="animate-fade-in-up">
                  {showOrderTypeSection && <Separator className="mb-6" />}

                  {/* Delivery Method Section */}
                  <CheckoutDeliverySection
                    selectedMethod={deliveryMethod}
                    onSelectMethod={setDeliveryMethod}
                    onChangeMethod={handleMethodChange}
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
                        onSelectAddress={setAddress}
                        onChangeAddress={handleAddressChange}
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
              )}
            </>
          )}
        </div>

        {/* Footer with CTA */}
        {orderTypeConfirmed && hasDeliveryDetails && (
          <div className="p-4 border-t shrink-0 animate-fade-in">
            <Button
              variant="shop"
              className="w-full h-12 text-base font-semibold"
              onClick={() => setShowPayment(true)}
              disabled={!isContactValid}
            >
              Proceed to Payment
            </Button>
          </div>
        )}
      </div>

      {/* Auto-Renew Config Drawer */}
      <AutoRenewConfigDrawer
        open={isAutoRenewDrawerOpen}
        onOpenChange={setIsAutoRenewDrawerOpen}
        onSave={handleAutoRenewSave}
      />

      {/* Auto-Renew Explainer Drawer */}
      <AutoRenewExplainerDrawer
        open={isExplainerDrawerOpen}
        onOpenChange={setIsExplainerDrawerOpen}
      />
    </Layout>
  );
};

export default Checkout;
