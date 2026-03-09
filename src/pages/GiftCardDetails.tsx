import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Send, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import desktopPlaceholder from "@/assets/desktop-placeholder.jpg";
import { GiftCardPreview } from "@/components/gifting/GiftCardPreview";
import { presetAmounts, type GiftCardTheme } from "@/components/gifting/GiftCardThemes";
import { formatPrice, api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { SignInForm } from "@/components/auth/SignInForm";
import { CheckoutPaymentView } from "@/components/checkout/CheckoutPaymentView";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";

interface LocationState {
  theme: GiftCardTheme;
  message: string;
}

const GiftCardDetails = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const state = location.state as LocationState | null;

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [showSummaryDrawer, setShowSummaryDrawer] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [createOrderError, setCreateOrderError] = useState<string | null>(null);

  // Initialize restoredTheme synchronously from localStorage (runs during initial render)
  const [restoredTheme, setRestoredTheme] = useState<GiftCardTheme | null>(() => {
    try {
      const pending = localStorage.getItem('pending_gift_card_purchase');
      if (pending) {
        const data = JSON.parse(pending);
        // Verify data is recent (30 min timeout)
        if (Date.now() - data.timestamp < 30 * 60 * 1000) {
          console.log('[OAuth Restore - Init] Found valid pending purchase, loading theme');
          return data.theme;
        } else {
          console.log('[OAuth Restore - Init] Found expired pending purchase, ignoring');
          localStorage.removeItem('pending_gift_card_purchase');
        }
      }
    } catch (err) {
      console.error('[OAuth Restore - Init] Failed to parse pending purchase:', err);
      localStorage.removeItem('pending_gift_card_purchase');
    }
    return null;
  });

  const [restoredMessage, setRestoredMessage] = useState<string>(() => {
    try {
      const pending = localStorage.getItem('pending_gift_card_purchase');
      if (pending) {
        const data = JSON.parse(pending);
        if (Date.now() - data.timestamp < 30 * 60 * 1000) {
          return data.message || "";
        }
      }
    } catch (err) {
      // Already logged in restoredTheme initializer
    }
    return "";
  });

  // Helper function to create gift card order
  const createGiftCardOrder = async (giftCardData: {
    theme: GiftCardTheme;
    message: string;
    amount: number;
    recipientName: string;
    recipientPhone: string;
  }) => {
    if (!session) {
      throw new Error('User must be authenticated to create order');
    }

    setIsCreatingOrder(true);
    setCreateOrderError(null);

    try {
      console.log('[Create Order] Creating gift card order...', giftCardData);

      const orderResponse = await api.createOrder(
        {
          orderType: 'gift_card',
          fullName: session.user.user_metadata?.name || 'Gift Card Buyer',
          phoneNumber: giftCardData.recipientPhone, // Use recipient phone for now
          giftCardDetails: {
            themeId: giftCardData.theme.id,
            message: giftCardData.message || undefined,
            amount: giftCardData.amount,
            recipientName: giftCardData.recipientName,
            recipientPhone: giftCardData.recipientPhone,
          },
        },
        session.access_token,
      );

      console.log('[Create Order] Order created successfully:', orderResponse);
      setOrderId(orderResponse.orderNumber);
      setShowPayment(true);
      localStorage.removeItem('pending_gift_card_purchase');
    } catch (err) {
      console.error('[Create Order] Failed to create order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order. Please try again.';
      setCreateOrderError(errorMessage);
      throw err;
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Restore form fields and proceed to payment when authenticated
  useEffect(() => {
    const pending = localStorage.getItem('pending_gift_card_purchase');

    if (pending) {
      try {
        const data = JSON.parse(pending);

        // Verify data is recent (30 min timeout)
        if (Date.now() - data.timestamp < 30 * 60 * 1000) {
          console.log('[OAuth Restore - Effect] Restoring form fields and checking auth...');

          // Restore form fields
          if (data.isCustomAmount) {
            setIsCustomAmount(true);
            setCustomAmount((data.amount / 100).toString());
          } else {
            setSelectedAmount(data.amount);
          }
          setRecipientName(data.recipientName);
          setRecipientPhone(data.recipientPhone);

          // If user is authenticated, create order and proceed to payment
          if (session) {
            console.log('[OAuth Restore - Effect] User authenticated, creating order...');
            createGiftCardOrder({
              theme: data.theme,
              message: data.message || '',
              amount: data.amount,
              recipientName: data.recipientName,
              recipientPhone: data.recipientPhone,
            }).catch((err) => {
              console.error('[OAuth Restore - Effect] Failed to create order:', err);
            });
          } else {
            console.log('[OAuth Restore - Effect] User not authenticated yet, waiting...');
          }
        } else {
          console.log('[OAuth Restore - Effect] Data expired, removing...');
          localStorage.removeItem('pending_gift_card_purchase');
        }
      } catch (err) {
        console.error('[OAuth Restore - Effect] Failed to restore purchase:', err);
        localStorage.removeItem('pending_gift_card_purchase');
      }
    }
  }, [session]);

  // Use restored theme if location.state is missing
  const effectiveTheme = state?.theme || restoredTheme;
  const effectiveMessage = state?.message || restoredMessage;

  if (!effectiveTheme) {
    console.log('[Redirect Check] No theme found, redirecting to /gifting/cards');
    return <Navigate to="/gifting/cards" replace />;
  }

  if (!isMobile) {
    return (
      <Layout showNav={false}>
        <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center">
          <img src={desktopPlaceholder} alt="Baby care essentials" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <div className="relative z-10 text-center px-4">
            <h1 className="text-4xl font-bold text-foreground mb-4">Desktop Experience Coming Soon</h1>
            <p className="text-muted-foreground max-w-md mx-auto text-lg font-medium">Browse on a mobile device or a tablet to shop.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Use effective theme and message (from state or restored)
  const theme = effectiveTheme;
  const message = effectiveMessage;

  const effectiveAmount = isCustomAmount
    ? parseInt(customAmount) || 0
    : selectedAmount || 0;

  const isValid =
    effectiveAmount >= 500000 &&
    recipientName.trim().length > 0 &&
    recipientPhone.replace(/\D/g, "").length === 11;

  const handleAmountPill = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustomAmount(false);
    setCustomAmount("");
  };

  const handleCustomToggle = () => {
    setIsCustomAmount(true);
    setSelectedAmount(null);
  };

  const handleProceed = () => {
    if (!isValid) return;
    setShowSummaryDrawer(true);
  };

  const handleProceedToPayment = async () => {
    setShowSummaryDrawer(false);

    if (!session) {
      // Save FULL form data to localStorage before OAuth (don't create order yet)
      const purchaseData = {
        theme,  // Save full theme object
        message,
        amount: effectiveAmount,
        recipientName: recipientName.trim(),
        recipientPhone,
        isCustomAmount,
        timestamp: Date.now(),
      };
      console.log('[Save Purchase] Saving to localStorage:', purchaseData);
      localStorage.setItem('pending_gift_card_purchase', JSON.stringify(purchaseData));
      setShowSignIn(true);
    } else {
      // User is already authenticated - create order via API
      await createGiftCardOrder({
        theme,
        message,
        amount: effectiveAmount,
        recipientName: recipientName.trim(),
        recipientPhone,
      });
    }
  };

  const handleSignedIn = () => {
    setShowSignIn(false);
    setShowPayment(true);
  };

  const handlePaymentConfirmed = () => {
    setShowPayment(false);
    setShowSuccess(true);
  };

  // Sign In View
  if (showSignIn) {
    return (
      <Layout showNav={false}>
        <div className="min-h-screen flex flex-col">
          <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
            <button type="button" onClick={() => setShowSignIn(false)}>
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-semibold text-lg">Sign In</h1>
          </div>
          <SignInForm containerClassName="px-6 pt-4" />
        </div>
      </Layout>
    );
  }

  // Payment View
  if (showPayment) {
    return (
      <CheckoutPaymentView
        orderId={orderId}
        totalAmount={effectiveAmount}
        token={session?.access_token || ''}
        onPaymentConfirmed={handlePaymentConfirmed}
        onBack={() => setShowPayment(false)}
        hideGiftCardRedeem={true}
      />
    );
  }

  // Success View
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Order Received!</h1>

          <p className="text-muted-foreground mb-6">
            Order ID: <span className="font-semibold text-foreground">{orderId}</span>
          </p>

          <Card className="p-4 bg-muted/50 max-w-sm">
            <p className="text-sm text-muted-foreground">
              We've received your order! Once your payment is confirmed, we will email your shareable gift card link directly to you.
            </p>
          </Card>
        </div>

        <div className="p-4 border-t bg-background shrink-0 space-y-2">
          <Button variant="outline" className="w-full h-12 text-base font-semibold" onClick={() => navigate("/orders")}>
            View Order Status
          </Button>
          <Button variant="shop" className="w-full h-12 text-base font-semibold" onClick={() => navigate("/catalogue")}>
            Return to Shop
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Layout showNav={false}>
      <div className="min-h-screen pb-28">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button onClick={() => navigate("/gifting/cards")} className="p-1.5 -ml-1.5 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Gift Card Details</h1>
            <p className="text-xs text-muted-foreground">Amount & recipient</p>
          </div>
        </div>

        {/* Mini Card Preview */}
        <div className="px-4 pt-2 pb-4">
          <div className="w-60 mx-auto">
            <GiftCardPreview theme={theme} recipientName={recipientName} compact />
          </div>
        </div>

        {/* Amount Selector */}
        <div className="px-4">
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
                  placeholder="Enter amount (min ₦5,000)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="pl-7"
                  min={50000}
                />
              </div>
            </div>
          )}
        </div>

        {/* Recipient Details */}
        <div className="px-4 mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Recipient details</h3>
          <Input
            placeholder="Recipient's name"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
          <Input
            type="tel"
            placeholder="Recipient's phone (11 digits)"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
            maxLength={11}
          />
          <div className="flex gap-2 items-start">
            <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              The recipient's phone number is used to verify their identity before they can view the gift card code.
            </p>
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
      <Drawer open={showSummaryDrawer} onOpenChange={setShowSummaryDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Order Summary</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <Card className="p-4 space-y-2 bg-muted/40 border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Theme</span>
                <span className="font-medium text-foreground">{theme.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-foreground">{formatPrice(effectiveAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-medium text-foreground">{recipientName.trim()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium text-foreground">{recipientPhone}</span>
              </div>
              {message && (
                <div className="pt-1.5 border-t border-border/50">
                  <p className="text-xs text-muted-foreground italic">"{message}"</p>
                </div>
              )}
            </Card>
          </div>
          <div className="px-4 pt-2 pb-1 flex gap-2 items-start">
            <Send className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              After payment is confirmed, we'll email the gift card link to <span className="font-semibold text-foreground">you</span>, so you can personally share it with {recipientName.trim()}.
            </p>
          </div>
          <DrawerFooter>
            {createOrderError && (
              <div className="mb-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{createOrderError}</p>
              </div>
            )}
            <Button
              variant="shop"
              className="w-full h-12 text-base font-semibold"
              onClick={handleProceedToPayment}
              disabled={isCreatingOrder}
            >
              {isCreatingOrder ? 'Creating Order...' : 'Proceed to Payment'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Layout>
  );
};

export default GiftCardDetails;
