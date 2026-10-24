import { formatPrice, type DeliveryChoice, type DeliveryOptions } from '@/lib/api';

/**
 * What the buyer chose, in terms of what the server offered. The server decides every
 * price and day; this only reads them out of its answer and works out what to send back.
 */
export interface SelectedDelivery {
  option: DeliveryChoice;
  /** Kobo. What the buyer is charged for delivery. */
  feeKobo: number;
  /** "YYYY-MM-DD", Lagos. */
  date: string;
  /** "Today", "Tomorrow" or "Wed 22 Oct". */
  dateLabel: string;
  /** The Community Delivery area, when that is what was chosen. */
  zoneName: string | null;
}

/**
 * The chosen option, or null if nothing is chosen or the choice is not on offer (for
 * example after fresh options arrive and that option is gone). Nothing is selected without
 * a quote either, because without one the server would price it by the old rings and the
 * buyer would be charged something other than what is shown.
 */
export function selectedDelivery(
  options: DeliveryOptions | null | undefined,
  choice: DeliveryChoice | null,
): SelectedDelivery | null {
  if (!options || !options.quote || !choice) return null;

  if (choice === 'instant' && options.instant.available) {
    const { feeKobo, date, dateLabel } = options.instant;
    return { option: 'instant', feeKobo, date, dateLabel, zoneName: null };
  }
  if (choice === 'community' && options.community?.status === 'available') {
    const { feeKobo, date, dateLabel, name } = options.community;
    return { option: 'community', feeKobo, date, dateLabel, zoneName: name };
  }
  return null;
}

/** The fields an order request carries so the server can honour the quoted price and day. */
export interface OrderDeliveryFields {
  deliveryQuote: string;
  deliveryOption: DeliveryChoice;
  deliveryLat: number;
  deliveryLng: number;
}

export function orderDeliveryFields(
  options: DeliveryOptions | null | undefined,
  choice: DeliveryChoice | null,
): OrderDeliveryFields | null {
  const selected = selectedDelivery(options, choice);
  if (!selected || !options?.quote) return null;
  return {
    deliveryQuote: options.quote,
    deliveryOption: selected.option,
    // The exact coordinates the quote was issued for, not a re-typed copy.
    deliveryLat: options.lat,
    deliveryLng: options.lng,
  };
}

/** "In about 35 mins" or "In about 1 hr 5 mins": when an Instant delivery is expected, from the server's estimate. */
export function formatEta(minutes: number): string {
  if (minutes < 60) return `In about ${minutes} mins`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `In about ${hours} hr${rest ? ` ${rest} mins` : ''}`;
}

/**
 * When Instant arrives: "In about 35 mins" when the server has an estimate (a delivery today),
 * otherwise the day it gives ("Tomorrow", "Mon 26 Oct"). Pass the delivery date to show it
 * beside a relative day ("Tomorrow · Thu 22 Oct"), as the summary after choosing does.
 */
export function describeInstantTiming(dateLabel: string, etaMinutes: number | null | undefined, ymd?: string): string {
  if (etaMinutes) return formatEta(etaMinutes);
  return ymd ? withDate(dateLabel, ymd) : dateLabel;
}

/** "Instant · Today" or "Community Delivery · Gbagada · Wed 22 Oct": one line for a summary. */
export function describeSelectedDelivery(selected: SelectedDelivery): string {
  return selected.option === 'community'
    ? `Community Delivery${selected.zoneName ? ` · ${selected.zoneName}` : ''} · ${selected.dateLabel}`
    : `Instant · ${selected.dateLabel}`;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "Sat 24 Oct 2026" for a "YYYY-MM-DD" delivery date. Built from the parts, never by
 * parsing the string as a local Date (`new Date("2026-10-24")` is midnight UTC, which a
 * browser west of Greenwich would show as the 23rd) and never with the browser's own date
 * formatting (browsers disagree about the comma after the weekday). So it reads the same
 * everywhere, and the same as the labels the server sends ("Sat 24 Oct").
 */
export function formatDeliveryDay(ymd: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (date.getUTCMonth() !== Number(m[2]) - 1) return null; // 2026-02-31 and friends
  return `${DAY_NAMES[date.getUTCDay()]} ${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "Wed 21 Oct": the same as `formatDeliveryDay`, without the year. */
export function formatDeliveryDayShort(ymd: string): string | null {
  const full = formatDeliveryDay(ymd);
  return full ? full.replace(/ \d{4}$/, '') : null;
}

/**
 * A relative day with its date beside it, "Today · Wed 21 Oct", so the buyer sees both. A
 * label that already is a date ("Sat 24 Oct") is left as it is.
 */
export function withDate(dateLabel: string, ymd: string): string {
  if (dateLabel !== 'Today' && dateLabel !== 'Tomorrow') return dateLabel;
  const date = formatDeliveryDayShort(ymd);
  return date ? `${dateLabel} · ${date}` : dateLabel;
}

/** The delivery facts the server stores on an order and returns on every read of it. */
export interface OrderDeliveryFacts {
  deliveryType?: string | null;
  deliveryZoneName?: string | null;
  scheduledDeliveryDate?: string | null;
  /** Kobo. */
  deliveryFee?: number | null;
}

/**
 * One line about how an existing order is being delivered, from what the server stored:
 * "Community Delivery · Gbagada · Sat 24 Oct 2026 · ₦500". Null for pickup and for orders placed
 * before delivery quotes existed, which carry no type and no day to show.
 */
export function describeOrderDelivery(order: OrderDeliveryFacts | null | undefined): string | null {
  if (!order?.deliveryType) return null;
  const way =
    order.deliveryType === 'community'
      ? `Community Delivery${order.deliveryZoneName ? ` · ${order.deliveryZoneName}` : ''}`
      : 'Instant';
  const day = order.scheduledDeliveryDate ? formatDeliveryDay(order.scheduledDeliveryDate) : null;
  const fee = order.deliveryFee != null ? formatPrice(order.deliveryFee) : null;
  return [way, day, fee].filter(Boolean).join(' · ');
}
