import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
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
} from "@/components/checkout";
import { SignInForm } from "@/components/auth/SignInForm";

type DeliveryMethod = 'pickup' | 'address';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalAmount } = useCart();
  const { user, loading: authLoading } = useAuth();

  // Delivery state
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [pickupStation, setPickupStation] = useState<PickupStation | null>(null);
  const [address, setAddress] = useState<string | null>(null);

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
  const [orderId] = useState(() => generateOrderId());
  const contactRef = useRef<HTMLDivElement>(null);

  // Redirect to catalogue if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/catalogue');
    }
  }, [items.length, navigate]);

  // Validation
  const isContactValid = fullName.trim().length >= 2 && phoneNumber.trim().length >= 10;
  const hasDeliveryDetails = deliveryMethod === 'pickup' ? !!pickupStation : !!address;
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
            </>
          )}
        </div>

        {/* Footer with CTA */}
        {hasDeliveryDetails && (
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
    </Layout>
  );
};

export default Checkout;
