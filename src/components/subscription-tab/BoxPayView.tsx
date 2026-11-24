import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, Info, X } from "lucide-react";
import { ApplyCreditsDrawer, type AppliedGiftCard } from "@/components/checkout/ApplyCreditsDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { api, applyGiftCardToOrder, applyWalletToOrder, removeGiftCardFromOrder, removeWalletFromOrder } from "@/lib/api";
import { metaPixel } from "@/lib/metaPixel";
import { describePlace, formatDay, type Box } from "@/lib/subscriptionBoxes";
import { formatKobo } from "@/utils/wallet";

const BANK = { bank: "Moniepoint MFB", accountNumber: "4005050638", accountName: "Nesta Hub" };
const CARD = "rounded-[24px] bg-white shadow-[0_12px_28px_-12px_rgba(51,38,28,0.22),0_2px_8px_rgba(51,38,28,0.05)]";
const FOOTER = "fixed inset-x-0 bottom-0 box-border border-t border-shop-line bg-[rgba(251,249,246,0.96)] px-5 pt-3 backdrop-blur-[14px]";
const BUTTON = "flex h-14 w-full items-center justify-center rounded-[28px] bg-shop-cta text-[15px] font-extrabold text-[#FBFAF8] hover:bg-shop-cta-hover disabled:opacity-60";

/** What she paid, for the screen after the button. */
interface Paid {
  covered: boolean;
  fromWallet: number;
  byTransfer: number;
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, field: string) => {
    void navigator.clipboard?.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

function CopyIcon({ done }: { done: boolean }) {
  return done ? <Check className="h-[17px] w-[17px] text-[#46564A]" strokeWidth={2.6} /> : <Copy className="h-[17px] w-[17px]" strokeWidth={2} />;
}

/**
 * Paying for a subscription order: the same steps as every order's pay screen (bank transfer, "Payment made",
 * wallet credit for someone signed in), drawn as the Subscribe design has it, then a screen that says what happens next.
 * Kept apart from the shared checkout pay screen so that screen stays exactly as it is for every other order.
 */
export function BoxPayView({
  box,
  orderNumber,
  totalKobo,
  token,
  walletBalance,
  allowGiftCard,
  onBack,
  onDone,
}: {
  box: Box;
  orderNumber: string;
  totalKobo: number;
  /** Her sign-in token, or "" for someone who opened a link (the order's own key is used then). */
  token: string;
  walletBalance: number;
  allowGiftCard: boolean;
  onBack: () => void;
  /** Back to the Subscription tab, after paying. */
  onDone: () => void;
}) {
  const { copied, copy } = useCopy();
  const queryClient = useQueryClient();
  const { refreshWalletBalance } = useAuth();
  const [wallet, setWallet] = useState(0);
  const [giftCard, setGiftCard] = useState<AppliedGiftCard | null>(null);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState<Paid | null>(null);

  const due = Math.max(0, totalKobo - wallet - (giftCard?.amountApplied ?? 0));
  const covered = due === 0;
  const canUseWallet = walletBalance > 0;

  const refreshWallet = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wallet-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] }),
      refreshWalletBalance(),
    ]);

  const applyWallet = async () => {
    setError(null);
    try {
      const amount = Math.min(walletBalance, totalKobo - (giftCard?.amountApplied ?? 0));
      const { amountApplied } = await applyWalletToOrder(orderNumber, amount, token);
      setWallet(amountApplied);
      await refreshWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not apply your wallet credit. Please try again.");
    }
  };

  const removeWallet = async () => {
    try {
      await removeWalletFromOrder(orderNumber, token);
    } catch {
      /* the credit is released when the order is paid or cancelled either way */
    }
    setWallet(0);
    await refreshWallet();
  };

  // It is this call that debits the wallet, redeems a gift card and tells us to look for her transfer.
  const markPaid = async () => {
    setWorking(true);
    setError(null);
    try {
      await api.markPaymentMade(orderNumber, token);
      if (!covered) metaPixel.purchase({ value: due / 100, currency: "NGN", order_id: orderNumber });
      await refreshWallet().catch(() => {});
      setPaid({ covered, fromWallet: wallet, byTransfer: due });
    } catch (err) {
      setError(err instanceof Error ? err.message : covered ? "We could not place your order. Please try again." : "We could not confirm your payment. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  const day = formatDay(box.deliveryDate);

  if (paid) {
    return (
      <div className="fixed inset-0 z-50 bg-shop-page text-shop-ink">
        <div className="absolute inset-x-0 bottom-[100px] top-0 overflow-y-auto">
          <div className="px-6 pt-[84px] text-center">
            <span aria-hidden="true" className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#DDE3DA] text-[#46564A]">
              <Check className="h-8 w-8" strokeWidth={2.2} />
            </span>
            <h1 className="mt-4 text-[28px] font-extrabold leading-[34px] tracking-[-0.02em]">{paid.covered ? "Order paid" : "Payment marked"}</h1>
            <p className="mx-auto mt-2 max-w-[300px] text-[14.5px] leading-[21px] text-[#5A4E44]">
              {paid.covered
                ? `Your wallet covered ${formatKobo(paid.fromWallet)}. Your order goes out ${day}.`
                : `We are matching your transfer of ${formatKobo(paid.byTransfer)}. We will start preparing your order as soon as it is confirmed.`}
            </p>
          </div>
          <dl className={`mx-5 mt-[26px] px-4 py-1 text-[14px] leading-5 ${CARD}`}>
            <Row label="Order ID" value={orderNumber} />
            <Row label="Delivery" value={`${day} · ${describePlace(box.delivery)}`} last={!paid.fromWallet && paid.covered} />
            {paid.fromWallet > 0 && <Row label="Paid from wallet" value={formatKobo(paid.fromWallet)} last={paid.covered} />}
            {!paid.covered && <Row label="Bank transfer" value={formatKobo(paid.byTransfer)} last />}
          </dl>
        </div>
        <div className={`${FOOTER} h-[100px]`}>
          <button type="button" onClick={onDone} className={BUTTON}>
            Back to Subscription
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-shop-page text-shop-ink">
      <div className="absolute inset-x-0 bottom-[118px] top-0 overflow-y-auto overflow-x-hidden">
        <div className="flex h-16 items-center gap-3 pl-3 pr-5 pt-3">
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_8px_18px_-10px_rgba(51,38,28,0.35),0_1px_4px_rgba(51,38,28,0.06)]"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </button>
          <h1 className="min-w-0 flex-1 text-[18px] font-extrabold leading-6 tracking-[-0.01em]">Complete payment</h1>
        </div>

        <div className="px-5 pt-[14px] text-center">
          <p className="text-[12px] font-bold leading-4 text-shop-muted">Order ID</p>
          <div className="flex items-center justify-center gap-0.5">
            <span className="text-[19px] font-extrabold leading-7 tracking-[0.02em]">{orderNumber}</span>
            <button type="button" aria-label="Copy order ID" onClick={() => copy(orderNumber, "order")} className="flex h-11 w-11 items-center justify-center text-shop-muted">
              <CopyIcon done={copied === "order"} />
            </button>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-[12.5px] leading-[17px] text-shop-muted">
            <Info className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            Include this Order ID in the transfer narration
          </p>
        </div>

        <section aria-label="Amount to pay" className={`mx-5 mt-[18px] px-4 pb-4 pt-[18px] text-center ${CARD}`}>
          <p className="text-[12px] font-bold leading-4 text-shop-muted">Amount to pay</p>
          <div className="flex items-center justify-center gap-0.5">
            <span className="text-[34px] font-extrabold leading-[44px] tracking-[-0.02em] tabular-nums">{formatKobo(due)}</span>
            {!covered && (
              <button type="button" aria-label="Copy amount" onClick={() => copy(String(due / 100), "amount")} className="flex h-11 w-11 items-center justify-center text-shop-muted">
                <CopyIcon done={copied === "amount"} />
              </button>
            )}
          </div>

          {wallet > 0 && (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-2xl bg-[#E8EDE5] pl-[14px] pr-1 text-left">
              <span className="text-[13px] font-bold leading-[18px] text-[#34443A]">Wallet credit applied: −{formatKobo(wallet)}</span>
              <button type="button" aria-label="Remove wallet credit" onClick={() => void removeWallet()} className="flex h-11 w-11 shrink-0 items-center justify-center text-[#34443A]">
                <X className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </div>
          )}
          {giftCard && (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-2xl bg-[#E8EDE5] pl-[14px] pr-1 text-left">
              <span className="text-[13px] font-bold leading-[18px] text-[#34443A]">Gift card applied: −{formatKobo(giftCard.amountApplied)}</span>
              <button
                type="button"
                aria-label="Remove gift card"
                onClick={() => {
                  void removeGiftCardFromOrder(orderNumber, token).catch(() => {});
                  setGiftCard(null);
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center text-[#34443A]"
              >
                <X className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </div>
          )}
          {canUseWallet && wallet === 0 && !covered && (
            <button
              type="button"
              onClick={() => void applyWallet()}
              className="mt-2 flex h-12 w-full items-center justify-between gap-2 rounded-2xl border border-[#E5E0DC] px-[14px] text-left text-[13.5px] font-extrabold text-shop-brown"
            >
              <span>Apply wallet credit</span>
              <span className="font-bold text-shop-muted">{formatKobo(walletBalance)}</span>
            </button>
          )}
          {allowGiftCard && !giftCard && !covered && (
            <button
              type="button"
              onClick={() => setCreditsOpen(true)}
              className="mt-2 flex h-12 w-full items-center rounded-2xl border border-[#E5E0DC] px-[14px] text-left text-[13.5px] font-extrabold text-shop-brown"
            >
              Use a gift card
            </button>
          )}
        </section>

        {covered ? (
          <div className="mx-5 mt-[22px] flex items-start gap-3 rounded-[24px] bg-[#DDE3DA] p-4">
            <span aria-hidden="true" className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-white text-[#46564A]">
              <Check className="h-[17px] w-[17px]" strokeWidth={2.4} />
            </span>
            <p className="text-[14px] leading-[21px] text-[#34443A]">
              <b className="font-extrabold text-shop-ink">{giftCard && !wallet ? "Your gift card covers the full order." : "Your wallet credit covers the full order."}</b> No bank transfer needed!
            </p>
          </div>
        ) : (
          <div className="mx-5 mt-[22px]">
            <p className="mb-2.5 text-[10.5px] font-semibold uppercase leading-[14px] tracking-[0.16em] text-shop-muted">Bank transfer details</p>
            <div className={`px-4 py-1 ${CARD}`}>
              <div className="border-b border-[#F0EBE5] py-3">
                <p className="text-[12px] leading-4 text-shop-muted">Bank</p>
                <p className="text-[15px] font-extrabold leading-[21px]">{BANK.bank}</p>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-[#F0EBE5] py-2.5">
                <div>
                  <p className="text-[12px] leading-4 text-shop-muted">Account number</p>
                  <p className="text-[21px] font-extrabold leading-7 tracking-[0.04em] tabular-nums">{BANK.accountNumber}</p>
                </div>
                <button
                  type="button"
                  aria-label="Copy account number"
                  onClick={() => copy(BANK.accountNumber, "account")}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-shop-line bg-white"
                >
                  <CopyIcon done={copied === "account"} />
                </button>
              </div>
              <div className="py-3">
                <p className="text-[12px] leading-4 text-shop-muted">Account name</p>
                <p className="text-[15px] font-extrabold leading-[21px]">{BANK.accountName}</p>
              </div>
            </div>
          </div>
        )}
        <div className="h-4" />
      </div>

      <div className={`${FOOTER} h-[118px]`}>
        {error && <p className="mb-1 text-center text-[12.5px] text-destructive">{error}</p>}
        <button type="button" onClick={() => void markPaid()} disabled={working} className={BUTTON}>
          {covered ? (working ? "Placing order…" : "Place order") : working ? "Confirming…" : "Payment made"}
        </button>
        {!covered && !error && <p className="mt-1.5 text-center text-[12.5px] leading-[17px] text-shop-muted">Tap "Payment made" once your transfer is complete.</p>}
      </div>

      {allowGiftCard && (
        <ApplyCreditsDrawer
          open={creditsOpen}
          onOpenChange={setCreditsOpen}
          orderTotal={totalKobo - wallet}
          walletBalance={0}
          walletApplied={0}
          appliedGiftCard={giftCard}
          onApplyWallet={async () => {}}
          onRemoveWallet={async () => {}}
          onApplyGiftCard={async (code, _balance, amountApplied) => {
            const response = await applyGiftCardToOrder(orderNumber, code, token);
            setGiftCard({ code: response.code, balance: response.balance, amountApplied });
          }}
          onRemoveGiftCard={async () => {
            await removeGiftCardFromOrder(orderNumber, token).catch(() => {});
            setGiftCard(null);
          }}
        />
      )}
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 py-3 ${last ? "" : "border-b border-[#F0EBE5]"}`}>
      <dt className="text-shop-muted">{label}</dt>
      <dd className="text-right font-extrabold">{value}</dd>
    </div>
  );
}
