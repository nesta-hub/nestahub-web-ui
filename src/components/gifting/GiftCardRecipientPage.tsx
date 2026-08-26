import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, ShoppingBag, Gift, CreditCard, ShoppingCart, Wallet, Loader2, XCircle } from "lucide-react";
import { GiftCardTheme } from "./GiftCardThemes";
import { themeGradients, themeTextColors } from "./giftCardThemeStyles";
import { formatPrice } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAddGiftToWallet } from "@/hooks/useAddGiftToWallet";
import nestaLogo from "@/assets/nesta-logo.png";

export interface GiftCardRecipientPageProps {
  giftId: string;
  /** Absent when the buyer sent the card anonymously. */
  senderName?: string;
  recipientName: string;
  initialValue: number;
  currentBalance: number;
  theme: GiftCardTheme;
  message?: string;
  giftCode: string;
  redeemedByCurrentUser?: boolean;
}

export function GiftCardRecipientPage({
  giftId,
  senderName,
  recipientName,
  initialValue,
  currentBalance,
  theme,
  message,
  giftCode,
  redeemedByCurrentUser,
}: GiftCardRecipientPageProps) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const redeem = useAddGiftToWallet(giftId, giftCode);

  const gradient = themeGradients[theme.id] ?? themeGradients["welcome-world"];
  const cardText = themeTextColors[theme.id] ?? themeTextColors["welcome-world"];

  const showSuccess = redeem.isSuccess || !!redeemedByCurrentUser;
  const isPartial = currentBalance < initialValue;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(giftCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  /* ── Gift card visual ── */
  const giftCardVisual = (
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
        <h2
          className="text-lg sm:text-xl font-bold text-center leading-tight"
          style={{ color: cardText, opacity: 0.9 }}
        >
          {theme.name}
        </h2>
      </div>

      <div className="absolute bottom-4 left-5">
        <p className="text-xs font-medium" style={{ color: cardText, opacity: 0.7 }}>
          For {recipientName}
        </p>
      </div>
      <div className="absolute bottom-4 right-5 text-right">
        <p className="text-sm font-bold" style={{ color: cardText, opacity: 0.85 }}>
          {formatPrice(initialValue)}
        </p>
        {(showSuccess || isPartial) && (
          <p className="text-[10px] font-medium" style={{ color: cardText, opacity: 0.6 }}>
            {showSuccess ? "Used" : `${formatPrice(currentBalance)} left`}
          </p>
        )}
      </div>
    </div>
  );

  const codeSteps = [
    { icon: Copy, text: "Copy your gift card code above" },
    { icon: ShoppingBag, text: "Visit nestahub.ng and browse baby essentials" },
    { icon: ShoppingCart, text: "Add items to your cart and proceed to checkout" },
    { icon: CreditCard, text: 'At payment, tap "Have a gift card?" and paste your code' },
    { icon: Gift, text: "Your gift card balance is applied to your order" },
  ];

  const walletSteps = [
    { icon: Wallet, text: 'Tap "Add to Wallet" above' },
    { icon: Gift, text: `${formatPrice(currentBalance)} lands in your Nesta wallet instantly` },
    { icon: ShoppingBag, text: "Shop anytime at nestahub.ng — no code to remember" },
    { icon: CreditCard, text: 'At checkout, choose "Pay with wallet"' },
    { icon: ShoppingCart, text: "Anything left over stays in your wallet for next time" },
  ];

  const stepList = (steps: { icon: typeof Copy; text: string }[]) => (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <p className="text-sm text-muted-foreground leading-relaxed pt-1">{step.text}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-[480px] space-y-6">
        {/* ── Logo ── */}
        <div className="flex justify-center">
          <img src={nestaLogo} alt="Nesta Hub" className="h-14" />
        </div>

        {/* ── Card ── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 pb-4">{giftCardVisual}</div>

          {/* ── Message & sender ── */}
          {(message || senderName) && (
            <div className="px-6 pb-6 text-center space-y-1.5">
              {message && <p className="text-sm italic text-foreground leading-relaxed">"{message}"</p>}
              {senderName && (
                <p className="text-xs text-muted-foreground">
                  — from <span className="font-semibold text-foreground">{senderName}</span>
                </p>
              )}
            </div>
          )}

          {showSuccess ? (
            /* ── Success state ── */
            <div className="px-6 pb-6 pt-5 space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Congratulations, {recipientName}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You have successfully added your gift card value of{" "}
                  {formatPrice(initialValue)} to your wallet.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full rounded-xl h-auto py-2.5 text-sm font-semibold gap-2"
                  onClick={() => navigate("/account/wallet")}
                >
                  <Wallet className="w-4 h-4" />
                  Go to wallet
                </Button>
                <Button
                  className="w-full rounded-xl h-auto py-2.5 text-sm font-semibold gap-2"
                  onClick={() => navigate("/catalogue")}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Shop
                </Button>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Next steps</p>
                <ol className="space-y-2.5">
                  <li className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      1
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Visit nestahub.ng/shop anytime you want to shop.
                    </p>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      2
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      At checkout, choose{" "}
                      <span className="font-semibold text-foreground">Pay with wallet</span>.
                    </p>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                      3
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Anything left over stays in your wallet for next time.
                    </p>
                  </li>
                </ol>
              </div>
            </div>
          ) : (
            /* ── Pre-redemption state ── */
            <div className="px-6 pb-6 pt-5 space-y-5">
              {/* ── Code ── */}
              <div className="text-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Your Gift Code
                </p>
                <div className="border-2 border-green-300 bg-green-50 rounded-xl px-4 py-4">
                  <p className="text-lg sm:text-xl font-bold font-mono text-green-800 tracking-wider">{giftCode}</p>
                </div>
              </div>

              {/* ── Redemption section ── */}
              <div className="rounded-xl border border-border p-5 space-y-4">
                <div className="text-center space-y-1.5">
                  <h4 className="text-sm font-semibold text-foreground">Redeem your gift card</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Copy the code to paste directly at checkout, or add the gift card value straight to your Nesta wallet
                    so you can shop anytime without remembering it.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    className="w-full rounded-xl h-auto py-2.5 text-sm font-semibold gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </>
                    )}
                  </Button>

                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <span className="relative bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                      or
                    </span>
                  </div>

                  <Button
                    onClick={redeem.addToWallet}
                    disabled={redeem.isPending}
                    className="w-full rounded-xl h-auto py-2.5 text-sm font-semibold gap-2"
                  >
                    {redeem.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding…
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        Add {formatPrice(currentBalance)} to Wallet
                      </>
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
                </div>
              </div>

              {/* ── How to use ── */}
              <div className="pt-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground text-center">How to Use Your Gift Card</h3>

                <Tabs defaultValue="code">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="code" className="text-xs">
                      Use the code directly
                    </TabsTrigger>
                    <TabsTrigger value="wallet" className="text-xs">
                      Add to wallet
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="code" className="pt-4">
                    {stepList(codeSteps)}
                  </TabsContent>
                  <TabsContent value="wallet" className="pt-4">
                    {stepList(walletSteps)}
                  </TabsContent>
                </Tabs>

                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  You only need one of these — adding the gift to your wallet uses up the code.
                </p>
              </div>

              {/* ── Shop Now CTA ── */}
              <Button
                variant="outline"
                className="w-full rounded-xl py-3 h-auto text-sm font-semibold gap-2"
                onClick={() => navigate("/catalogue")}
              >
                <ShoppingBag className="w-4 h-4" />
                Shop Now
              </Button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="text-center space-y-1 pb-4">
          <p className="text-xs font-semibold text-foreground">© 2026 Nesta Hub</p>
          <p className="text-xs text-muted-foreground">Baby care essentials, curated with love</p>
        </div>
      </div>
    </div>
  );
}
