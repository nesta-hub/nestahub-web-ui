import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CheckoutSuccessViewProps {
  orderId: string;
  paidWithGiftCard?: boolean;
  paymentOption?: string;
}

export function CheckoutSuccessView({ orderId, paidWithGiftCard, paymentOption }: CheckoutSuccessViewProps) {
  const navigate = useNavigate();

  const handleReturnShopping = () => {
    navigate("/catalogue");
  };

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
          Order ID: <span className="font-semibold text-foreground">{orderId}</span>
        </p>

        {/* Confirmation message */}
        <Card className="p-4 bg-muted/50 max-w-sm">
          <p className="text-sm text-muted-foreground">
            {paidWithGiftCard
              ? "Your order is confirmed! We'll send an email shortly with the details."
              : paymentOption === "pay-on-delivery"
              ? "Your order has been placed! We'll prepare it and get it to you. Pay when it arrives."
              : "We'll verify your payment and send a confirmation via Email. Please keep your phone handy!"}
          </p>
        </Card>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-background shrink-0 space-y-2">
        <Button
          variant="outline"
          className="w-full h-12 text-base font-semibold"
          onClick={() => navigate("/orders")}
        >
          View Order Status
        </Button>
        <Button
          variant="shop"
          className="w-full h-12 text-base font-semibold"
          onClick={handleReturnShopping}
        >
          Return to Shop
        </Button>
      </div>
    </div>
  );
}
