import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Check,
  Gift,
  Link2,
  Mail,
  MessageCircle,
  PenLine,
  Send,
  ShoppingBag,
  Sparkles,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GiftCardPreview } from "@/components/gifting/GiftCardPreview";
import { giftCardThemes, presetAmounts, type GiftCardTheme } from "@/components/gifting/GiftCardThemes";
import { formatPrice, createBulkGiftCardOrder } from "@/lib/api";
import type { ConfiguredGiftCard } from "@/pages/GiftCardDetailsV2";
import { DesktopCheckoutPaymentView } from "@/components/checkout/DesktopCheckoutPaymentView";
import { DesktopCheckoutSuccessView } from "@/components/checkout/DesktopCheckoutSuccessView";
import {
  PaymentCheckingView,
  PaymentOutcomeView,
} from "@/components/gifting/PaymentOutcomeView";
import { useOrderConfirmationPoll } from "@/hooks/useOrderConfirmationPoll";
import { resolveOutcomeCopy, type CtaAction } from "@/lib/giftOutcomeCopy";
import { CheckoutSignIn } from "@/components/checkout/CheckoutSignIn";

type DeliveryMethod = "link" | "email" | "whatsapp";
type StudioStep = "form" | "review" | "signin" | "payment" | "success";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 08012345678 / 8012345678 / +2348012345678 / 2348012345678 */
const nigerianPhoneRegex = /^(?:\+?234|0)?[789][01]\d{8}$/;
const MIN_AMOUNT_KOBO = 1_000_000; // ₦10,000
const PENDING_KEY = "pending_gift_card_purchase_v2";

export function DesktopGiftCardStudio() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const incomingAddedCards = (location.state as { addedCards?: ConfiguredGiftCard[] } | null)?.addedCards ?? [];

  const [step, setStep] = useState<StudioStep>("form");
  const [theme, setTheme] = useState<GiftCardTheme>(giftCardThemes[0]);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("link");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [addedCards, setAddedCards] = useState<ConfiguredGiftCard[]>(incomingAddedCards);
  const [orderId, setOrderId] = useState("");
  const [serverTotal, setServerTotal] = useState<number>(0);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  // Set when the buyer takes the guest route; mutually exclusive with session.
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const hasAutoPlaced = useRef(false);

  // After OAuth redirect, restore cards and auto-place order
  useEffect(() => {
    if (!session?.access_token || hasAutoPlaced.current) return;
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try {
      const { cards } = JSON.parse(raw) as { cards: ConfiguredGiftCard[] };
      if (cards?.length) {
        hasAutoPlaced.current = true;
        localStorage.removeItem(PENDING_KEY);
        setAddedCards(cards);
        placeOrders(cards, session.access_token);
      }
    } catch {
      localStorage.removeItem(PENDING_KEY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token]);

  const placeOrders = async (
    cards: ConfiguredGiftCard[],
    token?: string,
    guestEmailOverride?: string,
  ) => {
    const guest = guestEmailOverride ?? guestEmail;
    if (!token && !guest) return;
    setIsCreatingOrder(true);
    setStep("payment");
    try {
      const result = await createBulkGiftCardOrder(
        {
          // A guest has no account name; the sender name they typed is what
          // appears in admin and on the Slack alert.
          fullName: token
            ? (session?.user?.user_metadata?.name ??
              cards[0]?.recipientName ??
              "Customer")
            : (cards.find((c) => !c.isAnonymous && c.senderName)?.senderName ??
              guest ??
              "Guest"),
          ...(token ? {} : { guestEmail: guest ?? undefined }),
          giftCards: cards.map((c) => ({
            themeId: c.theme.id,
            amount: c.amount,
            recipientName: c.recipientName,
            recipientEmail: c.recipientEmail,
            recipientPhone: c.recipientPhone || undefined,
            senderName: c.isAnonymous ? undefined : c.senderName,
            isAnonymous: c.isAnonymous ?? false,
            message: c.message,
            deliveryMethod: c.deliveryMethod,
          })),
        },
        token,
      );
      setOrderId(result.orderNumber);
      setServerTotal(result.totalAmount ?? cards.reduce((s, c) => s + c.amount, 0));
    } catch {
      setStep("review");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // amounts are in kobo; custom input is naira → ×100
  const effectiveAmount = isCustom ? (parseInt(customAmount) || 0) * 100 : selectedAmount || 0;

  const emailValid = deliveryMethod !== "email" || emailRegex.test(recipientEmail.trim());
  const phoneValid =
    deliveryMethod !== "whatsapp" || nigerianPhoneRegex.test(recipientPhone.trim());
  // Anonymity means something only where WE deliver; with a shareable link the
  // buyer hands it over themselves.
  const canBeAnonymous = deliveryMethod === "email" || deliveryMethod === "whatsapp";
  const sendAnonymously = canBeAnonymous && isAnonymous;
  const isValid =
    effectiveAmount >= MIN_AMOUNT_KOBO &&
    recipientName.trim().length > 0 &&
    emailValid &&
    phoneValid;

  const helperByMethod: Record<DeliveryMethod, string> = {
    link: "We'll generate a private link you can share with the recipient however you like.",
    email: "We'll email the gift card directly to the recipient.",
    whatsapp: "We'll send the gift card straight to the recipient on WhatsApp.",
  };

  const deliveryOptions: Array<{
    id: DeliveryMethod;
    label: string;
    icon: typeof Link2;
    disabled?: boolean;
  }> = [
    { id: "link", label: "Shareable link", icon: Link2 },
    { id: "email", label: "Email", icon: Mail },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  ];

  const buildCurrentCard = (): ConfiguredGiftCard => ({
    id: `gc-${Date.now()}`,
    theme,
    amount: effectiveAmount,
    deliveryMethod,
    recipientName: recipientName.trim(),
    recipientPhone:
      deliveryMethod === "whatsapp" ? recipientPhone.trim().replace(/[\s-]/g, "") : "",
    recipientEmail: deliveryMethod === "email" ? recipientEmail.trim() : undefined,
    senderName: sendAnonymously ? undefined : senderName.trim() || undefined,
    isAnonymous: sendAnonymously,
    message: message.trim() || undefined,
  });

  const summaryCards: ConfiguredGiftCard[] = isValid ? [...addedCards, buildCurrentCard()] : [...addedCards];
  const summaryTotal = summaryCards.reduce((sum, c) => sum + c.amount, 0);

  const handleContinue = () => {
    if (!isValid) return;
    setStep("review");
  };

  const resetDraft = () => {
    setTheme(giftCardThemes[0]);
    setSelectedAmount(null);
    setIsCustom(false);
    setCustomAmount("");
    setDeliveryMethod("link");
    setRecipientName("");
    setRecipientEmail("");
    setRecipientPhone("");
    setPhoneTouched(false);
    setIsAnonymous(false);
    setMessage("");
  };

  const handleAddAnother = () => {
    if (isValid) {
      setAddedCards((prev) => [...prev, buildCurrentCard()]);
    }
    resetDraft();
    setStep("form");
  };

  // §1: poll for up to 30s after "Payment Made", then release the buyer.
  const { state: pollState, status: orderStatus } = useOrderConfirmationPoll(
    awaitingConfirmation ? orderId : null,
    session?.access_token,
  );

  const handleProceedToPayment = () => {
    if (!session?.access_token && !guestEmail) {
      localStorage.setItem(PENDING_KEY, JSON.stringify({ cards: summaryCards }));
      setStep("signin");
      return;
    }
    placeOrders(summaryCards, session.access_token);
  };

  if (step === "signin") {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
        <div className="flex items-center gap-3 px-8 py-6 border-b bg-background/80 backdrop-blur">
          <button
            onClick={() => setStep("review")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <h1 className="font-display text-lg font-bold text-foreground ml-2">Checkout</h1>
        </div>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="bg-card rounded-3xl border border-foreground/[0.06] shadow-sm p-8">
              <CheckoutSignIn
                allowGuest
                guestSubmitting={isCreatingOrder}
                onGuestContinue={(email) => {
                  setGuestEmail(email);
                  // The draft was persisted for an OAuth round-trip that is no
                  // longer happening; drop it so a later sign-in cannot replay
                  // this order.
                  localStorage.removeItem(PENDING_KEY);
                  void placeOrders(summaryCards, undefined, email);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "payment") {
    if (isCreatingOrder || !orderId) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[hsl(28,32%,36%)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Preparing your order…</p>
          </div>
        </div>
      );
    }

    const itemsLabel = `${summaryCards.length} gift card${summaryCards.length === 1 ? "" : "s"}`;
    return (
      <DesktopCheckoutPaymentView
        orderId={orderId}
        totalAmount={serverTotal || summaryTotal}
        onPaymentConfirmed={() => {
          setAwaitingConfirmation(true);
          setStep("success");
        }}
        onBack={() => setStep("review")}
        hideGiftCardRedeem
        title="Complete payment"
        backLabel="Back to review"
        summaryLines={[{ label: "Items", value: itemsLabel }]}
      />
    );
  }

  // §1b/§1c: the window and its outcomes, before the legacy success view.
  if (step === "success" && awaitingConfirmation) {
    if (pollState === "waiting") {
      return <PaymentCheckingView variant="desktop" />;
    }

    const firstCard = summaryCards[0];
    const copy = resolveOutcomeCopy({
      authState: session ? "user" : "guest",
      deliveryMethod: firstCard?.deliveryMethod ?? "link",
      confirmed: pollState === "confirmed",
      orderKind: "gift_card",
      buyerEmail: orderStatus?.buyerEmail ?? guestEmail,
      recipientEmail: firstCard?.recipientEmail,
      recipientName: firstCard?.recipientName,
    });

    const handleOutcomeAction = (action: CtaAction) => {
      switch (action) {
        case "order-history":
          navigate("/account/gifting");
          break;
        case "gifting":
          navigate("/gifting");
          break;
        case "shop":
          navigate("/catalogue");
          break;
      }
    };

    return (
      <PaymentOutcomeView
        copy={copy}
        orderNumber={orderId}
        giftCards={orderStatus?.giftCards ?? []}
        onAction={handleOutcomeAction}
        variant="desktop"
      />
    );
  }

  if (step === "success") {
    const allEmail = summaryCards.every((c) => c.deliveryMethod === "email");
    const allLink = summaryCards.every((c) => c.deliveryMethod === "link");
    const isMulti = summaryCards.length > 1;
    const successCopy = !isMulti
      ? allEmail
        ? `Once your payment is confirmed, we'll email the gift card directly to ${summaryCards[0]?.recipientName}.`
        : "Once your payment is confirmed, we'll email the shareable gift card link to you."
      : allEmail
        ? "Once your payment is confirmed, we'll email each gift card directly to its recipient."
        : allLink
          ? "Once your payment is confirmed, we'll email the shareable gift card links to you."
          : "After payment, we'll email gift cards to recipients you chose, and send shareable links to you for the rest.";

    return (
      <DesktopCheckoutSuccessView
        orderId={orderId}
        message={successCopy}
        onViewOrder={() => navigate("/orders")}
        onReturnToShop={() => navigate("/catalogue")}
      />
    );
  }

  if (step === "review") {
    const allEmail = summaryCards.every((c) => c.deliveryMethod === "email");
    const allLink = summaryCards.every((c) => c.deliveryMethod === "link");
    const isMulti = summaryCards.length > 1;
    const drawerCopy = !isMulti
      ? allEmail
        ? `After payment, we'll email the gift card directly to ${summaryCards[0]?.recipientName}.`
        : "After payment, we'll email the shareable gift card link to you."
      : allEmail
        ? "After payment, we'll email each gift card directly to its recipient."
        : allLink
          ? "After payment, we'll email the shareable gift card links to you."
          : "After payment, we'll email gift cards to recipients you chose, and send shareable links to you for the rest.";

    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        {/* Top strip — matches form step */}
        <div className="border-b border-foreground/[0.06] bg-background/70 backdrop-blur-xl sticky top-0 z-30">
          <div className="container relative flex items-center h-16">
            <button
              onClick={() => setStep("form")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Edit
            </button>
            <h1 className="absolute left-1/2 -translate-x-1/2 font-display text-base font-bold text-foreground tracking-[-0.01em]">
              Review your order
            </h1>
          </div>
        </div>

        {/* Canvas wash */}
        <div className="relative bg-[radial-gradient(1200px_600px_at_20%_-10%,hsl(28,32%,90%/0.6),transparent_60%)]">
          <div className="container py-10">
            <div className="grid grid-cols-12 gap-8 lg:gap-12">
              {/* Cards list */}
              <div className="col-span-12 lg:col-span-7 space-y-8">
                <section>
                  <SectionHeader eyebrow="Your selection" label={isMulti ? "Gift cards" : "Gift card"} />
                  <div className="space-y-4">
                    {summaryCards.map((c, idx) => {
                      const isCommitted = idx < addedCards.length;
                      return (
                        <div
                          key={c.id}
                          className="rounded-[20px] bg-white ring-1 ring-foreground/[0.06] shadow-[0_1px_0_hsl(28_25%_25%/0.04),0_12px_28px_-18px_hsl(28_25%_25%/0.35)] p-5"
                        >
                          <div className="flex gap-5">
                            <div className="w-[240px] shrink-0">
                              <div className="rounded-2xl bg-gradient-to-b from-white to-[hsl(28,25%,96%)] p-2.5 ring-1 ring-foreground/[0.05] shadow-[0_20px_40px_-22px_hsl(28_25%_25%/0.4)]">
                                <div className="rounded-xl overflow-hidden">
                                  <GiftCardPreview
                                    theme={c.theme}
                                    recipientName={c.recipientName}
                                    amount={c.amount}
                                    compact
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-3">
                              <div className="flex flex-wrap gap-1.5">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(28,25%,97%)] ring-1 ring-foreground/[0.06] px-2.5 py-1 text-[11px] text-foreground/80">
                                  {c.deliveryMethod === "email" ? (
                                    <Mail className="w-3 h-3 text-[hsl(28,32%,45%)]" />
                                  ) : (
                                    <Link2 className="w-3 h-3 text-[hsl(28,32%,45%)]" />
                                  )}
                                  {c.deliveryMethod === "email" ? "Email" : "Shareable link"}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(28,25%,97%)] ring-1 ring-foreground/[0.06] px-2.5 py-1 text-[11px] text-foreground/80">
                                  <User className="w-3 h-3 text-[hsl(28,32%,45%)]" />
                                  {c.recipientName}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(28,25%,97%)] ring-1 ring-foreground/[0.06] px-2.5 py-1 text-[11px] font-semibold text-foreground/85 tabular-nums">
                                  <Wallet className="w-3 h-3 text-[hsl(28,32%,45%)]" />
                                  {formatPrice(c.amount)}
                                </span>
                                {c.recipientEmail && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(28,25%,97%)] ring-1 ring-foreground/[0.06] px-2.5 py-1 text-[11px] text-foreground/80 max-w-full">
                                    <AtSign className="w-3 h-3 text-[hsl(28,32%,45%)] shrink-0" />
                                    <span className="truncate">{c.recipientEmail}</span>
                                  </span>
                                )}
                                {c.senderName && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(28,25%,97%)] ring-1 ring-foreground/[0.06] px-2.5 py-1 text-[11px] text-foreground/80">
                                    <PenLine className="w-3 h-3 text-[hsl(28,32%,45%)]" />
                                    From {c.senderName}
                                  </span>
                                )}
                              </div>
                              {c.message && (
                                <div className="rounded-lg bg-[hsl(28,25%,97%)] ring-1 ring-foreground/[0.06] px-3 py-2">
                                  <p className="font-serif italic text-[12px] text-foreground/80 leading-relaxed">
                                    "{c.message}"
                                  </p>
                                </div>
                              )}
                              {isCommitted && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddedCards((prev) => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="self-start flex items-center gap-1 text-[11px] font-medium text-destructive/70 hover:text-destructive transition-colors mt-auto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Remove
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={handleAddAnother}
                      className="w-full rounded-2xl border border-dashed border-foreground/15 bg-white/40 py-5 text-sm font-medium text-muted-foreground hover:border-[hsl(28,32%,36%)]/40 hover:text-foreground hover:bg-white/70 transition-all flex items-center justify-center gap-2"
                    >
                      <Gift className="w-4 h-4" /> Add another gift card
                    </button>
                  </div>
                </section>
              </div>

              {/* Summary */}
              <div className="col-span-12 lg:col-span-5">
                <div className="lg:sticky lg:top-24 space-y-5">
                  <section>
                    <SectionHeader eyebrow="Total" label="Order summary" />
                    <div className="rounded-[20px] bg-white ring-1 ring-foreground/[0.06] shadow-[0_1px_0_hsl(28_25%_25%/0.04),0_12px_28px_-18px_hsl(28_25%_25%/0.35)] p-5">
                      <div className="space-y-3">
                        {summaryCards.map((c) => (
                          <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex items-center gap-3 min-w-0">
                              <span
                                className={cn(
                                  "w-9 h-9 rounded-lg shrink-0 bg-gradient-to-br ring-1 ring-foreground/[0.06]",
                                  c.theme.gradient,
                                )}
                              />
                              <span className="font-medium text-foreground truncate">{c.theme.name}</span>
                            </span>
                            <span className="font-semibold text-foreground tabular-nums shrink-0">
                              {formatPrice(c.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="my-4 h-px bg-gradient-to-r from-foreground/[0.10] to-transparent" />
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <span className="block uppercase tracking-[0.18em] text-[10px] font-bold text-muted-foreground">
                            Total today
                          </span>
                          <span className="font-display text-2xl font-bold text-foreground tabular-nums">
                            {formatPrice(summaryTotal)}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {summaryCards.length} {summaryCards.length === 1 ? "card" : "cards"}
                        </span>
                      </div>

                      <div className="mt-5 rounded-xl bg-[hsl(28,25%,97%)] ring-1 ring-foreground/[0.06] px-4 py-3 flex items-start gap-2.5">
                        <p className="text-xs text-foreground/75 leading-relaxed">{drawerCopy}</p>
                      </div>

                      <button
                        onClick={handleProceedToPayment}
                        disabled={summaryCards.length === 0}
                        className="group mt-4 w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-[hsl(28,32%,36%)] text-white text-sm font-semibold shadow-[0_18px_36px_-18px_hsl(28,32%,28%,0.6)] hover:translate-y-[-1px] transition-transform disabled:opacity-50 disabled:translate-y-0"
                      >
                        Proceed to payment
                        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Quiet trust footer */}
            <div className="mt-20 pt-8 border-t border-foreground/[0.06]">
              <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[hsl(28,32%,45%)]" /> Designed with care
                </span>
                <span className="w-1 h-1 rounded-full bg-foreground/20" />
                <span className="inline-flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-[hsl(28,32%,45%)]" /> Delivered instantly
                </span>
                <span className="w-1 h-1 rounded-full bg-foreground/20" />
                <span className="inline-flex items-center gap-2">
                  <Gift className="w-3.5 h-3.5 text-[hsl(28,32%,45%)]" /> Never expires
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const messageSuggestions = ["With love", "Congratulations", "Just because"];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Top strip — bundle style */}
      <div className="border-b border-foreground/[0.06] bg-background/70 backdrop-blur-xl sticky top-0 z-30">
        <div className="container relative flex items-center h-16">
          <button
            onClick={() => navigate("/gifting")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Gifting
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-display text-base font-bold text-foreground tracking-[-0.01em]">
            Gift Card Studio
          </h1>
          <button
            onClick={() => { if (addedCards.length > 0) setStep("review"); }}
            className={cn(
              "relative ml-auto w-9 h-9 rounded-full flex items-center justify-center transition-all",
              addedCards.length > 0 ? "hover:bg-secondary/60" : "opacity-40 cursor-default",
            )}
            aria-label="Review gift cards"
          >
            <ShoppingBag className="w-5 h-5 text-foreground" strokeWidth={1.5} />
            {addedCards.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[hsl(28,32%,36%)]" />}
          </button>
        </div>
      </div>

      {/* Canvas with soft radial wash */}
      <div className="relative bg-[radial-gradient(1200px_600px_at_20%_-10%,hsl(28,32%,90%/0.6),transparent_60%)]">
        <div className="container py-14">
          {/* Studio */}
          <div className="grid grid-cols-12 gap-8 lg:gap-12">
            {/* Sticky preview */}
            <aside className="col-span-12 lg:col-span-5">
              <div className="lg:sticky lg:top-24 space-y-5">
                <span className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur ring-1 ring-foreground/[0.06] px-3 py-1.5 rounded-full text-[11px] font-medium text-foreground/70">
                  <Sparkles className="w-3 h-3 text-[hsl(28,32%,45%)]" /> Live preview
                </span>
                <div className="rounded-[28px] bg-gradient-to-b from-white to-[hsl(28,25%,96%)] p-4 ring-1 ring-foreground/[0.05] shadow-[0_40px_80px_-30px_hsl(28_25%_25%/0.4)]">
                  <div className="rounded-2xl overflow-hidden shadow-[0_20px_40px_-20px_hsl(28_25%_25%/0.35)]">
                    <GiftCardPreview theme={theme} recipientName={recipientName} amount={effectiveAmount} />
                  </div>
                </div>
                {(message.trim() || senderName.trim()) && (
                  <div className="rounded-2xl bg-[hsl(28,25%,97%)] ring-1 ring-foreground/[0.06] p-5">
                    <span className="block uppercase tracking-[0.18em] text-[10px] font-bold text-muted-foreground mb-2">
                      Your note
                    </span>
                    {message.trim() && (
                      <p className="font-serif italic text-foreground/80 leading-relaxed">"{message.trim()}"</p>
                    )}
                    {senderName.trim() && (
                      <>
                        <div className="my-3 h-px bg-foreground/[0.08]" />
                        <p className="text-sm text-muted-foreground">— {senderName.trim()}</p>
                      </>
                    )}
                  </div>
                )}
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(28,32%,45%)] animate-pulse" />
                  Updates as you type
                </p>
              </div>
            </aside>

            {/* Form */}
            <div className="col-span-12 lg:col-span-7 space-y-16">
              {/* Theme cards */}
              <section>
                <SectionHeader index="01" label="Choose a style" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {giftCardThemes.map((t) => {
                    const active = theme.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t)}
                        className={cn(
                          "group relative rounded-[20px] overflow-hidden bg-card text-left transition-all duration-300 ease-out",
                          "shadow-[0_1px_0_hsl(28_25%_25%/0.04),0_12px_28px_-18px_hsl(28_25%_25%/0.35)]",
                          "hover:-translate-y-1 hover:shadow-[0_20px_40px_-22px_hsl(28_25%_25%/0.45)]",
                          active
                            ? "ring-1 ring-[hsl(28,32%,28%)] ring-offset-2 ring-offset-[#FAF8F5]"
                            : "ring-1 ring-foreground/[0.05]",
                        )}
                      >
                        <div
                          className={cn(
                            "relative w-full aspect-[5/4] bg-gradient-to-br flex items-center justify-center ring-1 ring-inset ring-white/40 overflow-hidden",
                            t.gradient,
                            "before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/25 before:to-transparent before:pointer-events-none",
                            "after:absolute after:inset-0 after:bg-[radial-gradient(120%_80%_at_50%_0%,hsl(0_0%_100%/0.35),transparent_60%)] after:pointer-events-none",
                          )}
                        >
                          <span className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-white/55 backdrop-blur-sm flex items-center justify-center z-10">
                            <Sparkles className="w-3 h-3 text-foreground/40" />
                          </span>
                          <span className="text-[44px] relative z-10 opacity-20 drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)] transition-all duration-500 group-hover:opacity-40 group-hover:scale-[1.06] group-hover:-rotate-[2deg]">
                            {t.emoji}
                          </span>
                          {active && (
                            <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[hsl(28,32%,28%)] text-white flex items-center justify-center shadow z-10">
                              <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div className="py-3 text-center">
                          <span className="block uppercase tracking-[0.18em] text-[9px] text-muted-foreground">
                            Theme
                          </span>
                          <p className="mt-0.5 font-display text-[13px] font-semibold tracking-[-0.005em] text-foreground/85">
                            {t.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Amount */}
              <section>
                <SectionHeader index="02" label="Select amount" />
                <div className="flex flex-wrap gap-2.5">
                  {presetAmounts.map((amt) => {
                    const selected = !isCustom && selectedAmount === amt;
                    return (
                      <button
                        key={amt}
                        onClick={() => {
                          setSelectedAmount(amt);
                          setIsCustom(false);
                          setCustomAmount("");
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5 h-11 px-5 rounded-full font-display text-sm font-semibold tracking-[-0.005em] transition-all duration-200",
                          selected
                            ? "bg-[hsl(28,32%,36%)] text-white shadow-[0_14px_28px_-14px_hsl(28,32%,28%,0.55)]"
                            : "bg-white text-foreground ring-1 ring-foreground/[0.08] hover:ring-foreground/25",
                        )}
                      >
                        {formatPrice(amt)}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      setIsCustom(true);
                      setSelectedAmount(null);
                    }}
                    className={cn(
                      "h-11 px-5 rounded-full font-display text-sm font-semibold tracking-[-0.005em] transition-all duration-200",
                      isCustom
                        ? "bg-[hsl(28,32%,36%)] text-white shadow-[0_14px_28px_-14px_hsl(28,32%,28%,0.55)]"
                        : "bg-transparent text-foreground border border-dashed border-foreground/30 hover:border-foreground/50",
                    )}
                  >
                    Custom
                  </button>
                </div>
                {isCustom && (
                  <div className="mt-4 w-full animate-fade-in">
                    <div className="flex h-12 rounded-xl ring-1 ring-foreground/[0.08] bg-white overflow-hidden shadow-[inset_0_1px_0_white]">
                      <span className="flex items-center justify-center px-3 bg-[hsl(28,25%,94%)] text-sm font-semibold text-foreground/70">
                        ₦
                      </span>
                      <Input
                        type="number"
                        placeholder="Min 10,000"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="border-0 bg-transparent h-full text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                        min={10000}
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* Delivery method */}
              <section>
                <SectionHeader index="03" label="Delivery method" />
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {deliveryOptions.map(({ id, label, icon: Icon, disabled }) => {
                    const selected = deliveryMethod === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && setDeliveryMethod(id)}
                        className={cn(
                          "relative rounded-2xl bg-white min-h-[96px] p-4 flex flex-col items-center justify-center gap-2 text-xs font-medium transition-all",
                          "ring-1 shadow-[0_6px_16px_-12px_hsl(28_25%_25%/0.25)]",
                          selected
                            ? "ring-[hsl(28,32%,36%)] text-foreground"
                            : "ring-foreground/[0.08] text-muted-foreground hover:ring-foreground/25",
                          disabled && "opacity-60 cursor-not-allowed",
                        )}
                      >
                        <span
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center",
                            selected ? "bg-[hsl(28,32%,36%)]/10" : "bg-[hsl(28,25%,94%)]",
                          )}
                        >
                          <Icon className={cn("w-[18px] h-[18px]", selected && "text-[hsl(28,32%,36%)]")} />
                        </span>
                        <span>{label}</span>
                        {selected && !disabled && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[hsl(28,32%,28%)] text-white flex items-center justify-center">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </span>
                        )}
                        {disabled && (
                          <span className="absolute -top-1.5 right-1.5 text-[9px] font-semibold uppercase tracking-wide bg-foreground text-background px-1.5 py-0.5 rounded-full">
                            Soon
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {helperByMethod[deliveryMethod] && (
                  <p className="text-xs text-muted-foreground mt-3">{helperByMethod[deliveryMethod]}</p>
                )}
              </section>

              {/* Recipient */}
              <section>
                <SectionHeader index="04" label="Recipient details" />
                <div
                  className={cn(
                    "grid gap-4",
                    deliveryMethod === "link" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2",
                  )}
                >
                  <FieldShell label="Recipient name">
                    <Input
                      placeholder="Who is this for?"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="h-12 text-base bg-white ring-1 ring-foreground/[0.08] border-0 rounded-xl shadow-[inset_0_1px_0_white] focus-visible:ring-2 focus-visible:ring-[hsl(28,32%,36%)]/40"
                    />
                  </FieldShell>
                  {deliveryMethod === "email" && (
                    <FieldShell label="Email">
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="h-12 text-base bg-white ring-1 ring-foreground/[0.08] border-0 rounded-xl shadow-[inset_0_1px_0_white] focus-visible:ring-2 focus-visible:ring-[hsl(28,32%,36%)]/40 animate-fade-in"
                        autoComplete="email"
                      />
                    </FieldShell>
                  )}
                  {deliveryMethod === "whatsapp" && (
                    <FieldShell label="WhatsApp number">
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="0801 234 5678"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        onBlur={() => setPhoneTouched(true)}
                        className="h-12 text-base bg-white ring-1 ring-foreground/[0.08] border-0 rounded-xl shadow-[inset_0_1px_0_white] focus-visible:ring-2 focus-visible:ring-[hsl(28,32%,36%)]/40"
                        autoComplete="tel"
                        aria-invalid={phoneTouched && !phoneValid}
                      />
                      {phoneTouched && !phoneValid ? (
                        <p className="text-xs text-destructive mt-1.5">
                          Enter a valid Nigerian mobile number
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Nigerian numbers only
                        </p>
                      )}
                    </FieldShell>
                  )}
                </div>
              </section>

              {/* Sender — shown for every delivery method (§4) */}
              <section>
                <SectionHeader index="05" label="Sender details" />
                <FieldShell label="Sender name">
                  <Input
                    placeholder="Your name"
                    value={sendAnonymously ? "" : senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    disabled={sendAnonymously}
                    className="h-12 text-base bg-white ring-1 ring-foreground/[0.08] border-0 rounded-xl shadow-[inset_0_1px_0_white] focus-visible:ring-2 focus-visible:ring-[hsl(28,32%,36%)]/40"
                    autoComplete="name"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    This is the name the recipient sees on their gift card page.
                    Change it if you'd like a different name shown.
                  </p>
                  {canBeAnonymous && (
                    <label className="flex items-center gap-2 pt-2 cursor-pointer">
                      <Checkbox
                        checked={isAnonymous}
                        onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                      />
                      <span className="text-xs text-muted-foreground">
                        Send anonymously — don't show my name
                      </span>
                    </label>
                  )}
                </FieldShell>
              </section>

              {/* Message */}
              <section>
                <SectionHeader index="06" label="Personal message" />
                <div className="flex flex-wrap gap-2 mb-3">
                  {messageSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setMessage((prev) => (prev ? `${s}, ${prev}` : `${s}, `).slice(0, 150))}
                      className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white ring-1 ring-foreground/[0.08] text-foreground/70 hover:ring-foreground/25 transition-all"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
                <div className="relative rounded-2xl bg-white ring-1 ring-foreground/[0.08] p-5 shadow-[inset_0_1px_0_white]">
                  <Textarea
                    placeholder="Write something they'll remember…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 150))}
                    maxLength={150}
                    className="resize-none min-h-[120px] text-base bg-transparent border-0 font-serif italic focus-visible:ring-0 focus-visible:ring-offset-0 p-0 placeholder:not-italic placeholder:font-sans"
                  />
                  <span className="absolute bottom-3 right-3 text-[10px] bg-[hsl(28,25%,97%)] ring-1 ring-foreground/[0.06] px-2 py-0.5 rounded-full text-muted-foreground">
                    {message.length}/150
                  </span>
                </div>
              </section>

              {/* Sticky Continue bar */}
              <div className="pt-2 lg:sticky lg:bottom-4 z-10">
                <div className="flex items-center justify-between gap-4 flex-wrap bg-white/85 backdrop-blur ring-1 ring-foreground/[0.06] rounded-2xl px-5 py-4 shadow-[0_20px_40px_-20px_hsl(28_25%_25%/0.35)]">
                  <div>
                    <span className="block uppercase tracking-[0.18em] text-[10px] font-bold text-muted-foreground">
                      Total today
                    </span>
                    <span className="font-display text-lg font-bold text-foreground tabular-nums">
                      {effectiveAmount > 0 ? formatPrice(effectiveAmount) : "—"}
                    </span>
                  </div>
                  <button
                    disabled={!isValid}
                    onClick={handleContinue}
                    className={cn(
                      "group inline-flex items-center gap-2 rounded-full pl-6 pr-2 py-2 text-sm font-semibold transition-all",
                      isValid
                        ? "bg-[hsl(28,32%,36%)] text-white shadow-[0_18px_36px_-18px_hsl(28,32%,28%,0.6)] hover:translate-y-[-1px]"
                        : "bg-foreground/10 text-muted-foreground cursor-not-allowed",
                    )}
                  >
                    Continue
                    <span
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-transform",
                        isValid ? "bg-white text-[hsl(28,32%,36%)] group-hover:translate-x-0.5" : "bg-background/40",
                      )}
                    >
                      <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quiet trust footer */}
          <div className="mt-20 pt-8 border-t border-foreground/[0.06]">
            <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[hsl(28,32%,45%)]" /> Designed with care
              </span>
              <span className="w-1 h-1 rounded-full bg-foreground/20" />
              <span className="inline-flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-[hsl(28,32%,45%)]" /> Delivered instantly
              </span>
              <span className="w-1 h-1 rounded-full bg-foreground/20" />
              <span className="inline-flex items-center gap-2">
                <Gift className="w-3.5 h-3.5 text-[hsl(28,32%,45%)]" /> Never expires
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ index, eyebrow, label }: { index?: string; eyebrow?: string; label: string }) {
  return (
    <div className="mb-7 flex items-center gap-3">
      {index && (
        <span className="w-7 h-7 rounded-full bg-[hsl(28,32%,36%)]/10 text-[hsl(28,32%,36%)] flex items-center justify-center font-display text-[11px] font-bold tabular-nums">
          {index}
        </span>
      )}
      <div className="flex flex-col leading-tight">
        {eyebrow && <span className="uppercase tracking-[0.22em] text-[9px] text-muted-foreground">{eyebrow}</span>}
        <h2 className="font-display text-lg font-bold text-foreground tracking-[-0.01em]">{label}</h2>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-foreground/[0.10] to-transparent" />
    </div>
  );
}

function FieldShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block uppercase tracking-[0.18em] text-[10px] font-semibold text-muted-foreground mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
