import { useState, useEffect } from "react";
import { 
  type ConfiguredProduct, 
  type Stage,
  type DeliveryInfo,
  generateOrderId 
} from "@/data/bundleData";
import { AuthChoiceView } from "./AuthChoiceView";
import { DeliveryForm } from "./DeliveryForm";
import { PaymentView } from "./PaymentView";
import { OrderSuccess } from "./OrderSuccess";

type CheckoutStep = 'auth' | 'delivery' | 'payment' | 'success';

interface CheckoutViewProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
  orderType: 'subscribe' | 'one-time';
  products: ConfiguredProduct[] | null;
  categoryIds?: string[];
  stage: Stage | null;
  totalPrice: number;
}

export function CheckoutView({
  open,
  onClose,
  onComplete,
  orderType,
  products,
  categoryIds,
  stage,
  totalPrice
}: CheckoutViewProps) {
  const [step, setStep] = useState<CheckoutStep>('auth');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [orderId, setOrderId] = useState<string>('');

  // Reset step when view opens
  useEffect(() => {
    if (open) {
      setStep('auth');
      setOrderId(generateOrderId());
    }
  }, [open]);

  // Handle auth completion
  const handleAuthComplete = (loggedIn: boolean) => {
    setIsLoggedIn(loggedIn);
    setStep('delivery');
  };

  // Handle delivery form submission
  const handleDeliverySubmit = (info: DeliveryInfo) => {
    setDeliveryInfo(info);
    setStep('payment');
  };

  // Handle payment confirmation
  const handlePaymentMade = () => {
    setStep('success');
  };

  // Handle back navigation
  const handleBackFromDelivery = () => {
    setStep('auth');
  };

  const handleBackFromPayment = () => {
    setStep('delivery');
  };

  if (!open) return null;

  // Render current step
  const renderStep = () => {
    switch (step) {
      case 'auth':
        return (
          <AuthChoiceView 
            orderType={orderType} 
            onComplete={handleAuthComplete}
            onBack={onClose}
          />
        );
      case 'delivery':
        return (
          <DeliveryForm 
            onSubmit={handleDeliverySubmit}
            onBack={handleBackFromDelivery}
          />
        );
      case 'payment':
        return (
          <PaymentView 
            orderId={orderId}
            totalPrice={totalPrice}
            onPaymentMade={handlePaymentMade}
            onBack={handleBackFromPayment}
          />
        );
      case 'success':
        return (
          <OrderSuccess 
            orderId={orderId}
            onClose={() => onComplete?.()}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div key={step} className="animate-step-in flex-1 flex flex-col min-h-0">
        {renderStep()}
      </div>
    </div>
  );
}
