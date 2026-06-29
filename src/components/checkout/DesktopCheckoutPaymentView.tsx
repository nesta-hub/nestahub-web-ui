import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Gift,
  Info,
  Loader2,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  api,
  formatPrice,
  getWalletSummary,
  validateGiftCard,
  applyGiftCardToOrder,
  applyWalletToOrder,
  removeWalletFromOrder,
  removeGiftCardFromOrder,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { type AppliedGiftCard } from "./ApplyCreditsDrawer";
import { cn } from "@/lib/utils";

interface SummaryLine {
  label: string;
  value: string;
}

interface DesktopCheckoutPaymentViewProps {
  orderId: string;
  totalAmount: number;
  onPaymentConfirmed: () => void;
  onGiftCardFullCoverage?: () => void;
  onBack: () => void;
  hideGiftCardRedeem?: boolean;
  title?: string;
  backLabel?: string;
  summaryLines?: SummaryLine[];
}

const CARD_CLASS =
  "rounded-[20px] bg-white ring-1 ring-foreground/[0.06] shadow-[0_1px_0_hsl(28_25%_25%/0.04),0_12px_28px_-18px_hsl(28_25%_25%/0.35)]";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="block uppercase tracking-[0.18em] text-[10px] text-muted-foreground mb-1">
      {children}
    </span>
  );
}

export function DesktopCheckoutPaymentView({
  orderId,
  totalAmount,
  onPaymentConfirmed,
  onGiftCardFullCoverage,
  onBack,
  hideGiftCardRedeem,
  title = "Complete payment",
  backLabel = "Back to review",
}: DesktopCheckoutPaymentViewProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [appliedGiftCard, setAppliedGiftCard] = useState<AppliedGiftCard | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const { session } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  useEffect(() => {
    if (!session?.access_token) return;
    getWalletSummary(session.access_token)
      .then((s) => setWalletBalance(s.balance))
      .catch(() => {});
  }, [session?.access_token]);

  const [walletEnabled, setWalletEnabled] = useState(false);
  const [walletApplied, setWalletApplied] = useState<number>(0);

  const giftCardAmount = appliedGiftCard?.amountApplied ?? 0;
  const afterGiftCard = Math.max(0, totalAmount - giftCardAmount);
  const effectiveWalletApplied = walletEnabled
    ? Math.min(walletApplied || Math.min(walletBalance, afterGiftCard), walletBalance, afterGiftCard)
    : 0;

  const adjustedTotal = Math.max(0, afterGiftCard - effectiveWalletApplied);
  const isFullCoverage = adjustedTotal === 0;
const walletAvailable = walletBalance >= 50;
  const giftAvailable = !hideGiftCardRedeem;
  const walletIsApplied = walletEnabled && effectiveWalletApplied > 0;
  const giftIsApplied = !!appliedGiftCard;
  const showMethodsBlock = walletAvailable || giftAvailable || walletIsApplied || giftIsApplied;

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

  const handleConfirm = async (full: boolean) => {
    if (full) {
      onGiftCardFullCoverage?.();
      return;
    }
    setIsConfirming(true);
    try {
      await api.markPaymentMade(orderId, session?.access_token ?? "");
    } catch {
      // best-effort — still proceed to success
    } finally {
      setIsConfirming(false);
    }
    onPaymentConfirmed();
  };

  // ===== Wallet popover state =====
  const [walletPopoverOpen, setWalletPopoverOpen] = useState(false);
  const walletMax = Math.min(walletBalance, walletIsApplied ? afterGiftCard + effectiveWalletApplied : afterGiftCard);
  const [walletDraft, setWalletDraft] = useState<number>(0);
  const [walletCommitting, setWalletCommitting] = useState(false);
  const [walletCommitError, setWalletCommitError] = useState<string | null>(null);
  useEffect(() => {
    if (walletPopoverOpen) {
      setWalletDraft(walletIsApplied ? effectiveWalletApplied : Math.max(50, Math.min(walletMax, afterGiftCard)));
      setWalletCommitError(null);
    }
  }, [walletPopoverOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitWallet = async () => {
    const capped = Math.min(Math.max(walletDraft, 0), walletMax);
    if (capped <= 0) {
      await removeWallet();
      return;
    }
    setWalletCommitting(true);
    setWalletCommitError(null);
    try {
      const result = await applyWalletToOrder(orderId, capped, session?.access_token ?? "");
      setWalletEnabled(true);
      setWalletApplied(result.amountApplied);
      setWalletBalance(result.walletBalance);
      setWalletPopoverOpen(false);
    } catch (err) {
      setWalletCommitError(err instanceof Error ? err.message : "Failed to apply wallet credit");
    } finally {
      setWalletCommitting(false);
    }
  };

  const removeWallet = async () => {
    try {
      await removeWalletFromOrder(orderId, session?.access_token ?? "");
    } catch {
      // best-effort
    }
    setWalletEnabled(false);
    setWalletApplied(0);
    setWalletPopoverOpen(false);
  };

  // ===== Gift card popover state =====
  const [giftPopoverOpen, setGiftPopoverOpen] = useState(false);
  const [giftCode, setGiftCode] = useState("");
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftError, setGiftError] = useState<string | null>(null);
  useEffect(() => {
    if (!giftPopoverOpen) {
      setGiftCode("");
      setGiftLoading(false);
      setGiftError(null);
    }
  }, [giftPopoverOpen]);

  const handleApplyGift = async () => {
    setGiftError(null);
    setGiftLoading(true);
    try {
      const trimmed = giftCode.trim().toUpperCase();
      const validation = await validateGiftCard(trimmed);
      if (!validation.valid) {
        const msgs: Record<string, string> = {
          not_found: "Gift card not found",
          expired: "Gift card has expired",
          exhausted: "Gift card has no remaining balance",
          void: "Gift card has been voided",
        };
        setGiftError(msgs[validation.reason ?? ""] ?? "Invalid gift card");
        return;
      }
      const result = await applyGiftCardToOrder(orderId, trimmed, session?.access_token ?? "");
      setAppliedGiftCard({ code: trimmed, balance: result.balance, amountApplied: result.amountApplied });
      setGiftPopoverOpen(false);
    } catch (err) {
      setGiftError(err instanceof Error ? err.message : "Failed to apply gift card. Please try again.");
    } finally {
      setGiftLoading(false);
    }
  };

  // ===== Method tiles =====
  const WalletTile = walletAvailable || walletIsApplied ? (
    <Popover open={walletPopoverOpen} onOpenChange={setWalletPopoverOpen}>
      <div
        className={cn(
          "rounded-2xl ring-1 px-4 py-4 transition-colors",
          walletIsApplied
            ? "bg-primary/5 ring-primary/30"
            : "bg-[hsl(28,25%,97%)] ring-foreground/[0.06] hover:bg-[hsl(28,25%,95%)]",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Wallet className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground">Wallet credit</p>
              {walletIsApplied && <Check className="w-3.5 h-3.5 text-primary" />}
            </div>
            {walletIsApplied ? (
              <p className="text-xs text-primary mt-0.5 tabular-nums">
                −{formatPrice(effectiveWalletApplied)} applied
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                Balance {formatPrice(walletBalance)}
              </p>
            )}
          </div>
          {walletIsApplied ? (
            <div className="flex items-center gap-1 shrink-0">
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  Edit
                </Button>
              </PopoverTrigger>
              <button
                type="button"
                onClick={removeWallet}
                className="p-1.5 rounded-md hover:bg-primary/10 transition-colors"
                aria-label="Remove wallet credit"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 px-3 text-xs shrink-0">
                Apply
              </Button>
            </PopoverTrigger>
          )}
        </div>
      </div>
      <PopoverContent align="end" className="w-72 p-4 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Apply from wallet</p>
          <p className="font-display text-2xl font-bold text-foreground tabular-nums mt-1">
            {formatPrice(walletDraft)}
          </p>
        </div>
        <Slider
          value={[walletDraft]}
          min={0}
          max={Math.max(0, walletMax)}
          step={50}
          onValueChange={([v]) => setWalletDraft(v)}
        />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>₦0</span>
          <span>Max {formatPrice(walletMax)}</span>
        </div>
        <Input
          type="number"
          value={walletDraft ? walletDraft / 100 : ""}
          onChange={(e) => setWalletDraft(Math.round((Number(e.target.value) || 0) * 100))}
          placeholder="Enter amount (₦)"
          className="h-9"
        />
        {walletCommitError && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            {walletCommitError}
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setWalletPopoverOpen(false)} disabled={walletCommitting}>
            Cancel
          </Button>
          <Button variant="shop" size="sm" className="flex-1" onClick={commitWallet} disabled={walletCommitting}>
            {walletCommitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : walletIsApplied ? "Update" : "Apply"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  ) : null;

  const GiftTile = giftAvailable || giftIsApplied ? (
    <Popover open={giftPopoverOpen} onOpenChange={setGiftPopoverOpen}>
      <div
        className={cn(
          "rounded-2xl ring-1 px-4 py-4 transition-colors",
          giftIsApplied
            ? "bg-emerald-50 ring-emerald-200"
            : "bg-[hsl(28,25%,97%)] ring-foreground/[0.06] hover:bg-[hsl(28,25%,95%)]",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              giftIsApplied ? "bg-emerald-100 text-emerald-700" : "bg-emerald-50 text-emerald-700",
            )}
          >
            <Gift className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground">Gift card</p>
              {giftIsApplied && <Check className="w-3.5 h-3.5 text-emerald-700" />}
            </div>
            {giftIsApplied ? (
              <p className="text-xs text-emerald-700 mt-0.5 tabular-nums">
                −{formatPrice(giftCardAmount)} applied
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">Redeem a code</p>
            )}
          </div>
          {giftIsApplied ? (
            <button
              type="button"
              onClick={async () => {
                try {
                  await removeGiftCardFromOrder(orderId, session?.access_token ?? "");
                } catch { /* best-effort */ }
                setAppliedGiftCard(null);
              }}
              className="p-1.5 rounded-md hover:bg-emerald-100 transition-colors shrink-0"
              aria-label="Remove gift card"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          ) : (
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 px-3 text-xs shrink-0">
                Redeem
              </Button>
            </PopoverTrigger>
          )}
        </div>
      </div>
      <PopoverContent align="end" className="w-72 p-4 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Gift card code</p>
          <p className="text-xs text-muted-foreground mt-1">Enter the code from your gift card.</p>
        </div>
        <Input
          value={giftCode}
          onChange={(e) => {
            setGiftCode(e.target.value);
            if (giftError) setGiftError(null);
          }}
          placeholder="e.g. NESTA-XXXX-XXXX"
          className={cn("h-9 font-mono tracking-wider", giftError && "border-destructive")}
          autoFocus
        />
        {giftError && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <XCircle className="w-3.5 h-3.5" />
            {giftError}
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setGiftPopoverOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="shop"
            size="sm"
            className="flex-1"
            onClick={handleApplyGift}
            disabled={giftLoading || giftCode.trim().length < 4}
          >
            {giftLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  ) : null;

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Top strip */}
      <div className="border-b border-foreground/[0.06] bg-background/70 backdrop-blur-xl sticky top-0 z-30">
        <div className="container relative flex items-center h-16">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {backLabel}
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-display text-base font-bold text-foreground tracking-[-0.01em]">
            {title}
          </h1>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative bg-[radial-gradient(1200px_600px_at_20%_-10%,hsl(28,32%,90%/0.6),transparent_60%)]">
        <div className="container py-10">
          <div className="max-w-[600px] mx-auto">
            <div className={cn(CARD_CLASS, "p-6 space-y-6")}>

              {/* ORDER ID header row */}
              <div className="flex items-center justify-between gap-3">
                <Eyebrow>Order ID</Eyebrow>
                <button
                  type="button"
                  onClick={() => handleCopy(orderId, "orderId")}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:opacity-80 -mt-1"
                >
                  {orderId}
                  {copied === "orderId" ? (
                    <Check className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="h-px bg-foreground/[0.06]" />

              {/* AMOUNT TO PAY / YOU'RE ALL COVERED */}
              {isFullCoverage ? (
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="font-display text-lg font-semibold text-foreground tracking-[-0.01em]">
                    You're all covered
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    {walletIsApplied && (
                      <div className="inline-flex items-center gap-1.5 bg-primary/5 text-primary rounded-full px-3 py-1 text-xs font-semibold">
                        <Check className="w-3 h-3" />
                        −{formatPrice(effectiveWalletApplied)} wallet applied
                      </div>
                    )}
                    {giftIsApplied && (
                      <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-semibold">
                        <Check className="w-3 h-3" />
                        −{formatPrice(giftCardAmount)} gift card applied
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your credits cover the full order. No bank transfer needed.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Eyebrow>Amount to pay</Eyebrow>
                  <span className="font-display text-4xl font-bold text-foreground tabular-nums tracking-[-0.02em]">
                    {formatPrice(adjustedTotal)}
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    {walletIsApplied && (
                      <div className="inline-flex items-center gap-1.5 bg-primary/5 text-primary rounded-full px-3 py-1 text-xs font-semibold">
                        <Check className="w-3 h-3" />
                        −{formatPrice(effectiveWalletApplied)} wallet applied
                      </div>
                    )}
                    {giftIsApplied && (
                      <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-semibold">
                        <Check className="w-3 h-3" />
                        −{formatPrice(giftCardAmount)} gift card applied
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="h-px bg-foreground/[0.06]" />

              {/* Bank transfer section */}
              {!isFullCoverage ? (
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-semibold">
                    Bank transfer details
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {/* Bank */}
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-[hsl(28,25%,97%)] ring-1 ring-foreground/[0.05] px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Bank</p>
                        <p className="text-sm font-medium text-foreground mt-0.5">{bankDetails.bank}</p>
                      </div>
                    </div>

                    {/* Account number */}
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-[hsl(28,25%,97%)] ring-1 ring-foreground/[0.05] px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Account number</p>
                        <p className="font-display text-2xl font-bold text-foreground tabular-nums tracking-wide mt-1">
                          {bankDetails.accountNumber}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(bankDetails.accountNumber, "account")}
                        className="shrink-0 gap-1.5"
                      >
                        {copied === "account" ? (
                          <><Check className="w-4 h-4 text-primary" /> Copied</>
                        ) : (
                          <><Copy className="w-4 h-4" /> Copy</>
                        )}
                      </Button>
                    </div>

                    {/* Account name */}
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-[hsl(28,25%,97%)] ring-1 ring-foreground/[0.05] px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Account name</p>
                        <p className="text-sm font-medium text-foreground mt-0.5">{bankDetails.accountName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Narration */}
                  <div className="flex items-start gap-3 rounded-xl bg-[hsl(28,32%,93%)] px-4 py-3">
                    <Info className="w-4 h-4 text-foreground/70 mt-0.5 shrink-0" />
                    <div className="text-xs text-foreground/80 leading-relaxed">
                      Include your Order ID{" "}
                      <button
                        type="button"
                        onClick={() => handleCopy(orderId, "narration")}
                        className="inline-flex items-center gap-1 font-semibold text-foreground hover:underline"
                      >
                        {orderId}
                        {copied === "narration" ? (
                          <Check className="w-3 h-3 text-primary" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>{" "}
                      in the transfer narration so we can match your payment.
                    </div>
                  </div>
                </div>
              ) : null}

              {/* OTHER PAYMENT METHODS */}
              {showMethodsBlock && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="uppercase tracking-[0.14em] text-[10px] font-semibold text-muted-foreground">
                        Other payment methods
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 rounded-full bg-foreground/[0.04] px-2 py-0.5">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Stack with your transfer to reduce the amount you pay.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {WalletTile}
                      {GiftTile}
                    </div>
                  </div>
                </>
              )}

              <div className="h-px bg-foreground/[0.06]" />

              {/* CTA */}
              <div className="space-y-2">
                {isFullCoverage ? (
                  <Button
                    variant="shop"
                    className="w-full h-12 text-base font-semibold"
                    onClick={() => handleConfirm(true)}
                  >
                    Place order
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="shop"
                      className="w-full h-12 text-base font-semibold"
                      onClick={() => handleConfirm(false)}
                      disabled={isConfirming}
                    >
                      {isConfirming ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirming…</>
                      ) : (
                        "Payment made"
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Click "Payment made" once your transfer is completed.
                    </p>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
