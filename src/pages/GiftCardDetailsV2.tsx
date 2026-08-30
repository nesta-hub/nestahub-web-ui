import { useRef, useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Link2, Mail, MessageCircle, Send, Trash2, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { GiftCardPreview } from "@/components/gifting/GiftCardPreview";
import { type GiftCardTheme } from "@/components/gifting/GiftCardThemes";
import { formatPrice } from "@/lib/api";
import { metaPixel } from "@/lib/metaPixel";
import { useAuth } from "@/contexts/AuthContext";
import { useGiftCardCart } from "@/contexts/GiftCardCartContext";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";

export interface ConfiguredGiftCard {
  id: string;
  theme: GiftCardTheme;
  /** Amount in KOBO (minor units). */
  amount: number;
  deliveryMethod: "link" | "email" | "whatsapp";
  recipientName: string;
  /** Required by the backend gift-card order DTO. */
  recipientPhone: string;
  recipientEmail?: string;
  senderName?: string;
  /** Hide the sender name from the recipient. Email/WhatsApp delivery only. */
  isAnonymous?: boolean;
  message?: string;
}

interface LocationState {
  theme: GiftCardTheme;
  amount: number; // kobo
  addedCards?: ConfiguredGiftCard[];
}

type DeliveryMethod = "link" | "email" | "whatsapp";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 08012345678 / 8012345678 / +2348012345678 / 2348012345678 */
const nigerianPhoneRegex = /^(?:\+?234|0)?[789][01]\d{8}$/;

const GiftCardDetailsV2 = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { cards, addCards } = useGiftCardCart();

  const state = location.state as LocationState | null;
  const theme = state?.theme ?? null;
  const amount = state?.amount ?? 0;

  // Prefill from the last card in the cart (survives OAuth redirect via localStorage).
  const prefill = cards.length > 0 ? cards[cards.length - 1] : null;

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    prefill?.deliveryMethod ?? "link",
  );
  const [recipientName, setRecipientName] = useState(prefill?.recipientName ?? "");
  const [recipientPhone, setRecipientPhone] = useState(prefill?.recipientPhone ?? "");
  const [recipientEmail, setRecipientEmail] = useState(prefill?.recipientEmail ?? "");
  const [senderName, setSenderName] = useState(() => {
    const meta = session?.user?.user_metadata as Record<string, string> | undefined;
    const fromSession =
      meta?.name ||
      meta?.full_name ||
      [meta?.given_name, meta?.family_name].filter(Boolean).join(" ");
    return fromSession || prefill?.senderName || "";
  });
  const [isAnonymous, setIsAnonymous] = useState(prefill?.isAnonymous ?? false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [message, setMessage] = useState(prefill?.message ?? "");

  // addedCards: from navigation state (add-another flow) or all-but-last from cart.
  const [addedCards, setAddedCards] = useState<ConfiguredGiftCard[]>(
    state?.addedCards ?? (cards.length > 1 ? cards.slice(0, -1) : []),
  );

  const [showSummaryDrawer, setShowSummaryDrawer] = useState(false);

  const senderNameTouchedRef = useRef(false);
  const currentCardIdRef = useRef(`gc-current-${Date.now()}`);
  const pendingNavigateAwayRef = useRef(false);
  const suppressNextSummaryCloseRef = useRef(false);

  const canBeAnonymous = deliveryMethod === "email" || deliveryMethod === "whatsapp";
  const sendAnonymously = canBeAnonymous && isAnonymous;

  const emailValid = deliveryMethod !== "email" || emailRegex.test(recipientEmail.trim());
  const phoneValid =
    deliveryMethod !== "whatsapp" || nigerianPhoneRegex.test(recipientPhone.trim());
  const isValid = recipientName.trim().length > 0 && emailValid && phoneValid;

  if (!theme || !amount) {
    return <Navigate to="/gifting/cards" replace />;
  }

  if (!isMobile) {
    return (
      <Layout showNav={false}>
        <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 text-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4">Desktop Experience Coming Soon</h1>
            <p className="text-muted-foreground max-w-md mx-auto text-lg font-medium">
              Browse on a mobile device or a tablet to shop.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const buildCurrentCard = (): ConfiguredGiftCard => ({
    id: currentCardIdRef.current,
    theme: theme!,
    amount,
    deliveryMethod,
    recipientName: recipientName.trim(),
    recipientEmail: deliveryMethod === "email" ? recipientEmail.trim() : undefined,
    recipientPhone:
      deliveryMethod === "whatsapp" ? recipientPhone.trim().replace(/[\s-]/g, "") : "",
    senderName: sendAnonymously ? undefined : senderName.trim() || undefined,
    isAnonymous: sendAnonymously,
    message: message.trim() || undefined,
  });

  const summaryCards: ConfiguredGiftCard[] = isValid
    ? [...addedCards, buildCurrentCard()]
    : [...addedCards];
  const summaryTotal = summaryCards.reduce((sum, c) => sum + c.amount, 0);

  const handleProceed = () => {
    if (!isValid) return;
    metaPixel.customEvent("GiftCardReviewOrder", {
      num_cards: summaryCards.length,
      total_value: summaryCards.reduce((s, c) => s + c.amount, 0) / 100,
      currency: "NGN",
    });
    setShowSummaryDrawer(true);
  };

  const handleAddAnother = () => {
    if (!isValid) return;
    const next = [...addedCards, buildCurrentCard()];
    setShowSummaryDrawer(false);
    navigate("/gifting/cards", { state: { addedCards: next } });
  };

  const resetCurrentForm = () => {
    setRecipientName("");
    setRecipientPhone("");
    setRecipientEmail("");
    setSenderName("");
    setMessage("");
    setDeliveryMethod("link");
  };

  const handleRemoveSummaryCard = (id: string, isCurrent: boolean) => {
    if (isCurrent) {
      suppressNextSummaryCloseRef.current = true;
      resetCurrentForm();
      currentCardIdRef.current = `gc-current-${Date.now()}`;
      pendingNavigateAwayRef.current = true;
      return;
    }
    setAddedCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSummaryOpenChange = (open: boolean) => {
    if (!open && suppressNextSummaryCloseRef.current) {
      suppressNextSummaryCloseRef.current = false;
      setShowSummaryDrawer(true);
      return;
    }
    setShowSummaryDrawer(open);
    if (!open && pendingNavigateAwayRef.current) {
      pendingNavigateAwayRef.current = false;
      navigate("/gifting/cards", { state: { addedCards } });
    }
  };

  const handleProceedToPayment = () => {
    if (summaryCards.length === 0) return;
    metaPixel.initiateCheckout({
      num_items: summaryCards.length,
      value: summaryCards.reduce((s, c) => s + c.amount, 0) / 100,
      currency: "NGN",
    });
    addCards(summaryCards);
    setShowSummaryDrawer(false);
    navigate("/gifting/checkout");
  };

  const deliveryOptions: Array<{
    id: DeliveryMethod;
    label: string;
    icon: typeof Link2;
    disabled?: boolean;
  }> = [
    { id: "link",     label: "Send it myself", icon: Link2 },
    { id: "whatsapp", label: "WhatsApp",        icon: MessageCircle },
    { id: "email",    label: "Email",           icon: Mail },
  ];

  const helperByMethod: Record<DeliveryMethod, string> = {
    link: "We'll generate a private link you can share with the recipient however you like.",
    email: "We'll email the gift card directly to the recipient.",
    whatsapp: "We'll send the gift card straight to the recipient on WhatsApp.",
  };

  return (
    <Layout showNav={false}>
      <div className="min-h-screen pb-28">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button
            onClick={() => navigate("/gifting/cards", { state: { addedCards } })}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground flex-1">Recipient & Delivery</h1>
          {addedCards.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSummaryDrawer(true)}
              className="flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full hover:bg-primary/15 active:scale-95 transition-all"
              aria-label="View order summary"
            >
              <Gift className="w-3.5 h-3.5" />
              {addedCards.length} added
            </button>
          )}
        </div>

        {/* Compact selection summary */}
        <div className="px-4 pt-2 pb-4">
          <Card className="p-3 bg-muted/40 border-border">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br shrink-0", theme.gradient)} />
              <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground truncate">{theme.name}</p>
                <p className="text-sm font-bold text-foreground tabular-nums">{formatPrice(amount)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Delivery Method */}
        <div className="px-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Delivery method</h3>
          <div className="grid grid-cols-3 gap-2">
            {deliveryOptions.map(({ id, label, icon: Icon, disabled }) => {
              const selected = deliveryMethod === id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && setDeliveryMethod(id)}
                  className={cn(
                    "relative rounded-2xl border p-3 flex flex-col items-center gap-1.5 text-xs font-medium transition-all",
                    selected
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40",
                    disabled && "opacity-60 cursor-not-allowed",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                  {disabled && (
                    <span className="absolute -top-1.5 right-1.5 text-[9px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full border">
                      Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {helperByMethod[deliveryMethod] && (
            <p className="text-xs text-muted-foreground mt-2">{helperByMethod[deliveryMethod]}</p>
          )}
        </div>

        {/* Recipient Details */}
        <div className="px-4 mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Recipient details</h3>
          <Input
            placeholder="Recipient's name"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="text-base"
          />
          {deliveryMethod === "email" && (
            <div className="animate-fade-in">
              <Input
                type="email"
                placeholder="Recipient's email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="text-base"
                autoComplete="email"
              />
            </div>
          )}

          {deliveryMethod === "whatsapp" && (
            <div className="animate-fade-in space-y-1.5">
              <Input
                type="tel"
                inputMode="tel"
                placeholder="Whatsapp number e.g. 08032229581"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                onBlur={() => setPhoneTouched(true)}
                className="text-base"
                autoComplete="tel"
                aria-invalid={phoneTouched && !phoneValid}
              />
              {phoneTouched && !phoneValid && (
                <p className="text-xs text-destructive">
                  Enter a valid Nigerian mobile number
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sender Details */}
        <div className="px-4 mt-6 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Sender details</h3>
          <Input
            placeholder="Sender name"
            value={sendAnonymously ? "" : senderName}
            onChange={(e) => {
              senderNameTouchedRef.current = true;
              setSenderName(e.target.value);
            }}
            disabled={sendAnonymously}
            className="text-base"
            autoComplete="name"
          />
          <p className="text-xs text-muted-foreground">
            Name shown to recipient as the sender.
          </p>
          {canBeAnonymous && (
            <label className="flex items-center gap-2 pt-2 cursor-pointer">
              <Checkbox
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked === true)}
              />
              <span className="text-base text-muted-foreground leading-relaxed">
                Send anonymously
              </span>
            </label>
          )}
        </div>

        {/* Personal Message */}
        <div className="px-4 mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">Personal message (optional)</h3>
          <div className="relative">
            <Textarea
              placeholder="Write a heartfelt message"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 150))}
              maxLength={150}
              className="resize-none min-h-[100px] text-base focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{message.length}/150</span>
          </div>
        </div>

        {/* Proceed CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-30">
          <Button
            variant="shop"
            className="w-full h-12 text-base font-semibold"
            disabled={!isValid}
            onClick={handleProceed}
          >
            Continue
          </Button>
        </div>
      </div>

      {/* Summary Drawer */}
      <Drawer open={showSummaryDrawer} onOpenChange={handleSummaryOpenChange}>
        <DrawerContent aria-describedby={undefined}>
          <DrawerHeader>
            <DrawerTitle>
              Order Summary
              {summaryCards.length > 1 && (
                <span className="ml-2 text-xs font-medium text-muted-foreground">{summaryCards.length} gift cards</span>
              )}
            </DrawerTitle>
          </DrawerHeader>

          {summaryCards.length === 0 ? (
            <div className="px-4 pb-4">
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">No gift cards yet. Close this to start a new one.</p>
              </div>
            </div>
          ) : summaryCards.length === 1 ? (
            (() => {
              const c = summaryCards[0];
              const rows: Array<{ label: string; value: React.ReactNode }> = [
                { label: "Delivery", value: c.deliveryMethod === "email" ? "Email" : c.deliveryMethod === "whatsapp" ? "WhatsApp" : "Send it myself" },
                { label: "Recipient", value: c.recipientName },
              ];
              if (c.recipientEmail)
                rows.push({ label: "Email", value: <span className="break-all">{c.recipientEmail}</span> });
              rows.push({ label: "From", value: c.isAnonymous ? "Anonymous" : c.senderName || "—" });
              if (c.message) rows.push({ label: "Message", value: <span className="italic">"{c.message}"</span> });
              return (
                <div className="px-4 pb-2 space-y-4">
                  <div className="w-60 mx-auto">
                    <GiftCardPreview theme={c.theme} recipientName={c.recipientName} compact amount={c.amount} />
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/40 divide-y divide-border">
                    {rows.map((r) => (
                      <div key={r.label} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                        <span className="text-muted-foreground shrink-0">{r.label}</span>
                        <span className="text-foreground text-right min-w-0">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="px-4 pb-2 max-h-[55vh] overflow-y-auto space-y-2">
              {summaryCards.map((c) => {
                const isCurrent = c.id === currentCardIdRef.current;
                return (
                  <Card key={c.id} className="p-3 bg-muted/40 border-border">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br shrink-0", c.theme.gradient)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{c.theme.name}</p>
                          <p className="text-sm font-bold text-foreground tabular-nums">{formatPrice(c.amount)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          To <span className="text-foreground/80">{c.recipientName}</span> ·{" "}
                          {c.deliveryMethod === "email" ? "Email" : c.deliveryMethod === "whatsapp" ? "WhatsApp" : "Send it myself"}
                        </p>
                        {c.recipientEmail && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 break-all">{c.recipientEmail}</p>
                        )}
                        {(c.isAnonymous || c.senderName) && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {c.isAnonymous ? "Sent anonymously" : `From ${c.senderName}`}
                          </p>
                        )}
                        {c.message && <p className="text-[11px] text-muted-foreground italic mt-1">"{c.message}"</p>}
                      </div>
                    </div>
                    <div className="flex justify-end mt-2 pt-2 border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => handleRemoveSummaryCard(c.id, isCurrent)}
                        className="flex items-center gap-1.5 text-xs font-medium text-nesta-brown hover:text-nesta-brown/80 transition-colors px-2 py-1 -mr-1"
                        aria-label="Remove gift card"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </Card>
                );
              })}
              <div className="flex items-center justify-between pt-2 px-1">
                <span className="text-sm font-medium text-muted-foreground">Total</span>
                <span className="text-base font-bold text-foreground tabular-nums">{formatPrice(summaryTotal)}</span>
              </div>
            </div>
          )}

          {summaryCards.length > 0 && (
            <div className="px-4 pt-2 pb-1 flex gap-2 items-start">
              <Send className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                After payment, we'll email the shareable gift card
                {summaryCards.length > 1 ? " links" : " link"} to you.
              </p>
            </div>
          )}

          <DrawerFooter className="gap-2">
            <Button
              variant="shop"
              className="w-full h-12 text-base font-semibold"
              onClick={handleProceedToPayment}
              disabled={summaryCards.length === 0}
            >
              Proceed to Payment
            </Button>
            <Button variant="outline" className="w-full h-11 text-sm font-semibold" onClick={handleAddAnother}>
              Add another gift card
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Layout>
  );
};

export default GiftCardDetailsV2;
