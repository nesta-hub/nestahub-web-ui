import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, ShoppingBag, Wallet, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { GiftCardTheme } from "./GiftCardThemes";
import { themeGradients, themeTextColors } from "./giftCardThemeStyles";
import { formatPrice } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAddGiftToWallet } from "@/hooks/useAddGiftToWallet";
import nestaLogo from "@/assets/nesta-logo.png";

export interface GiftCardRecipientPageProps {
  giftId: string;
  senderName: string;
  recipientName: string;
  amount: number;
  theme: GiftCardTheme;
  message?: string;
  giftCode: string;
}

export function GiftCardRecipientPage({
  giftId,
  senderName,
  recipientName,
  amount,
  theme,
  message,
  giftCode,
}: GiftCardRecipientPageProps) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const redeem = useAddGiftToWallet(giftId, giftCode);

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

          {/* Actions */}
          <div className="px-6 pb-6 space-y-4">
            {redeem.isSuccess ? (
              /* Redeemed to wallet */
              <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-bold text-emerald-800">
                    {formatPrice(redeem.redeemedAmount ?? amount)} added to your wallet
                  </p>
                  <p className="text-xs text-emerald-700/80 mt-1">Use it at checkout on any order.</p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 rounded-xl gap-2" onClick={() => navigate("/account/wallet")}>
                    <Wallet className="w-4 h-4" /> My Wallet
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-xl gap-2" onClick={() => navigate("/catalogue")}>
                    <ShoppingBag className="w-4 h-4" /> Shop Now
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Primary — add to wallet */}
                <Button
                  onClick={redeem.addToWallet}
                  disabled={redeem.isPending}
                  className="w-full rounded-xl py-3.5 h-auto text-sm font-semibold gap-2"
                >
                  {redeem.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</>
                  ) : (
                    <><Wallet className="w-4 h-4" /> Add {formatPrice(amount)} to my wallet</>
                  )}
                </Button>
                {!redeem.isLoggedIn && !redeem.isPending && (
                  <p className="text-xs text-center text-muted-foreground">
                    You'll sign in first — just takes a moment.
                  </p>
                )}
                {redeem.error && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-destructive">
                    <XCircle className="w-3.5 h-3.5 shrink-0" /> {redeem.error}
                  </div>
                )}

                {/* Secondary — use the code at checkout */}
                <div className="border-t border-border pt-4 space-y-3">
                  <p className="text-xs text-center text-muted-foreground">Or use the code at checkout</p>
                  <div className="border-2 border-green-300 bg-green-50 rounded-xl px-4 py-3 text-center">
                    <p className="text-lg font-bold font-mono text-green-800 tracking-wider">{giftCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    className="w-full rounded-xl py-3 h-auto text-sm font-semibold gap-2"
                  >
                    {copied ? (
                      <><Check className="w-4 h-4" /> Copied!</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copy Code</>
                    )}
                  </Button>
                </div>
              </>
            )}
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
