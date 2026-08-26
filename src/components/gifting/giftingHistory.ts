import type { MyOrder } from "@/lib/api";

export type GiftingKind = "gift-card" | "gift-bundle";
export type GiftingStatus =
  | "pending-payment"
  | "processing"
  | "delivered"
  | "scheduled"
  | "cancelled";
export type GiftingDeliveryMode = "link" | "email" | "whatsapp" | "physical";

export interface GiftingHistoryEntry {
  id: string;
  orderNumber: string;
  kind: GiftingKind;
  title: string;
  date: string; // ISO
  amount: number; // kobo
  status: GiftingStatus;
  deliveryMode: GiftingDeliveryMode;
  recipientName?: string;
  recipientContact?: string;
  /** Present only once the card has been issued (payment confirmed). */
  shareableLink?: string;
  /** Null while undelivered — a failed send, or a method not yet enabled. */
  deliveredAt?: string | null;
  theme?: string;
  message?: string;
  items?: { name: string; qty: number }[];
}

export const STATUS_LABEL: Record<GiftingStatus, string> = {
  "pending-payment": "Pending payment",
  processing: "Processing",
  delivered: "Delivered",
  scheduled: "Scheduled",
  cancelled: "Cancelled",
};

export const STATUS_NOTE: Record<GiftingStatus, string> = {
  "pending-payment":
    "We're waiting on your bank transfer. Once confirmed, we'll move this to processing.",
  processing: "Payment confirmed. We're preparing this gift for delivery.",
  delivered: "This gift has been delivered to the recipient.",
  scheduled: "Scheduled to be sent on the chosen date.",
  cancelled: "This order was cancelled.",
};

export const DELIVERY_LABEL: Record<GiftingDeliveryMode, string> = {
  link: "Shareable link",
  email: "Email",
  whatsapp: "WhatsApp",
  physical: "Physical delivery",
};

function toStatus(orderStatus: string): GiftingStatus {
  switch (orderStatus) {
    case "order_submitted":
    case "payment_made":
      return "pending-payment";
    case "processing":
      return "processing";
    case "completed":
      return "delivered";
    case "cancelled":
      return "cancelled";
    default:
      return "processing";
  }
}

function toDeliveryMode(method?: string | null): GiftingDeliveryMode {
  if (method === "email" || method === "whatsapp" || method === "link") {
    return method;
  }
  return "link";
}

/**
 * Flatten orders into one entry per gift.
 *
 * A single order can carry several gift cards with different recipients and
 * different links, so the order is not the useful unit here — the card is.
 * Issued cards are preferred over order items because only they carry the
 * shareable link; items are the fallback for orders still awaiting payment,
 * where no card exists yet.
 */
export function mapOrdersToGiftingHistory(
  orders: MyOrder[],
): GiftingHistoryEntry[] {
  const entries: GiftingHistoryEntry[] = [];

  for (const order of orders) {
    const status = toStatus(order.status);

    if (order.orderType === "gift_card") {
      if (order.giftCards?.length) {
        for (const card of order.giftCards) {
          entries.push({
            id: card.id,
            orderNumber: order.orderNumber,
            kind: "gift-card",
            title: `Gift Card — ${card.recipientName}`,
            date: order.createdAt,
            amount: card.amount,
            status,
            deliveryMode: toDeliveryMode(card.deliveryMethod),
            recipientName: card.recipientName,
            recipientContact: card.recipientEmail ?? undefined,
            shareableLink: card.link,
            deliveredAt: card.deliveredAt ?? null,
            theme: card.themeId,
            message: card.message ?? undefined,
          });
        }
        continue;
      }

      if (order.giftCardOrderItems?.length) {
        for (const item of order.giftCardOrderItems) {
          entries.push({
            id: item.id,
            orderNumber: order.orderNumber,
            kind: "gift-card",
            title: `Gift Card — ${item.recipientName}`,
            date: order.createdAt,
            amount: item.amount,
            status,
            // Order items predate the per-card delivery method, so the mode is
            // unknown until the card exists.
            deliveryMode: "link",
            recipientName: item.recipientName,
            theme: item.themeId,
            message: item.message ?? undefined,
          });
        }
        continue;
      }

      // Legacy single-card orders, which carry their details on the order.
      entries.push({
        id: order.orderNumber,
        orderNumber: order.orderNumber,
        kind: "gift-card",
        title: `Gift Card — ${order.giftCardRecipientName ?? "for you to share"}`,
        date: order.createdAt,
        amount: order.giftCardAmount ?? order.totalAmount,
        status,
        deliveryMode: "link",
        recipientName: order.giftCardRecipientName ?? undefined,
        theme: order.giftCardThemeId ?? undefined,
        message: order.giftCardMessage ?? undefined,
      });
      continue;
    }

    if (order.orderType === "gift_bundle") {
      entries.push({
        id: order.orderNumber,
        orderNumber: order.orderNumber,
        kind: "gift-bundle",
        title: order.bundleName
          ? `Curated Bundle — ${order.bundleName}`
          : "Curated Bundle",
        date: order.createdAt,
        amount: order.totalAmount,
        status,
        deliveryMode: "physical",
        recipientName: order.giftRecipientName ?? undefined,
        recipientContact: order.giftRecipientPhone ?? undefined,
        message: order.giftMessage ?? undefined,
        items: order.items.map((i) => ({
          name: i.productName,
          qty: i.quantity,
        })),
      });
    }
  }

  return entries;
}
