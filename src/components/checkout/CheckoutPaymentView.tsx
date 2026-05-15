import { Copy, Check, ArrowLeft, CreditCard, ChevronRight, Info } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatPrice, api, applyGiftCardToOrder, removeGiftCardFromOrder, applyWalletToOrder, removeWalletFromOrder } from '@/lib/api';
import { formatKobo } from '@/utils/wallet';
import { useAuth } from '@/contexts/AuthContext';
import { ApplyCreditsDrawer, type AppliedGiftCard } from './ApplyCreditsDrawer';

interface AppliedWallet {
  amountApplied: number;
}

interface CheckoutPaymentViewProps {
  orderId: string;
  totalAmount: number;
  token: string;
  walletBalance?: number;
  onPaymentConfirmed: () => void;
  onGiftCardFullCoverage?: () => void;
  onBack: () => void;
  hideGiftCardRedeem?: boolean;
}

function useCopyField() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

export function CheckoutPaymentView({
  orderId, totalAmount, token, walletBalance = 0,
  onPaymentConfirmed, onGiftCardFullCoverage, onBack, hideGiftCardRedeem,
}: CheckoutPaymentViewProps) {
  const { copied, copy } = useCopyField();
  const queryClient = useQueryClient();
  const { refreshWalletBalance } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [creditsDrawerOpen, setCreditsDrawerOpen] = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState<AppliedGiftCard | null>(null);
  const [appliedWallet, setAppliedWallet] = useState<AppliedWallet | null>(null);

  const refreshWalletData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallet-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] }),
      refreshWalletBalance(),
    ]);
  };

  const totalDiscount = (appliedGiftCard?.amountApplied ?? 0) + (appliedWallet?.amountApplied ?? 0);
  const adjustedTotal = Math.max(0, totalAmount - totalDiscount);
  const isFullCoverage = adjustedTotal === 0;

  const bankDetails = { bank: 'Moniepoint MFB', accountNumber: '4005050638', accountName: 'Nesta Hub' };

  const handlePaymentMade = async () => {
    setIsConfirming(true);
    setConfirmError(null);
    try {
      await api.markPaymentMade(orderId, token);
      // Wallet is debited inside markPaymentMade — refresh so the pill and wallet page reflect it.
      await refreshWalletData();
      onPaymentConfirmed();
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Failed to confirm payment. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRemoveGiftCard = async () => {
    try { await removeGiftCardFromOrder(orderId, token); } catch { /* ignore */ }
    setAppliedGiftCard(null);
  };

  const handleRemoveWallet = async () => {
    try { await removeWalletFromOrder(orderId, token); } catch { /* ignore */ }
    setAppliedWallet(null);
    await refreshWalletData();
  };

  const handleApplyGiftCard = async (code: string, balance: number, amountApplied: number) => {
    const response = await applyGiftCardToOrder(orderId, code, token);
    setAppliedGiftCard({ code: response.code, balance: response.balance, amountApplied: response.amountApplied });
  };

  const handleApplyWallet = async (amount: number) => {
    const response = await applyWalletToOrder(orderId, amount, token);
    setAppliedWallet({ amountApplied: response.amountApplied });
    await refreshWalletData();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
        <button type="button" onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-semibold text-lg">Complete Payment</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Order ID */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Order ID</p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-lg font-bold text-foreground">{orderId}</p>
            <button type="button" onClick={() => copy(orderId, 'orderId')} className="p-1 rounded hover:bg-muted transition-colors">
              {copied === 'orderId' ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Include this Order ID in the transfer narration</span>
          </div>
        </div>

        {/* Amount */}
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-3xl font-bold text-primary">{formatPrice(adjustedTotal)}</p>
              <button type="button" onClick={() => copy(adjustedTotal.toString(), 'amount')} className="p-1 rounded hover:bg-muted transition-colors">
                {copied === 'amount' ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
            {totalDiscount > 0 && (
              <p className="text-xs text-emerald-600 mt-1">−{formatKobo(totalDiscount)} applied</p>
            )}
          </div>
        </Card>

        {/* Apply other payment methods */}
        {(walletBalance > 0 || !hideGiftCardRedeem) && (
          <button
            type="button"
            onClick={() => setCreditsDrawerOpen(true)}
            className="w-full flex items-center justify-between rounded-xl border px-4 py-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-foreground">Apply other payment methods</p>
                <p className="text-xs text-muted-foreground truncate">
                  {totalDiscount > 0
                    ? `Applied −${formatKobo(totalDiscount)}`
                    : hideGiftCardRedeem
                    ? 'Wallet'
                    : walletBalance > 0
                    ? 'Wallet · Gift card'
                    : 'Gift card'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        )}

        {/* Bank details */}
        {!isFullCoverage && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Bank Transfer Details</h3>
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
                <Button variant="outline" size="sm" onClick={() => copy(bankDetails.accountNumber, 'account')} className="shrink-0">
                  {copied === 'account' ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
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
              Your credits cover the full order amount. No bank transfer needed!
            </p>
          </Card>
        )}
      </div>

      <div className="p-4 border-t bg-background shrink-0 space-y-2">
        {confirmError && <p className="text-sm text-destructive text-center">{confirmError}</p>}
        {isFullCoverage ? (
          <Button variant="shop" className="w-full h-12 text-base font-semibold" onClick={() => onGiftCardFullCoverage?.()} disabled={isConfirming}>
            {isConfirming ? 'Placing Order...' : 'Place Order'}
          </Button>
        ) : (
          <>
            <Button variant="shop" className="w-full h-12 text-base font-semibold" onClick={handlePaymentMade} disabled={isConfirming}>
              {isConfirming ? 'Confirming...' : 'Payment Made'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Click "Payment Made" once transfer is completed</p>
          </>
        )}
      </div>

      <ApplyCreditsDrawer
        open={creditsDrawerOpen}
        onOpenChange={setCreditsDrawerOpen}
        orderTotal={totalAmount}
        walletBalance={walletBalance}
        walletApplied={appliedWallet?.amountApplied ?? 0}
        appliedGiftCard={appliedGiftCard}
        onApplyWallet={handleApplyWallet}
        onRemoveWallet={handleRemoveWallet}
        onApplyGiftCard={handleApplyGiftCard}
        onRemoveGiftCard={handleRemoveGiftCard}
        hideGiftCard={hideGiftCardRedeem}
      />
    </div>
  );
}
