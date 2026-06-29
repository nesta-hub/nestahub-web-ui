import { useState } from "react";
import { Copy, Check, ShoppingBag, Gift, CreditCard, ShoppingCart } from "lucide-react";
import { GiftCardTheme } from "./GiftCardThemes";
import { themeGradients, themeTextColors } from "./giftCardThemeStyles";
import { formatPrice } from "@/lib/api";
import { Button } from "@/components/ui/button";
import nestaLogo from "@/assets/nesta-logo.png";

export interface GiftCardRecipientPageProps {
  senderName: string;
  recipientName: string;
  amount: number;
  theme: GiftCardTheme;
  message?: string;
  giftCode: string;
}

export function GiftCardRecipientPage({
  senderName,
  recipientName,
  amount,
  theme,
  message,
  giftCode,
}: GiftCardRecipientPageProps) {
  const [copied, setCopied] = useState(false);

  const gradient = themeGradients[theme.id] ?? themeGradients["welcome-world"];
  const cardText = themeTextColors[theme.id] ?? themeTextColors["welcome-world"];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(giftCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-[480px] space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={nestaLogo} alt="Nesta Hub" className="h-14" />
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Gift card visual */}
          <div className="p-6 pb-4">
            <div
              className="relative w-full aspect-[16/10] rounded-xl overflow-hidden shadow-lg"
              style={{ background: gradient }}
            >
              <span className="absolute top-4 right-5 text-4xl select-none opacity-30">{theme.emoji}</span>
              <span className="absolute bottom-4 right-5 text-3xl select-none opacity-20">{theme.emoji}</span>
              <div className="absolute top-4 left-5">
                <img src={nestaLogo} alt="Nesta Hub" className="h-7 opacity-90" />
              </div>
              <div className="absolute top-4 right-5">
                <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: cardText, opacity: 0.5 }}>
                  Gift Card
                </span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center px-8">
                <h2 className="text-lg sm:text-xl font-bold text-center leading-tight" style={{ color: cardText, opacity: 0.9 }}>
                  {theme.name}
                </h2>
              </div>
              <div className="absolute bottom-4 left-5">
                <p className="text-xs font-medium" style={{ color: cardText, opacity: 0.7 }}>For {recipientName}</p>
              </div>
              <div className="absolute bottom-4 right-5">
                <p className="text-sm font-bold" style={{ color: cardText, opacity: 0.85 }}>{formatPrice(amount)}</p>
              </div>
            </div>
          </div>

          {/* Message & sender */}
          {(message || senderName) && (
            <div className="px-6 pb-5 text-center space-y-1.5">
              {message && (
                <p className="text-sm italic text-foreground leading-relaxed">"{message}"</p>
              )}
              <p className="text-xs text-muted-foreground">
                — from <span className="font-semibold text-foreground">{senderName}</span>
              </p>
            </div>
          )}

          {/* Code + actions */}
          <div className="px-6 pb-6 space-y-4">
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Your Gift Code
              </p>
              <div className="border-2 border-green-300 bg-green-50 rounded-xl px-4 py-4">
                <p className="text-lg sm:text-xl font-bold font-mono text-green-800 tracking-wider">
                  {giftCode}
                </p>
              </div>
            </div>

            <Button
              onClick={handleCopy}
              className="w-full rounded-xl py-3 h-auto text-sm font-semibold gap-2"
            >
              {copied ? (
                <><Check className="w-4 h-4" /> Copied!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copy Code</>
              )}
            </Button>

            {/* How to use */}
            <div className="border-t border-border pt-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground text-center">How to Use Your Gift Card</h3>
              <div className="space-y-3">
                {[
                  { icon: Copy, text: "Copy your gift card code using the button above" },
                  { icon: ShoppingBag, text: "Visit nestahub.ng and browse baby essentials" },
                  { icon: ShoppingCart, text: "Add items to your cart and proceed to checkout" },
                  { icon: CreditCard, text: "At payment, tap \"Have a gift card?\" and enter your code" },
                  { icon: Gift, text: "Your gift card balance will be applied to your order" },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-1">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl py-3 h-auto text-sm font-semibold gap-2"
              onClick={() => window.location.href = "/catalogue"}
            >
              <ShoppingBag className="w-4 h-4" /> Shop Now
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-1 pb-4">
          <p className="text-xs font-semibold text-foreground">© 2026 Nesta Hub</p>
          <p className="text-xs text-muted-foreground">Baby care essentials, curated with love</p>
        </div>
      </div>
    </div>
  );
}
