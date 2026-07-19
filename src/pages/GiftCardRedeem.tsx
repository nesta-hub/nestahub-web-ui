import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GiftCardRecipientPage } from "@/components/gifting/GiftCardRecipientPage";
import { giftCardThemes } from "@/components/gifting/GiftCardThemes";
import { getGiftCard } from "@/lib/api";
import { AlertCircle, Loader2 } from "lucide-react";
import nestaLogo from "@/assets/nesta-logo.png";

export default function GiftCardRedeem() {
  const { giftId } = useParams<{ giftId: string }>();
  const navigate = useNavigate();

  const { data: giftCard, isLoading, error } = useQuery({
    queryKey: ["gift-card", giftId],
    queryFn: () => getGiftCard(giftId!),
    enabled: !!giftId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
        <div className="w-full max-w-[480px] space-y-6 text-center">
          <div className="flex justify-center">
            <img src={nestaLogo} alt="Nesta Hub" className="h-14" />
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-sm p-12">
            <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Loading your gift card...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !giftCard) {
    const errorMessage = error instanceof Error
      ? error.message
      : "Failed to load gift card. Please check your link and try again.";

    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
        <div className="w-full max-w-[480px] space-y-6 text-center">
          <div className="flex justify-center">
            <img src={nestaLogo} alt="Nesta Hub" className="h-14" />
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-sm p-12">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {errorMessage}
            </p>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if gift card is usable (allow ACTIVE and PARTIAL statuses)
  if (giftCard.status === "EXHAUSTED" || giftCard.status === "VOID") {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
        <div className="w-full max-w-[480px] space-y-6 text-center">
          <div className="flex justify-center">
            <img src={nestaLogo} alt="Nesta Hub" className="h-14" />
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-sm p-12">
            <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Gift Card {giftCard.status === "EXHAUSTED" ? "Fully Used" : "Not Available"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {giftCard.status === "EXHAUSTED"
                ? "This gift card has been fully used and has no remaining balance."
                : "This gift card has been cancelled and is no longer available."}
            </p>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Find the theme
  const theme = giftCardThemes.find((t) => t.id === giftCard.themeId) || giftCardThemes[0];

  return (
    <GiftCardRecipientPage
      giftId={giftId!}
      senderName={giftCard.senderName}
      recipientName={giftCard.recipientName}
      amount={giftCard.currentBalance}
      theme={theme}
      message={giftCard.message}
      giftCode={giftCard.code}
    />
  );
}
