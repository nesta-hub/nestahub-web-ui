/**
 * What the post-payment screen says, for every combination of the three things
 * that vary (PRD §1b/§1c and the 12-variant matrix).
 *
 * Kept as one pure function because the matrix is genuinely three inputs, not
 * twelve cases. Twelve branches inside JSX is how this rots — and every variant
 * is covered by a test against this function rather than against a component.
 */

export type AuthState = "user" | "guest";
export type DeliveryMethod = "link" | "email" | "whatsapp";
export type OrderKind = "gift_card" | "other";

/** Which screen to render. `confirmed` and `gift-sent` are both success. */
export type OutcomeView = "confirmed" | "gift-sent" | "pending";

export type CtaAction = "order-history" | "gifting" | "shop";

export interface OutcomeCta {
  label: string;
  action: CtaAction;
  variant: "primary" | "outline";
}

export interface OutcomeCopy {
  view: OutcomeView;
  heading: string;
  /** Emphasised lead sentence rendered above the body. */
  bodyLead?: string;
  body: string;
  /** Rendered bold, inline, immediately after `body`. */
  bodyHighlight?: string;
  /** Text following the highlight. */
  bodyAfter?: string;
  /** Show the gift card links with share controls inline. */
  showLinks: boolean;
  /** Show the WhatsApp message preview block (whatsapp delivery, confirmed). */
  showWhatsAppPreview?: boolean;
  ctas: OutcomeCta[];
}

export interface OutcomeInput {
  authState: AuthState;
  deliveryMethod: DeliveryMethod;
  confirmed: boolean;
  orderKind: OrderKind;
  /** Where the buyer will be notified — their account or guest address. */
  buyerEmail?: string | null;
  /** Recipient's email, for email delivery. */
  recipientEmail?: string | null;
  /** Recipient's name, for WhatsApp delivery. */
  recipientName?: string | null;
}

const VIEW_ORDER: OutcomeCta = {
  label: "View Order",
  action: "order-history",
  variant: "outline",
};
const VIEW_STATUS: OutcomeCta = {
  label: "View Order Status",
  action: "order-history",
  variant: "outline",
};
const RETURN_GIFTING: OutcomeCta = {
  label: "Return to Gifting",
  action: "gifting",
  variant: "primary",
};
const RETURN_SHOP: OutcomeCta = {
  label: "Return to Shop",
  action: "shop",
  variant: "primary",
};

/**
 * Buttons for a gift card screen.
 *
 * A guest has no order page, so the "View Order" half is dropped for them —
 * but the return button always stays, so no screen is ever a dead end on a
 * full-screen overlay.
 */
const giftCtas = (auth: AuthState, view?: OutcomeCta): OutcomeCta[] =>
  auth === "user" && view ? [view, RETURN_GIFTING] : [RETURN_GIFTING];

const someone = (name?: string | null) => name || "your recipient";

/**
 * These two fall back differently on purpose.
 *
 * The buyer's own address degrades to "your email", which reads correctly in
 * "we'll notify you at …". A recipient's address must NOT — "sent to your
 * email" would tell the buyer their gift went to themselves.
 */
const buyerAddress = (email?: string | null) => email || "your email";
const recipientAddress = (email?: string | null) => email || "the recipient";

export function resolveOutcomeCopy(input: OutcomeInput): OutcomeCopy {
  const {
    authState,
    deliveryMethod,
    confirmed,
    orderKind,
    buyerEmail,
    recipientEmail,
    recipientName,
  } = input;

  // ── Regular orders: nothing to deliver, nothing to share ──────────────────
  if (orderKind !== "gift_card") {
    return confirmed
      ? {
          view: "confirmed",
          heading: "Payment Confirmed",
          body: "We've received your payment and your order is being processed.",
          showLinks: false,
          ctas: [VIEW_ORDER, RETURN_SHOP],
        }
      : {
          view: "pending",
          heading: "We couldn't confirm your payment just yet",
          bodyLead: "We don't want to keep you waiting.",
          body: "We'll notify you at ",
          bodyHighlight: buyerAddress(buyerEmail),
          bodyAfter: " as soon as it's confirmed.",
          showLinks: false,
          ctas:
            authState === "user"
              ? [VIEW_STATUS, RETURN_SHOP]
              : [RETURN_SHOP],
        };
  }

  // ── Gift cards, confirmed ─────────────────────────────────────────────────
  if (confirmed) {
    if (deliveryMethod === "link") {
      // The buyer delivers this one themselves, so the links ARE the outcome.
      return {
        view: "confirmed",
        heading: "Payment Confirmed",
        body: "Your gift card is ready. Copy or share the link below.",
        showLinks: true,
        // Link delivery ends here: the buyer shares it themselves, so the
        // links ARE the screen and a second call to action would compete.
        ctas: [{ ...RETURN_GIFTING, variant: "outline" }],
      };
    }

    // Delivery is fire-and-forget — the screen appears before the send
    // completes. Copy reflects in-progress, not confirmed delivery.
    return {
      view: "gift-sent",
      heading: "Gift on Its Way!",
      body: "We've sent your gift card to ",
      bodyHighlight:
        deliveryMethod === "email"
          ? recipientAddress(recipientEmail)
          : someone(recipientName),
      bodyAfter:
        deliveryMethod === "email"
          ? ", they'll get it in their inbox immediately."
          : " on WhatsApp.",
      showLinks: false,
      showWhatsAppPreview: deliveryMethod === "whatsapp",
      ctas: [RETURN_GIFTING],
    };
  }

  // ── Gift cards, not confirmed inside the window ───────────────────────────
  if (deliveryMethod === "link") {
    return {
      view: "pending",
      heading: "We couldn't confirm your payment just yet",
      bodyLead: "We don't want to keep you waiting.",
      body: buyerEmail ? "Once confirmed, we'll email your gift card link to " : "Once confirmed, we'll email you your gift card link.",
      bodyHighlight: buyerEmail || undefined,
      bodyAfter: buyerEmail ? "." : undefined,
      showLinks: false,
      ctas: giftCtas(authState, VIEW_STATUS),
    };
  }

  // Naming an address we don't have reads worse than not naming one. With
  // nothing known this used to say "goes to your email and we'll notify you at
  // your email" — the same phrase twice, for two different people.
  const knownDestination =
    deliveryMethod === "email"
      ? recipientEmail
        ? `your gift card goes to ${recipientEmail}`
        : null
      : recipientName
        ? `your gift card goes to ${recipientName} on WhatsApp`
        : null;

  // Build a two-part sentence so the buyer's email can be bolded in the UI.
  // Part 1 (body): everything up to and including the email address placeholder.
  // Part 2 (bodyHighlight): the email itself, rendered bold.
  // Part 3 (bodyAfter): the closing punctuation / WhatsApp suffix.
  const destination = knownDestination
    ? `Once confirmed, ${knownDestination} and we'll notify you at `
    : deliveryMethod === "email"
      ? `Once confirmed, we'll send your gift card to the recipient and notify you at `
      : `Once confirmed, we'll send your gift card to ${someone(recipientName)} on WhatsApp and notify you at `;

  const [bodyText, bodyHL, bodyTail] = buyerEmail
    ? [destination, buyerEmail, "."]
    : [`Once confirmed, we'll let you know.`, undefined, undefined];

  return {
    view: "pending",
    heading: "We couldn't confirm your payment just yet",
    bodyLead: "We don't want to keep you waiting.",
    body: bodyText,
    bodyHighlight: bodyHL,
    bodyAfter: bodyTail,
    showLinks: false,
    ctas: giftCtas(authState, VIEW_STATUS),
  };
}
