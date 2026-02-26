import { useState } from "react";
import { Lock, Unlock, Copy, Check, ShoppingBag, Gift, CreditCard, ShoppingCart } from "lucide-react";
import { GiftCardTheme } from "./GiftCardThemes";
import { themeGradients, themeTextColors } from "./giftCardThemeStyles";
import { formatPrice } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import nestaLogo from "@/assets/nesta-logo.png";

type UnwrappingState = "locked" | "verifying" | "unlocked";

export interface GiftCardRecipientPageProps {
  senderName: string;
  recipientName: string;
  amount: number;
  theme: GiftCardTheme;
  message?: string;
  giftCode?: string;
  onVerify: (phone: string) => Promise<string>; // Returns the gift code
}

export function GiftCardRecipientPage({
  senderName,
  recipientName,
  amount,
  theme,
  message,
  giftCode: initialGiftCode,
  onVerify,
}: GiftCardRecipientPageProps) {
  const [state, setState] = useState<UnwrappingState>(initialGiftCode ? "unlocked" : "locked");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealedCode, setRevealedCode] = useState(initialGiftCode || "");
  const isMobile = useIsMobile();

  const gradient = themeGradients[theme.id] ?? themeGradients["welcome-world"];
  const cardText = themeTextColors[theme.id] ?? themeTextColors["welcome-world"];

  const handleReveal = () => setState("verifying");

  const handleVerify = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) {
      setPhoneError("Please enter a valid phone number");
      return;
    }
    setPhoneError("");
    setVerifying(true);

    try {
      const code = await onVerify(phone);
      setRevealedCode(code);
      setState("unlocked");
    } catch (error) {
      if (error instanceof Error) {
        setPhoneError(error.message);
      } else {
        setPhoneError("Verification failed. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(revealedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  // Check if phone input has enough digits (10-11)
  const phoneDigits = phone.replace(/\D/g, "");
  const isPhoneComplete = phoneDigits.length >= 10 && phoneDigits.length <= 11;

  /* ── Verification form (shared between drawer & dialog) ── */
  const verificationForm = (
    <div className="space-y-5 px-1">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Enter the phone number associated with this gift to unlock your code.
      </p>

      <div>
        <Input
          type="tel"
          placeholder="0801 234 5678"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (phoneError) setPhoneError("");
          }}
          className="w-full"
        />
      </div>

      {phoneError && (
        <p className="text-xs text-destructive font-medium">{phoneError}</p>
      )}

      <Button
        onClick={handleVerify}
        disabled={verifying}
        className={`w-full rounded-xl py-3 h-auto text-sm font-semibold ${
          isPhoneComplete
            ? "bg-[hsl(25,20%,38%)] hover:bg-[hsl(25,35%,20%)] text-white"
            : ""
        }`}
      >
        {verifying ? "Verifying…" : "Verify & Unlock"}
      </Button>
    </div>
  );

  /* ── Gift card visual ── */
  const giftCardVisual = (
    <div
      className="relative w-full aspect-[16/10] rounded-xl overflow-hidden shadow-lg"
      style={{ background: gradient }}
    >
      <span className="absolute top-4 right-5 text-4xl select-none opacity-30">
        {theme.emoji}
      </span>
      <span className="absolute bottom-4 right-5 text-3xl select-none opacity-20">
        {theme.emoji}
      </span>

      <div className="absolute top-4 left-5">
        <img src={nestaLogo} alt="Nesta Hub" className="h-7 opacity-90" />
      </div>

      <div className="absolute top-4 right-5">
        <span
          className="text-[10px] font-semibold tracking-wider uppercase"
          style={{ color: cardText, opacity: 0.5 }}
        >
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
      <div className="absolute bottom-4 right-5">
        <p className="text-sm font-bold" style={{ color: cardText, opacity: 0.85 }}>
          {formatPrice(amount)}
        </p>
      </div>
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
          <div className="p-6 pb-4">
            {giftCardVisual}
          </div>

          {/* ── Message & sender ── */}
          {(message || senderName) && (
            <div className="px-6 pb-5 text-center space-y-1.5">
              {message && (
                <p className="text-sm italic text-foreground leading-relaxed">
                  "{message}"
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                — from <span className="font-semibold text-foreground">{senderName}</span>
              </p>
            </div>
          )}

          {/* ── LOCKED state ── */}
          {state === "locked" && (
            <div className="px-6 pb-6 space-y-4">
              <div className="border border-border rounded-xl px-4 py-3 bg-muted/30 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-mono text-muted-foreground tracking-widest">
                  ●●●●-●●●●-●●●●
                </span>
              </div>

              <Button
                onClick={handleReveal}
                className="w-full rounded-xl py-3 h-auto text-sm font-semibold gap-2 bg-[hsl(25,20%,38%)] hover:bg-[hsl(25,35%,20%)] text-white"
              >
                <Unlock className="w-4 h-4" />
                Reveal Your Code
              </Button>

              {/* ── How to Use ── */}
              <div className="border-t border-border pt-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground text-center">
                  How to Use Your Gift Card
                </h3>

                <div className="space-y-3">
                  {[
                    { icon: Unlock, text: "Tap \"Reveal Your Code\" and verify your phone number to unlock your gift card code" },
                    { icon: ShoppingBag, text: "Visit nestahub.ng and browse baby essentials" },
                    { icon: ShoppingCart, text: "Add items to your cart and proceed to checkout" },
                    { icon: CreditCard, text: "At payment, tap \"Have a gift card?\" and enter your code" },
                    { icon: Gift, text: "Your gift card balance will be applied to your order" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── UNLOCKED state ── */}
          {state === "unlocked" && (
            <div className="px-6 pb-6 space-y-4">
              <div className="text-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Your Gift Code
                </p>
                <div className="border-2 border-green-300 bg-green-50 rounded-xl px-4 py-4">
                  <p className="text-lg sm:text-xl font-bold font-mono text-green-800 tracking-wider">
                    {revealedCode}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleCopy}
                className="w-full rounded-xl py-3 h-auto text-sm font-semibold gap-2"
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

              {/* ── How to Use ── */}
              <div className="border-t border-border pt-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground text-center">
                  How to Use Your Gift Card
                </h3>

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
                      <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Shop Now CTA ── */}
              <Button
                variant="outline"
                className="w-full rounded-xl py-3 h-auto text-sm font-semibold gap-2"
                onClick={() => window.location.href = "/catalogue"}
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
          <p className="text-xs text-muted-foreground">
            Baby care essentials, curated with love
          </p>
        </div>
      </div>

      {/* ── Verification overlay ── */}
      {isMobile ? (
        <Drawer open={state === "verifying"} onOpenChange={(open) => !open && setState("locked")}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Unlock Your Gift</DrawerTitle>
              <DrawerDescription>Verify your identity to reveal your gift card code</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6">
              {verificationForm}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={state === "verifying"} onOpenChange={(open) => !open && setState("locked")}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Unlock Your Gift</DialogTitle>
              <DialogDescription>Verify your identity to reveal your gift card code</DialogDescription>
            </DialogHeader>
            {verificationForm}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
