import type { ReactNode } from "react";
import { Check, CheckCircle, Clock, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GiftLinkShare } from "@/components/gifting/GiftLinkShare";
import type { OutcomeCopy, CtaAction } from "@/lib/giftOutcomeCopy";
import type { OrderStatusGiftCard } from "@/lib/api";

export interface WhatsAppPreviewProps {
  recipientName: string;
  senderName?: string;
  isAnonymous?: boolean;
  /** Gift value in naira (not kobo). */
  amount?: number;
  message?: string;
  giftUrl?: string;
}

function WhatsAppMessagePreview({
  recipientName,
  senderName,
  isAnonymous,
  amount,
  message,
  giftUrl,
}: WhatsAppPreviewProps) {
  const worth = amount ? `₦${amount.toLocaleString("en-NG")}` : "a gift card";
  const hasMessage = !!message?.trim();
  const anonymous = isAnonymous || !senderName?.trim();
  const time = new Date().toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="w-full max-w-sm text-left mt-2 mb-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2 text-center">
        Preview of what {recipientName} will receive
      </p>
      <div className="rounded-2xl bg-[hsl(28,25%,92%)] p-3">
        <div className="rounded-xl bg-white px-4 py-3 shadow-sm text-[13px] leading-relaxed text-foreground/90 space-y-3">
          <p className="font-bold text-foreground">Gift card received</p>
          <p>
            Hi {recipientName},{" "}
            {anonymous ? (
              <>someone just sent you a gift card worth <span className="font-semibold text-foreground">{worth}</span>{hasMessage ? " and a message" : ""} on Nesta Hub.</>
            ) : (
              <><span className="font-semibold text-foreground">{senderName}</span> just sent you a gift card worth <span className="font-semibold text-foreground">{worth}</span>{hasMessage ? " and a message" : ""} on Nesta Hub.</>
            )}
          </p>
          {anonymous && (
            <p className="font-semibold text-foreground">The Sender chose to be anonymous.</p>
          )}
          {hasMessage && <p className="italic">"{message!.trim()}"</p>}
          <p>Your gift card is ready to be viewed and redeemed.</p>
          {giftUrl && (
            <p className="break-all text-foreground/80">{giftUrl}</p>
          )}
          <p>Click the link above to view your gift card.</p>
          <div className="flex justify-end">
            <span className="text-[10px] text-muted-foreground">{time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The waiting screen (PRD §1a).
 *
 * Animated dots, and deliberately NO countdown — the PRD is explicit, and a
 * visible timer turns a pleasant surprise into a deadline the buyer watches
 * expire.
 */
export type OutcomeVariant = "mobile" | "desktop";

/** Mobile takes over the screen; desktop sits in a centred card. */
function Shell({
  variant,
  children,
  footer,
}: {
  variant: OutcomeVariant;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (variant === "desktop") {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded-[24px] bg-white ring-1 ring-foreground/[0.06] shadow-[0_1px_0_hsl(28_25%_25%/0.04),0_18px_40px_-24px_hsl(28_25%_25%/0.35)] p-10 flex flex-col items-center">
          {children}
          {footer && <div className="w-full mt-8 space-y-2">{footer}</div>}
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center justify-center">
        {children}
      </div>
      {footer && (
        <div className="p-4 border-t bg-background shrink-0 space-y-2">{footer}</div>
      )}
    </div>
  );
}

export function PaymentCheckingView({
  variant = "mobile",
}: {
  variant?: OutcomeVariant;
}) {
  return (
    <Shell variant={variant}>
      <div className="flex flex-col items-center text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <Clock className="w-9 h-9 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Checking your payment…
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Hang tight while we confirm your transfer. This usually takes a few
          seconds.
        </p>

        {/* Indeterminate — it reports that we are working, not how long is
            left. A countdown would turn a pleasant surprise into a deadline
            the buyer watches expire (§1a explicitly rules one out). */}
        <div className="w-56 h-1.5 rounded-full bg-secondary overflow-hidden mb-4">
          <div className="h-full w-1/3 rounded-full bg-primary animate-payment-progress" />
        </div>

        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </Shell>
  );
}

interface PaymentOutcomeViewProps {
  copy: OutcomeCopy;
  giftCards: OrderStatusGiftCard[];
  onAction: (action: CtaAction) => void;
  variant?: OutcomeVariant;
  whatsAppPreviewProps?: WhatsAppPreviewProps;
  /** Something to show under the message (the offer to subscribe, after a shop order). */
  afterContent?: ReactNode;
  /**
   * A shop order with the new Subscribe experience on: the Subscribe design's look (as the order-placed screen), with
   * the order ID and delivery under the heading and `afterContent` inside the same card as the message. Off: as before.
   */
  subscribeDesign?: { orderId: string; deliverySummary?: string | null };
}

/** The Subscribe design's version of this screen, for a shop order paid by transfer. Same words and buttons as the usual one. */
function SubscribeDesignOutcome({
  copy,
  onAction,
  afterContent,
  orderId,
  deliverySummary,
}: Pick<PaymentOutcomeViewProps, "copy" | "onAction" | "afterContent"> & { orderId: string; deliverySummary?: string | null }) {
  const settled = copy.view !== "pending";
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-shop-page text-shop-ink">
      <div className="min-h-0 flex-1 overflow-y-auto px-9 pb-4 pt-9">
        <div className="flex flex-col items-center text-center">
          {settled ? (
            <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DDE3DA] text-[#46564A]">
              <Check className="h-[30px] w-[30px]" strokeWidth={2.2} />
            </span>
          ) : (
            <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEDFD2] text-[#7A5A3E]">
              <Clock className="h-[28px] w-[28px]" strokeWidth={2} />
            </span>
          )}
          <h1 className="mt-3.5 max-w-[22ch] text-[28px] font-extrabold leading-[34px] tracking-[-0.02em]">{copy.heading}</h1>
          <p className="mt-1.5 text-[15px] leading-[22px] text-shop-muted">
            Order ID <b className="font-extrabold text-shop-ink">{orderId}</b>
          </p>
          {deliverySummary && (
            <p className="mt-0.5 text-[13.5px] leading-5 text-shop-muted" data-testid="delivery-summary">
              Delivery: {deliverySummary}
            </p>
          )}
        </div>

        {/* One card: what happens with the payment, then (when there is one) the Subscribe panel inside it. */}
        <section aria-label="What happens next" className="mt-10 overflow-hidden rounded-[22px] border border-shop-line bg-white/55">
          <div className="px-5 py-6 text-center text-[13.5px] leading-[21px] text-shop-muted">
            {copy.bodyLead && <p className="font-bold text-shop-ink">{copy.bodyLead}</p>}
            <p>
              {copy.body}
              {copy.bodyHighlight && <b className="font-extrabold text-shop-ink">{copy.bodyHighlight}</b>}
              {copy.bodyAfter}
            </p>
          </div>
          {afterContent}
        </section>
      </div>

      {copy.ctas.length > 0 && (
        <div className="flex shrink-0 flex-col gap-2 border-t border-shop-line bg-[rgba(251,249,246,0.96)] px-5 pb-4 pt-3">
          {copy.ctas.map((cta) => (
            <button
              key={cta.action + cta.label}
              type="button"
              onClick={() => onAction(cta.action)}
              className={
                cta.variant === "primary"
                  ? "flex h-[50px] w-full items-center justify-center rounded-[25px] bg-shop-cta text-[15px] font-extrabold text-shop-cream hover:bg-shop-cta-hover"
                  : "flex h-[50px] w-full items-center justify-center rounded-[25px] border border-shop-line-soft bg-white text-[15px] font-extrabold text-shop-ink"
              }
            >
              {cta.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The settled screen — confirmed, gift sent, or released unconfirmed.
 *
 * Entirely driven by `resolveOutcomeCopy`; this component makes no decisions of
 * its own about wording or which buttons to show.
 */
export function PaymentOutcomeView({
  copy,
  giftCards,
  onAction,
  variant = "mobile",
  whatsAppPreviewProps,
  afterContent,
  subscribeDesign,
}: PaymentOutcomeViewProps) {
  if (subscribeDesign && variant === "mobile") {
    return <SubscribeDesignOutcome copy={copy} onAction={onAction} afterContent={afterContent} {...subscribeDesign} />;
  }
  const settled = copy.view !== "pending";
  const isDesktop = variant === "desktop";

  const footer =
    copy.ctas.length > 0 ? (
      <>
        {copy.ctas.map((cta) => (
          <Button
            key={cta.action + cta.label}
            variant={cta.variant === "primary" ? "shop" : "outline"}
            className={
              isDesktop
                ? "w-full h-11 font-semibold"
                : "w-full h-12 text-base font-semibold"
            }
            onClick={() => onAction(cta.action)}
          >
            {cta.label}
          </Button>
        ))}
      </>
    ) : undefined;

  return (
    <Shell variant={variant} footer={footer}>
      <div className="w-full animate-fade-in">
        <div className="flex flex-col items-center text-center">
          <div
            className={
              settled
                ? "w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6"
                : "w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6"
            }
          >
            {settled ? (
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            ) : (
              <Clock className="w-10 h-10 text-amber-600" />
            )}
          </div>

          <h1
            className={
              isDesktop
                ? "font-display text-3xl tracking-[-0.02em] font-bold text-foreground mb-2 max-w-[22ch]"
                : "text-2xl font-bold text-foreground mb-2 max-w-[22ch]"
            }
          >
            {copy.heading}
          </h1>
          {copy.bodyLead && (
            <p className="text-sm font-medium text-foreground mb-1 max-w-sm">
              {copy.bodyLead}
            </p>
          )}
          <p className="text-sm text-muted-foreground mb-4 max-w-sm leading-relaxed">
            {copy.body}
            {copy.bodyHighlight && (
              <span className="font-semibold text-foreground">
                {copy.bodyHighlight}
              </span>
            )}
            {copy.bodyAfter}
          </p>
          {copy.showWhatsAppPreview && whatsAppPreviewProps && (
            <WhatsAppMessagePreview {...whatsAppPreviewProps} />
          )}
        </div>

        {/* Links and share controls, when there is something to share (§1b) */}
        {copy.showLinks && giftCards.length > 0 && (
          <div className="space-y-3 max-w-md mx-auto">
            {giftCards.map((card) => (
              <div
                key={card.id}
                className="w-full rounded-2xl bg-card ring-1 ring-border p-4 text-left shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Shareable link
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {card.recipientName}
                  </span>
                </div>

                <p className="text-sm font-medium text-foreground break-all mb-4">
                  {card.link}
                </p>

                <GiftLinkShare
                  link={card.link}
                  recipientName={card.recipientName}
                />
              </div>
            ))}
          </div>
        )}

        {afterContent && <div className="mx-auto mt-6 w-full max-w-md">{afterContent}</div>}
      </div>
    </Shell>
  );
}
