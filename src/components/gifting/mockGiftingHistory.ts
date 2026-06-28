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
  kind: GiftingKind;
  title: string;
  date: string; // ISO
  amount: number; // naira
  status: GiftingStatus;
  deliveryMode: GiftingDeliveryMode;
  recipientName?: string;
  recipientContact?: string;
  shareableLink?: string;
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

export const INITIAL_GIFTING_HISTORY: GiftingHistoryEntry[] = [
  {
    id: "NH-GC-204918",
    kind: "gift-card",
    title: "Gift Card — Tola A.",
    date: "2026-06-12T10:32:00Z",
    amount: 25000,
    status: "delivered",
    deliveryMode: "email",
    recipientName: "Tola A.",
    recipientContact: "tola@example.com",
    theme: "welcome-world",
    message: "Welcome to the world little one. Lots of love from Aunty Bisi.",
  },
  {
    id: "NH-GC-204902",
    kind: "gift-card",
    title: "Gift Card — for you to share",
    date: "2026-06-09T14:11:00Z",
    amount: 15000,
    status: "delivered",
    deliveryMode: "link",
    recipientName: "Shareable link",
    shareableLink: "https://nestahub.ng/gift/redeem/8f4a-92cd-7e10-aa31",
    theme: "little-sunshine",
    message: "A tiny something for your little sunshine.",
  },
  {
    id: "NH-GB-103045",
    kind: "gift-bundle",
    title: "Curated Bundle — Newborn Essentials",
    date: "2026-06-05T08:20:00Z",
    amount: 45000,
    status: "processing",
    deliveryMode: "physical",
    recipientName: "Ifeoma D.",
    recipientContact: "+234 803 555 1024",
    items: [
      { name: "Premium Diapers — Newborn", qty: 2 },
      { name: "Baby Lotion 200ml", qty: 1 },
      { name: "Soft Cotton Wipes", qty: 3 },
    ],
  },
  {
    id: "NH-GC-204871",
    kind: "gift-card",
    title: "Gift Card — Chiamaka O.",
    date: "2026-05-28T17:45:00Z",
    amount: 10000,
    status: "pending-payment",
    deliveryMode: "email",
    recipientName: "Chiamaka O.",
    recipientContact: "chiamaka@example.com",
    theme: "beautiful-blessing",
  },
  {
    id: "NH-GB-102988",
    kind: "gift-bundle",
    title: "Curated Bundle — First Smiles",
    date: "2026-05-18T11:02:00Z",
    amount: 32000,
    status: "delivered",
    deliveryMode: "physical",
    recipientName: "Bisi K.",
    recipientContact: "+234 802 145 7788",
    items: [
      { name: "Baby Wash 300ml", qty: 1 },
      { name: "Diaper Cream", qty: 1 },
      { name: "Muslin Blanket", qty: 2 },
    ],
  },
];
