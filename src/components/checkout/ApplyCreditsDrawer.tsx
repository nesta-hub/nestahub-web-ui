import { useEffect, useState } from 'react';
import { Wallet, Gift, Loader2, CheckCircle, XCircle, X, ArrowLeft, ChevronRight } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateGiftCard } from '@/lib/api';
import { formatKobo } from '@/utils/wallet';
import { cn } from '@/lib/utils';

export interface AppliedGiftCard {
  code: string;
  balance: number;
  amountApplied: number;
}

interface ApplyCreditsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderTotal: number;
  walletBalance: number;
  walletApplied: number;
  appliedGiftCard: AppliedGiftCard | null;
  minRedemption?: number;
  onApplyWallet: (amountKobo: number) => Promise<void>;
  onRemoveWallet: () => Promise<void>;
  onApplyGiftCard: (code: string, balance: number, amountApplied: number) => Promise<void>;
  onRemoveGiftCard: () => Promise<void>;
  hideGiftCard?: boolean;
}

type View = 'picker' | 'wallet' | 'gift';

export function ApplyCreditsDrawer({
  open,
  onOpenChange,
  orderTotal,
  walletBalance,
  walletApplied,
  appliedGiftCard,
  minRedemption = 5000,
  onApplyWallet,
  onRemoveWallet,
  onApplyGiftCard,
  onRemoveGiftCard,
  hideGiftCard,
}: ApplyCreditsDrawerProps) {
  const showWallet = walletBalance >= minRedemption;

  const [view, setView] = useState<View>('picker');
  const [walletAmount, setWalletAmount] = useState<string>('');
  const [walletError, setWalletError] = useState<string>('');
  const [walletApplying, setWalletApplying] = useState(false);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [appliedFlash, setAppliedFlash] = useState(false);

  useEffect(() => {
    if (!open) {
      setView('picker');
      setWalletAmount('');
      setWalletError('');
      setWalletApplying(false);
      setCode('');
      setLoading(false);
      setError(false);
      setErrorMessage('');
      setAppliedFlash(false);
    }
  }, [open]);

  const giftCardAmount = appliedGiftCard?.amountApplied ?? 0;
  const afterGiftCard = Math.max(0, orderTotal - giftCardAmount);
  const effectiveWalletApplied = Math.min(walletApplied, walletBalance, afterGiftCard);
  const remaining = Math.max(0, afterGiftCard - effectiveWalletApplied);
  const maxWalletApplicable = Math.min(walletBalance, afterGiftCard);

  const parsedWalletKobo = (() => {
    const n = Number(walletAmount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 100);
  })();

  const handleApplyWallet = async () => {
    setWalletError('');
    if (parsedWalletKobo <= 0) return;
    if (parsedWalletKobo < minRedemption) {
      setWalletError(`Minimum redemption is ${formatKobo(minRedemption)}`);
      return;
    }
    if (parsedWalletKobo > maxWalletApplicable) {
      setWalletError(`Maximum you can apply is ${formatKobo(maxWalletApplicable)}`);
      return;
    }
    setWalletApplying(true);
    try {
      await onApplyWallet(parsedWalletKobo);
      setWalletAmount('');
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : 'Failed to apply wallet credit');
    } finally {
      setWalletApplying(false);
    }
  };

  const handleClearWallet = async () => {
    try {
      await onRemoveWallet();
    } catch {
      /* ignore */
    }
    setWalletAmount('');
    setWalletError('');
  };

  const handleApplyGiftCard = async () => {
    setError(false);
    setErrorMessage('');
    setAppliedFlash(false);
    setLoading(true);
    try {
      const validation = await validateGiftCard(code.trim().toUpperCase());
      setLoading(false);
      if (!validation.valid) {
        setError(true);
        if (validation.reason === 'not_found') setErrorMessage('Gift card not found');
        else if (validation.reason === 'expired') setErrorMessage('Gift card has expired');
        else if (validation.reason === 'exhausted') setErrorMessage('Gift card has no remaining balance');
        else if (validation.reason === 'void') setErrorMessage('Gift card has been voided');
        else setErrorMessage('Invalid gift card');
        return;
      }
      setAppliedFlash(true);
      const amountApplied = Math.min(validation.currentBalance, orderTotal);
      setTimeout(async () => {
        try {
          await onApplyGiftCard(code.trim().toUpperCase(), validation.currentBalance, amountApplied);
          setCode('');
          setAppliedFlash(false);
        } catch (applyErr) {
          setAppliedFlash(false);
          setError(true);
          setErrorMessage(applyErr instanceof Error ? applyErr.message : 'Failed to apply gift card. Please try again.');
        }
      }, 500);
    } catch (err) {
      setLoading(false);
      setError(true);
      setErrorMessage('Failed to validate gift card. Please try again.');
    }
  };

  const title =
    view === 'picker' ? 'Apply other payment methods' : view === 'wallet' ? 'Nesta Wallet' : 'Gift card';
  const description =
    view === 'picker'
      ? 'Choose a method to apply toward this order'
      : view === 'wallet'
      ? 'Use your wallet balance'
      : 'Redeem a gift card code';

  const Summary = (
    <div className="rounded-xl bg-muted/50 p-4 space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Order total</span>
        <span className="font-medium">{formatKobo(orderTotal)}</span>
      </div>
      {giftCardAmount > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Gift card</span>
          <span className="text-emerald-700">−{formatKobo(giftCardAmount)}</span>
        </div>
      )}
      {effectiveWalletApplied > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Wallet</span>
          <span className="text-primary">−{formatKobo(effectiveWalletApplied)}</span>
        </div>
      )}
      <div className="flex items-center justify-between pt-1.5 border-t border-border">
        <span className={cn('text-sm font-semibold')}>After credits</span>
        <span className="text-base font-bold text-primary">{formatKobo(remaining)}</span>
      </div>
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88vh]">
        <DrawerHeader>
          <div className="flex items-center gap-2">
            {view !== 'picker' && (
              <button
                type="button"
                onClick={() => setView('picker')}
                className="p-1 -ml-1 rounded hover:bg-muted transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            <div className="flex-1 text-left">
              <DrawerTitle>{title}</DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-5 overflow-y-auto">
          {view === 'picker' && (
            <div className="rounded-xl border divide-y overflow-hidden">
              {showWallet && (
                <button
                  type="button"
                  onClick={() => setView('wallet')}
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Nesta Wallet</p>
                    <p className="text-xs text-muted-foreground">
                      Balance {formatKobo(walletBalance)}
                      {effectiveWalletApplied > 0 && (
                        <span className="text-primary"> · Applied −{formatKobo(effectiveWalletApplied)}</span>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              )}
              {!hideGiftCard && (
                <button
                  type="button"
                  onClick={() => setView('gift')}
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Gift card</p>
                    <p className="text-xs text-muted-foreground">
                      {appliedGiftCard
                        ? `Applied −${formatKobo(appliedGiftCard.amountApplied)}`
                        : 'Redeem a code'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              )}
            </div>
          )}

          {view === 'wallet' && showWallet && (
            <section className="rounded-xl border p-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Nesta Wallet</p>
                  <p className="text-xs text-muted-foreground">
                    {effectiveWalletApplied > 0
                      ? `Applied −${formatKobo(effectiveWalletApplied)}`
                      : `${formatKobo(walletBalance)} available`}
                  </p>
                </div>
                {effectiveWalletApplied > 0 && (
                  <button
                    type="button"
                    onClick={handleClearWallet}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    aria-label="Remove wallet credit"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {effectiveWalletApplied === 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="Enter amount"
                      value={walletAmount}
                      onChange={(e) => {
                        setWalletAmount(e.target.value);
                        setWalletError('');
                      }}
                      className="h-10 text-base"
                      max={maxWalletApplicable / 100}
                      disabled={walletApplying}
                    />
                    <Button
                      variant="shop"
                      onClick={handleApplyWallet}
                      disabled={walletApplying || parsedWalletKobo <= 0}
                      className="shrink-0 h-10"
                    >
                      {walletApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Min {formatKobo(minRedemption)} · Max {formatKobo(maxWalletApplicable)}
                  </p>
                  {walletError && (
                    <div className="flex items-center gap-2 text-xs text-destructive animate-fade-in">
                      <XCircle className="w-3.5 h-3.5" />
                      {walletError}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {view === 'gift' && (
            <section className="rounded-xl border p-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Gift card</p>
                  <p className="text-xs text-muted-foreground">
                    {appliedGiftCard ? `Applied −${formatKobo(appliedGiftCard.amountApplied)}` : 'Enter your code'}
                  </p>
                </div>
                {appliedGiftCard && (
                  <button
                    type="button"
                    onClick={onRemoveGiftCard}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    aria-label="Remove gift card"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {!appliedGiftCard && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter gift code"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setError(false);
                        setErrorMessage('');
                      }}
                      className="uppercase tracking-wider h-10 text-base"
                      disabled={loading}
                    />
                    <Button
                      variant="shop"
                      onClick={handleApplyGiftCard}
                      disabled={loading || code.trim().length === 0}
                      className="shrink-0 h-10"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-xs text-destructive animate-fade-in">
                      <XCircle className="w-3.5 h-3.5" />
                      {errorMessage || 'Invalid or expired gift code'}
                    </div>
                  )}
                  {appliedFlash && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 animate-fade-in">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="font-medium">Applied!</span>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {view !== 'picker' && Summary}
        </div>

        <div className="p-4 border-t bg-background">
          <Button
            variant="shop"
            className="w-full h-11 text-base font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
