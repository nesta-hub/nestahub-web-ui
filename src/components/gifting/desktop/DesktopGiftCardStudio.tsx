import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GiftCardPreview } from "@/components/gifting/GiftCardPreview";
import {
  giftCardThemes,
  presetAmounts,
  type GiftCardTheme,
} from "@/components/gifting/GiftCardThemes";
import { formatPrice } from "@/lib/api";
import type { ConfiguredGiftCard } from "@/pages/GiftCardDetailsV2";

// presetAmounts are KOBO. Custom input is in naira → ×100 to kobo.
const MIN_AMOUNT_KOBO = 1_000_000; // ₦10,000

export function DesktopGiftCardStudio() {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingAddedCards =
    (location.state as { addedCards?: ConfiguredGiftCard[] } | null)?.addedCards ?? [];

  const [theme, setTheme] = useState<GiftCardTheme>(giftCardThemes[0]);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(presetAmounts[2] ?? presetAmounts[0]);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");

  const effectiveAmount = isCustom ? (parseInt(customAmount) || 0) * 100 : selectedAmount || 0;
  const isValid = effectiveAmount >= MIN_AMOUNT_KOBO && recipientName.trim().length > 0;

  const handleContinue = () => {
    if (!isValid) return;
    navigate("/gifting/cards/details", {
      state: {
        theme,
        amount: effectiveAmount,
        addedCards: incomingAddedCards,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Editorial sub-header band */}
      <div className="bg-[#F5F3F0] border-b border-foreground/[0.06]">
        <div className="container py-8 lg:py-10">
          <button
            onClick={() => navigate("/gifting")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Gifting
          </button>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <span className="block uppercase tracking-[0.24em] text-[11px] font-bold text-[hsl(28,32%,36%)] mb-3">
                Gift Card Studio
              </span>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground tracking-[-0.01em] leading-tight">
                Design a card. Send some love.
              </h1>
              <p className="mt-2 text-sm lg:text-base text-muted-foreground max-w-[58ch]">
                Pick a theme, choose an amount, and write a note.
              </p>
            </div>
            {incomingAddedCards.length > 0 && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold bg-[hsl(28,32%,36%)]/10 text-[hsl(28,32%,36%)] px-3 py-1.5 rounded-full">
                <Gift className="w-3.5 h-3.5" />
                {incomingAddedCards.length} added
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Studio */}
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-12 gap-8 lg:gap-12">
          {/* Sticky preview */}
          <aside className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-28 space-y-5">
              <span className="block uppercase tracking-[0.2em] text-[10px] font-bold text-muted-foreground">
                Live preview
              </span>
              <div className="rounded-3xl overflow-hidden shadow-[0_30px_60px_-25px_hsl(28_25%_25%/0.35)]">
                <GiftCardPreview theme={theme} recipientName={recipientName} amount={effectiveAmount} />
              </div>
              {(message.trim() || senderName.trim()) && (
                <div className="rounded-2xl bg-card border border-foreground/[0.06] p-5 shadow-sm">
                  <span className="block uppercase tracking-[0.18em] text-[10px] font-bold text-muted-foreground mb-2">
                    Your note
                  </span>
                  {message.trim() && (
                    <p className="font-serif italic text-foreground/80 leading-relaxed">
                      "{message.trim()}"
                    </p>
                  )}
                  {senderName.trim() && (
                    <p className="mt-3 text-sm text-muted-foreground">— {senderName.trim()}</p>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[hsl(28,32%,45%)]" />
                Updates as you type
              </p>
            </div>
          </aside>

          {/* Form */}
          <div className="col-span-12 lg:col-span-7 space-y-10">
            {/* Amount */}
            <section>
              <SectionHeader index="01" label="Amount" />
              <div className="flex flex-wrap gap-2.5">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setIsCustom(false);
                      setCustomAmount("");
                    }}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border",
                      !isCustom && selectedAmount === amt
                        ? "bg-[hsl(28,32%,36%)] text-white border-transparent shadow-[0_10px_22px_-12px_hsl(28,32%,28%,0.6)]"
                        : "bg-card text-foreground border-foreground/10 hover:border-foreground/25"
                    )}
                  >
                    {formatPrice(amt)}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setIsCustom(true);
                    setSelectedAmount(null);
                  }}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border",
                    isCustom
                      ? "bg-[hsl(28,32%,36%)] text-white border-transparent"
                      : "bg-card text-foreground border-foreground/10 hover:border-foreground/25"
                  )}
                >
                  Custom
                </button>
              </div>
              {isCustom && (
                <div className="mt-4 max-w-xs animate-fade-in">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      ₦
                    </span>
                    <Input
                      type="number"
                      placeholder="Min 10,000"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-8 h-12 text-base"
                      min={10000}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Theme */}
            <section>
              <SectionHeader index="02" label="Theme" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {giftCardThemes.map((t) => {
                  const active = theme.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t)}
                      className={cn(
                        "group relative rounded-2xl overflow-hidden border-2 transition-all duration-200 text-left",
                        active
                          ? "border-[hsl(28,32%,36%)] shadow-[0_18px_36px_-18px_hsl(28,32%,28%,0.5)]"
                          : "border-transparent hover:border-foreground/15"
                      )}
                    >
                      <div
                        className={cn(
                          "w-full aspect-[16/9] bg-gradient-to-br flex items-center justify-center",
                          t.gradient
                        )}
                      >
                        <span className="text-2xl">{t.emoji}</span>
                        {active && (
                          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[hsl(28,32%,36%)] text-white flex items-center justify-center shadow">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <p className="px-3 py-2 text-xs font-medium text-foreground/80 bg-card">
                        {t.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Recipient */}
            <section>
              <SectionHeader index="03" label="Recipient" />
              <Input
                placeholder="Recipient's name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="h-12 text-base max-w-md"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                You'll add delivery details on the next step.
              </p>
            </section>

            {/* Message */}
            <section>
              <SectionHeader index="04" label="Personal message" />
              <div className="relative">
                <Textarea
                  placeholder="Write something they'll remember…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 150))}
                  maxLength={150}
                  className="resize-none min-h-[120px] text-base"
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
                  {message.length}/150
                </span>
              </div>
              <Input
                placeholder="Your name (so they know who it's from)"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="mt-3 h-12 text-base"
              />
            </section>

            {/* Continue */}
            <div className="pt-4 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-muted-foreground">
                {effectiveAmount > 0
                  ? `Total today · ${formatPrice(effectiveAmount)}`
                  : "Select an amount to continue"}
              </p>
              <button
                disabled={!isValid}
                onClick={handleContinue}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold transition-all",
                  isValid
                    ? "bg-[hsl(28,32%,36%)] text-white shadow-[0_18px_36px_-18px_hsl(28,32%,28%,0.6)] hover:translate-y-[-1px]"
                    : "bg-foreground/10 text-muted-foreground cursor-not-allowed"
                )}
              >
                Continue to checkout
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <span className="font-display text-xs font-bold text-[hsl(28,32%,36%)] tabular-nums tracking-[0.18em]">
        {index}
      </span>
      <h2 className="font-display text-lg font-bold text-foreground tracking-[-0.01em]">{label}</h2>
      <div className="flex-1 h-px bg-foreground/[0.08]" />
    </div>
  );
}
