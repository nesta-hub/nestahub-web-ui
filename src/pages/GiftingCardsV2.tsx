import { useState } from "react";
import { Layout } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GiftCardPreview } from "@/components/gifting/GiftCardPreview";
import { giftCardThemes, presetAmounts, type GiftCardTheme } from "@/components/gifting/GiftCardThemes";
import { formatPrice } from "@/lib/api";
import { DesktopGiftCardStudio } from "@/components/gifting/desktop/DesktopGiftCardStudio";
import type { ConfiguredGiftCard } from "@/pages/GiftCardDetailsV2";

// presetAmounts are KOBO (minor units). Custom input is in naira → ×100 to kobo.
const MIN_AMOUNT_KOBO = 1_000_000; // ₦10,000

const GiftingCardsV2 = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const incomingAddedCards = (location.state as { addedCards?: ConfiguredGiftCard[] } | null)?.addedCards ?? [];

  const [selectedTheme, setSelectedTheme] = useState<GiftCardTheme>(giftCardThemes[0]);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  if (!isMobile) {
    return (
      <Layout>
        <DesktopGiftCardStudio />
      </Layout>
    );
  }

  const effectiveAmount = isCustomAmount
    ? (parseInt(customAmount) || 0) * 100
    : selectedAmount || 0;
  const isValid = effectiveAmount >= MIN_AMOUNT_KOBO;

  const handleAmountPill = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustomAmount(false);
    setCustomAmount("");
  };

  const handleCustomToggle = () => {
    setIsCustomAmount(true);
    setSelectedAmount(null);
  };

  const handleContinue = () => {
    if (!isValid) return;
    navigate("/gifting/cards/details", {
      state: { theme: selectedTheme, amount: effectiveAmount, addedCards: incomingAddedCards },
    });
  };

  return (
    <Layout showNav={false}>
      <div className="min-h-screen pb-28">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button onClick={() => navigate("/gifting")} className="p-1.5 -ml-1.5 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Gift Cards</h1>
            <p className="text-xs text-muted-foreground">Pick a style & amount</p>
          </div>
          {incomingAddedCards.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              <Gift className="w-3.5 h-3.5" />
              {incomingAddedCards.length} added
            </span>
          )}
        </div>

        {/* Live Preview */}
        <div className="px-4 pt-2 pb-4">
          <div className="shadow-lg rounded-2xl">
            <GiftCardPreview theme={selectedTheme} recipientName="" amount={effectiveAmount} />
          </div>
        </div>

        {/* Theme Circles */}
        <div className="px-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Choose a style</h3>
          <div className="flex gap-3 items-center flex-wrap">
            {giftCardThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                className={cn(
                  "w-11 h-11 rounded-full bg-gradient-to-br transition-all duration-200 flex-shrink-0",
                  theme.gradient,
                  selectedTheme.id === theme.id
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                    : "hover:scale-105"
                )}
                aria-label={theme.name}
              />
            ))}
          </div>
        </div>

        {/* Amount Selector */}
        <div className="px-4 mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">Select amount</h3>
          <div className="flex flex-wrap gap-2">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handleAmountPill(amount)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  !isCustomAmount && selectedAmount === amount
                    ? "bg-[hsl(25,20%,42%)] text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {formatPrice(amount)}
              </button>
            ))}
            <button
              onClick={handleCustomToggle}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                isCustomAmount
                  ? "bg-[hsl(25,20%,42%)] text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Custom
            </button>
          </div>
          {isCustomAmount && (
            <div className="mt-3 animate-fade-in">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">₦</span>
                <Input
                  type="number"
                  placeholder="Enter amount (min ₦10,000)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="pl-7 text-base"
                  min={10000}
                />
              </div>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-30">
          <Button
            variant="shop"
            className="w-full h-12 text-base font-semibold"
            disabled={!isValid}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default GiftingCardsV2;
