import { Copy, Check, ArrowLeft, Gift, ChevronRight, X, Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice, api, applyGiftCardToOrder, removeGiftCardFromOrder } from "@/lib/api";
import { GiftCardRedeemDrawer } from "./GiftCardRedeemDrawer";

interface CheckoutPaymentViewProps {
  orderId: string;
  totalAmount: number;
  token: string;
  onPaymentConfirmed: () => void;
  onGiftCardFullCoverage?: () => void;
  onBack: () => void;
  hideGiftCardRedeem?: boolean;
}

export function CheckoutPaymentView({
  orderId,
  totalAmount,
  token,
  onPaymentConfirmed,
  onGiftCardFullCoverage,
  onBack,
  hideGiftCardRedeem,
}: CheckoutPaymentViewProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [giftCardDrawerOpen, setGiftCardDrawerOpen] = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    code: string;
    balance: number;
    amountApplied: number;
  } | null>(null);

  const adjustedTotal = appliedGiftCard
    ? Math.max(0, totalAmount - appliedGiftCard.amountApplied)
    : totalAmount;

  const isFullCoverage = adjustedTotal === 0;

  const bankDetails = {
    bank: "Moniepoint MFB",
    accountNumber: "4005050638",
    accountName: "Nesta Hub",
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePaymentMade = async () => {
    setIsConfirming(true);
    setConfirmError(null);
    try {
      await api.markPaymentMade(orderId, token);
      onPaymentConfirmed();
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Failed to confirm payment. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRemoveGiftCard = async () => {
    try {
      await removeGiftCardFromOrder(orderId, token);
      setAppliedGiftCard(null);
    } catch (err) {
      console.error('Failed to remove gift card:', err);
      // Still clear the UI even if API call fails
      setAppliedGiftCard(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
        <button type="button" onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-semibold text-lg">Complete Payment</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Order ID */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Order ID</p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-lg font-bold text-foreground">{orderId}</p>
            <button
              type="button"
              onClick={() => handleCopy(orderId, 'orderId')}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              {copied === 'orderId' ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
          {/* Info icon callout for narration instruction */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Include this Order ID in the transfer narration</span>
          </div>
        </div>

        {/* Total Amount */}
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-3xl font-bold text-primary">{formatPrice(adjustedTotal)}</p>
              <button
                type="button"
                onClick={() => handleCopy(adjustedTotal.toString(), 'amount')}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                {copied === 'amount' ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {appliedGiftCard && (
              <p className="text-xs text-emerald-600 mt-1">
                Gift card applied: −{formatPrice(appliedGiftCard.amountApplied)}
              </p>
            )}
          </div>
        </Card>

        {/* Gift card section — between amount and bank details */}
        {!hideGiftCardRedeem && (
          appliedGiftCard ? (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <Gift className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Gift card applied</span>
                <span className="text-muted-foreground">−{formatPrice(appliedGiftCard.amountApplied)}</span>
              </div>
              <button type="button" onClick={handleRemoveGiftCard} className="p-1 rounded hover:bg-emerald-100 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setGiftCardDrawerOpen(true)}
              className="w-full flex items-center justify-between rounded-lg border px-3 py-2.5 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm">
                <Gift className="w-4 h-4 text-muted-foreground" />
                <span>Have a gift card?</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )
        )}

        {/* Bank Details — hidden when fully covered */}
        {!isFullCoverage && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Bank Transfer Details
            </h3>

            <Card className="p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Bank</p>
                <p className="text-sm font-medium">{bankDetails.bank}</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="text-lg font-bold tracking-wide">{bankDetails.accountNumber}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(bankDetails.accountNumber, 'account')}
                  className="shrink-0"
                >
                  {copied === 'account' ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Account Name</p>
                <p className="text-sm font-medium">{bankDetails.accountName}</p>
              </div>
            </Card>
          </div>
        )}

        {isFullCoverage && (
          <Card className="p-4 text-center">
            <p className="text-sm text-foreground font-medium">
              Your gift card covers the full order. No bank transfer needed!
            </p>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-background shrink-0 space-y-2">
        {confirmError && (
          <p className="text-sm text-destructive text-center">{confirmError}</p>
        )}
        {isFullCoverage ? (
          <Button
            variant="shop"
            className="w-full h-12 text-base font-semibold"
            onClick={() => onGiftCardFullCoverage?.()}
            disabled={isConfirming}
          >
            {isConfirming ? 'Placing Order...' : 'Place Order'}
          </Button>
        ) : (
          <>
            <Button
              variant="shop"
              className="w-full h-12 text-base font-semibold"
              onClick={handlePaymentMade}
              disabled={isConfirming}
            >
              {isConfirming ? 'Confirming...' : 'Payment Made'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Click "Payment Made" once transfer is completed
            </p>
          </>
        )}
      </div>

      {/* Gift Card Drawer */}
      <GiftCardRedeemDrawer
        open={giftCardDrawerOpen}
        onOpenChange={setGiftCardDrawerOpen}
        orderTotal={totalAmount}
        onApply={async (code, balance, amountApplied) => {
          try {
            // Apply gift card to the order via API
            const response = await applyGiftCardToOrder(orderId, code, token);
            // Update local state with the server response
            setAppliedGiftCard({
              code: response.code,
              balance: response.balance,
              amountApplied: response.amountApplied,
            });
          } catch (err) {
            console.error('Failed to apply gift card:', err);
            throw err; // Re-throw so GiftCardRedeemDrawer can show error
          }
        }}
      />
    </div>
  );
}
