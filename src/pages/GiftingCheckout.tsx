import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { useGiftCardCart } from "@/contexts/GiftCardCartContext";
import { SignInForm } from "@/components/auth/SignInForm";
import { CheckoutPaymentView } from "@/components/checkout/CheckoutPaymentView";
import {
  PaymentCheckingView,
  PaymentOutcomeView,
} from "@/components/gifting/PaymentOutcomeView";
import { useOrderConfirmationPoll } from "@/hooks/useOrderConfirmationPoll";
import { resolveOutcomeCopy, type CtaAction } from "@/lib/giftOutcomeCopy";
import { createBulkGiftCardOrder, getOrderStatus } from "@/lib/api";
import { metaPixel } from "@/lib/metaPixel";

const GiftingCheckout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, user, loading } = useAuth();
  const { cards, clearCart } = useGiftCardCart();

  const orderParam = searchParams.get("order");
  const stepParam = searchParams.get("step");

  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState(orderParam ?? "");
  const [serverTotal, setServerTotal] = useState(0);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [createOrderError, setCreateOrderError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);

  const { state: pollState, status: orderStatus } = useOrderConfirmationPoll(
    showSuccess ? orderId : null,
    session?.access_token,
  );

  const createOrder = async (tokenOverride?: string, guestEmailOverride?: string) => {
    const token = tokenOverride ?? session?.access_token;
    const guest = guestEmailOverride ?? guestEmail;
    if ((!token && !guest) || cards.length === 0) return;

    setIsCreatingOrder(true);
    setCreateOrderError(null);
    try {
      const buyerName = token
        ? user?.name || cards[0]?.senderName || "Gift Card Buyer"
        : cards.find((c) => !c.isAnonymous && c.senderName)?.senderName || guest || "Guest";

      const order = await createBulkGiftCardOrder(
        {
          fullName: buyerName,
          ...(token ? {} : { guestEmail: guest ?? undefined }),
          giftCards: cards.map((c) => ({
            themeId: c.theme.id,
            amount: c.amount,
            recipientName: c.recipientName,
            recipientEmail: c.recipientEmail,
            recipientPhone: c.recipientPhone || undefined,
            senderName: c.isAnonymous ? undefined : c.senderName || buyerName,
            isAnonymous: c.isAnonymous ?? false,
            message: c.message,
            deliveryMethod: c.deliveryMethod,
          })),
        },
        token,
      );

      metaPixel.purchase({
        value: cards.reduce((s, c) => s + c.amount, 0) / 100,
        currency: "NGN",
        num_items: cards.length,
        order_id: order.orderNumber,
      });

      clearCart();
      setOrderId(order.orderNumber);
      setServerTotal(order.totalAmount);
      setShowPayment(true);
      navigate(`?order=${order.orderNumber}`, { replace: true });
    } catch (err) {
      setCreateOrderError(
        err instanceof Error ? err.message : "Failed to create order. Please try again.",
      );
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Wait for Supabase session to resolve before acting — on hard reload session
  // is null on the first render and arrives asynchronously. Calling getOrderStatus
  // without a token returns a deliberate 404 (the API never confirms an order
  // exists to an unauthorized caller), so we must wait for loading=false first.
  useEffect(() => {
    if (loading) return;

    if (orderParam) {
      setIsLoadingOrder(true);
      getOrderStatus(orderParam, session?.access_token ?? undefined)
        .then((status) => {
          setServerTotal(status.totalAmount);
          setOrderId(orderParam);
          // Show success screen if payment was made or order is already confirmed/completed
          const pastPayment =
            !!status.paymentMadeAt ||
            status.status === "payment_made" ||
            status.status === "processing" ||
            status.status === "completed";
          if (stepParam === "success" || pastPayment) {
            setShowSuccess(true);
          } else {
            setShowPayment(true);
          }
        })
        .catch(() => {
          navigate("/gifting/cards", { replace: true });
        })
        .finally(() => setIsLoadingOrder(false));
      return;
    }

    if (cards.length === 0) {
      navigate("/gifting/cards", { replace: true });
      return;
    }

    if (user || guestEmail) {
      void createOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handleGuestContinue = async (email: string) => {
    setGuestEmail(email);
    await createOrder(undefined, email);
  };

  const handlePaymentConfirmed = () => {
    navigate(`?order=${orderId}&step=success`, { replace: true });
    setShowPayment(false);
    setShowSuccess(true);
  };

  const handleAction = (action: CtaAction) => {
    switch (action) {
      case "order-history":
        navigate("/orders", { state: { orderNumber: orderId } });
        break;
      case "gifting":
        navigate("/gifting");
        break;
      case "shop":
        navigate("/catalogue");
        break;
    }
  };

  const spinner = (title: string, subtitle?: string) => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground">{title}</p>
        {subtitle && <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>}
      </div>
    </div>
  );

  if (loading || isLoadingOrder) return spinner("Loading your order…", "Please wait a moment");
  if (isCreatingOrder) return spinner("Preparing your order…", "Please wait a moment");

  if (showPayment) {
    return (
      <CheckoutPaymentView
        orderId={orderId}
        totalAmount={serverTotal}
        token={session?.access_token ?? ""}
        onPaymentConfirmed={handlePaymentConfirmed}
        onBack={() => navigate(-1)}
        hideGiftCardRedeem
      />
    );
  }

  if (showSuccess) {
    if (pollState === "waiting") return <PaymentCheckingView />;

    const firstCard = orderStatus?.giftCards?.[0];
    const copy = resolveOutcomeCopy({
      authState: user ? "user" : "guest",
      deliveryMethod: firstCard?.deliveryMethod ?? "link",
      confirmed: pollState === "confirmed",
      orderKind: "gift_card",
      buyerEmail: orderStatus?.buyerEmail ?? guestEmail,
      recipientEmail: firstCard?.recipientEmail,
      recipientName: firstCard?.recipientName,
    });

    const waCard = orderStatus?.giftCards?.find((gc) => gc.deliveryMethod === "whatsapp");
    const whatsAppPreviewProps =
      waCard && pollState === "confirmed"
        ? {
            recipientName: waCard.recipientName,
            senderName: waCard.senderName ?? undefined,
            isAnonymous: waCard.isAnonymous ?? false,
            amount: waCard.amount / 100,
            message: waCard.message ?? undefined,
            giftUrl: waCard.link,
          }
        : undefined;

    return (
      <PaymentOutcomeView
        copy={copy}
        giftCards={orderStatus?.giftCards ?? []}
        onAction={handleAction}
        whatsAppPreviewProps={whatsAppPreviewProps}
      />
    );
  }

  // Sign-in gate — shown when user lands here unauthenticated (or returns from OAuth)
  return (
    <Layout showNav={false}>
      <div className="min-h-screen flex flex-col">
        <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
          <button type="button" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-lg">Checkout</h1>
        </div>

        <SignInForm
          containerClassName="flex-1 flex flex-col items-center justify-start px-6 pt-8 pb-6"
          title="Sign in to continue"
          allowGuest
          guestSubmitting={isCreatingOrder}
          onGuestContinue={handleGuestContinue}
        />

        {createOrderError && (
          <p className="px-6 pb-6 text-sm text-destructive text-center">
            {createOrderError}
          </p>
        )}
      </div>
    </Layout>
  );
};

export default GiftingCheckout;
