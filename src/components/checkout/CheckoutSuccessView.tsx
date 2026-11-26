import type { ReactNode } from "react";
import { Check, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CheckoutSuccessViewProps {
  orderId: string;
  paidWithGiftCard?: boolean;
  paymentOption?: string;
  /** How and when this order is being delivered. */
  deliverySummary?: string | null;
  /** Something to show under the message (the offer to subscribe, after a shop order). */
  afterContent?: ReactNode;
  /** The new Subscribe experience's look, with `afterContent` inside the same card as the message. Off: as before. */
  subscribeDesign?: boolean;
}

function message(paidWithGiftCard: boolean | undefined, paymentOption: string | undefined): string {
  if (paidWithGiftCard) return "Your order is confirmed! We'll send an email shortly with the details.";
  if (paymentOption === "pay-on-delivery") return "Your order has been placed. We'll prepare it and get it to you. Pay when it arrives.";
  return "We'll verify your payment and send a confirmation via Email. Please keep your phone handy!";
}

export function CheckoutSuccessView({ orderId, paidWithGiftCard, paymentOption, deliverySummary, afterContent, subscribeDesign }: CheckoutSuccessViewProps) {
  const navigate = useNavigate();

  const handleReturnShopping = () => {
    navigate("/catalogue");
  };

  if (subscribeDesign) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-shop-page text-shop-ink">
        <div className="min-h-0 flex-1 overflow-y-auto px-9 pb-4 pt-9">
          <div className="flex flex-col items-center text-center">
            <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DDE3DA] text-[#46564A]">
              <Check className="h-[30px] w-[30px]" strokeWidth={2.2} />
            </span>
            <h1 className="mt-3.5 text-[28px] font-extrabold leading-[34px] tracking-[-0.02em]">Order placed</h1>
            <p className="mt-1.5 text-[15px] leading-[22px] text-shop-muted">
              Order ID <b className="font-extrabold text-shop-ink">{orderId}</b>
            </p>
            {deliverySummary && (
              <p className="mt-0.5 text-[13.5px] leading-5 text-shop-muted" data-testid="delivery-summary">
                Delivery: {deliverySummary}
              </p>
            )}
          </div>

          {/* One card: the note about the order, then (when there is one) the Subscribe panel inside it. */}
          <section aria-label="What happens next" className="mt-10 overflow-hidden rounded-[22px] border border-shop-line bg-white/55">
            <p className="px-5 py-6 text-center text-[13.5px] leading-[21px] text-shop-muted">{message(paidWithGiftCard, paymentOption)}</p>
            {afterContent}
          </section>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-shop-line bg-[rgba(251,249,246,0.96)] px-5 pb-4 pt-3">
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="flex h-[50px] w-full items-center justify-center rounded-[25px] border border-shop-line-soft bg-white text-[15px] font-extrabold text-shop-ink"
          >
            View Order Status
          </button>
          <button
            type="button"
            onClick={handleReturnShopping}
            className="flex h-[50px] w-full items-center justify-center rounded-[25px] bg-shop-cta text-[15px] font-extrabold text-shop-cream hover:bg-shop-cta-hover"
          >
            Return to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-6 text-center animate-fade-in">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Order Placed!
        </h1>

        {/* Order ID */}
        <p className={deliverySummary ? "text-muted-foreground mb-2" : "text-muted-foreground mb-6"}>
          Order ID: <span className="font-semibold text-foreground">{orderId}</span>
        </p>
        {deliverySummary && (
          <p className="text-sm text-muted-foreground mb-6" data-testid="delivery-summary">
            Delivery: {deliverySummary}
          </p>
        )}

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

        {afterContent && <div className="mt-6 w-full max-w-sm">{afterContent}</div>}
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
