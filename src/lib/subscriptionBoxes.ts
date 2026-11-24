/**
 * The Subscription tab's API client and the shapes it returns.
 *
 * Mirrors api/src/app/subscription-boxes/box-view.ts: change one, change the other.
 * Money is kobo. Dates are Lagos calendar days ("2026-12-15"); moments are ISO strings.
 *
 * Two ways in: a sign-in (Authorization: Bearer) or, for someone who tapped a link in a
 * WhatsApp message, the link's token (x-box-token). Both can be sent; the server checks
 * they are the same person.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ---- the shapes ------------------------------------------------------------------------

export type BoxStatus = 'scheduled' | 'asked' | 'paid' | 'delivered' | 'skipped' | 'cancelled';

export type RenewalFrequency =
  | { kind: 'weeks'; every: number }
  | { kind: 'month_date'; day: number }
  | { kind: 'month_weekday'; nth: 1 | 2 | 3 | 4 | -1; weekday: number };

export interface BoxLine {
  id: string;
  subscriptionId: string | null;
  variantId: string;
  productName: string;
  brand: string | null;
  variantLabel: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPriceKobo: number;
  lineTotalKobo: number;
  dueDate: string | null;
  kind: 'subscription' | 'one_time';
  /** Its first delivery: subscribed without buying it, and no earlier order has carried it. Shown as "(new)". */
  firstTime?: boolean;
}

export interface BoxDelivery {
  type: 'community' | 'instant' | 'pickup' | null;
  zoneName: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  pickupStationId: string | null;
  pickupStationName: string | null;
}

export interface Box {
  id: string;
  status: BoxStatus;
  deliveryDate: string;
  confirmBy: string;
  late: boolean;
  version: number;
  editable: boolean;
  delivery: BoxDelivery;
  needsDelivery: boolean;
  items: BoxLine[];
  subtotalKobo: number;
  deliveryFeeKobo: number | null;
  totalKobo: number | null;
  order: { orderNumber: string; status: string } | null;
  canPay: boolean;
  canUndoSkip: boolean;
  openDays: Array<{ date: string; confirmBy: string }>;
}

export type UnplannedReason =
  | 'no_location'
  | 'station_missing'
  | 'station_without_weekday'
  | 'outside_delivery_area'
  | 'no_instant_days'
  | 'variant_unavailable'
  | 'no_open_day';

export interface SubscribedItem {
  id: string;
  status: 'active' | 'paused';
  variantId: string;
  productId: string;
  productName: string;
  brand: string | null;
  slug: string | null;
  variantLabel: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPriceKobo: number;
  regularPriceKobo: number;
  subscriptionPriceKobo: number | null;
  /** How many weeks one pack lasts, when we know (the month-fit nudge uses it). */
  recommendedFrequencyWeeks: number | null;
  frequency: RenewalFrequency;
  frequencyLabel: string;
  nextDue: string | null;
  boxId: string | null;
  problem: UnplannedReason | null;
  enrolSource: string | null;
}

export interface MyBoxes {
  boxes: Box[];
  items: SubscribedItem[];
  defaultDelivery: BoxDelivery | null;
  /** The box the link she opened was sent for. Empty when she is signed in. */
  linkBoxId?: string | null;
}

export interface PayResult {
  orderNumber: string;
  totalKobo: number;
  /** Only when she opened a link (no sign-in): the key the pay screen uses for this one order. */
  claimToken: string | null;
}

/** Where a box goes. `scope` only applies when changing a box (not when setting the default). */
export interface LocationInput {
  method: 'address' | 'pickup';
  address?: string;
  lat?: number;
  lng?: number;
  pickupStationId?: string;
  /** At an address: Community Delivery or Instant. Left out, Community inside an area and Instant outside. */
  speed?: 'community' | 'instant';
  scope?: 'box' | 'future';
}

/** The ways of delivering to one address a box could use. Null: not available there. Fees are kobo, null while they cannot be worked out. */
export interface DeliveryOptions {
  community: { feeKobo: number | null } | null;
  instant: { feeKobo: number | null } | null;
}

/** One thing she bought (or usually buys) that she could subscribe to. */
export interface OfferLine {
  /** The line on her order. Null when the offer is built from what she usually buys. */
  orderItemId: string | null;
  variantId: string;
  productName: string;
  brand: string | null;
  variantLabel: string | null;
  imageUrl: string | null;
  quantity: number;
  priceKobo: number;
  subscriptionPriceKobo: number | null;
  recommendedFrequencyWeeks: number | null;
  /** How many of her recent orders had it ("Bought 3 times"). Only in the list of what she usually buys. */
  timesBought: number | null;
}

/**
 * What to say after an order, or on an empty tab.
 * `offer`: things she bought that she could subscribe to. `subscribed`: she has subscribed to something on
 * this order. `none`: nothing to say.
 */
export interface Offer {
  state: 'offer' | 'subscribed' | 'none';
  orderNumber: string | null;
  eligible: OfferLine[];
  subscribed: OfferLine[];
}

export interface OfferPick {
  orderItemId: string;
  frequency: RenewalFrequency;
  /** Weekly only: the day she wants the first one, "YYYY-MM-DD". */
  firstDate?: string;
}

export type OfferSkipReason = 'not_eligible' | 'already_subscribed' | 'invalid_frequency';

export interface OfferResult {
  subscribed: string[];
  skipped: Array<{ orderItemId: string; reason: OfferSkipReason }>;
}

/** One thing in the shop she can subscribe to. */
export interface CatalogItem {
  variantId: string;
  productId: string;
  productName: string;
  brand: string | null;
  slug: string | null;
  variantLabel: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  priceKobo: number;
  subscriptionPriceKobo: number | null;
  recommendedFrequencyWeeks: number | null;
  /** She already subscribes to this one (active or paused). */
  subscribed: boolean;
}

export interface Catalog {
  categories: Array<{ id: string; name: string }>;
  items: CatalogItem[];
}

/** One extra for a box: how many of this variant she wants in it (0 takes it out). */
export interface ExtraInput {
  variantId: string;
  quantity: number;
}

export interface EnrolInput {
  variantId: string;
  quantity: number;
  frequency: RenewalFrequency;
  firstDate?: string;
}

// ---- errors ----------------------------------------------------------------------------

/** An answer from the API that was not a success. `code` is the machine-readable reason, when there is one. */
export class BoxApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly body?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'BoxApiError';
  }
}

export const BOX_CODES = {
  linkOtherAccount: 'BOX_LINK_OTHER_ACCOUNT',
  notEditable: 'BOX_NOT_EDITABLE',
  paymentStarted: 'BOX_PAYMENT_STARTED',
  totalChanged: 'BOX_TOTAL_CHANGED',
  needsDelivery: 'BOX_NEEDS_DELIVERY',
  itemUnavailable: 'BOX_ITEM_UNAVAILABLE',
  deliveryChanged: 'BOX_DELIVERY_CHANGED',
  dayUnavailable: 'BOX_DAY_UNAVAILABLE',
  locationRejected: 'BOX_LOCATION_REJECTED',
  alreadySubscribed: 'ALREADY_SUBSCRIBED',
  orderClosed: 'ORDER_CLOSED',
  extraNotAvailable: 'EXTRA_NOT_AVAILABLE',
  itemNotAvailable: 'ITEM_NOT_AVAILABLE',
} as const;

// ---- the link token --------------------------------------------------------------------

const BOX_TOKEN_KEY = 'nesta_box_token';

/** The token from a link she tapped. Kept for the rest of the visit, never longer. */
export function getBoxToken(): string | null {
  try {
    return sessionStorage.getItem(BOX_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setBoxToken(token: string): void {
  try {
    sessionStorage.setItem(BOX_TOKEN_KEY, token);
  } catch {
    /* the page still works for this load; it cannot be reopened after a refresh */
  }
}

export function clearBoxToken(): void {
  try {
    sessionStorage.removeItem(BOX_TOKEN_KEY);
  } catch {
    /* nothing to clear */
  }
}

// ---- the calls -------------------------------------------------------------------------

type Json = Record<string, unknown> | unknown[];

async function boxFetch<T>(path: string, accessToken: string | null | undefined, init: { method?: string; body?: Json } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const boxToken = getBoxToken();
  if (boxToken) headers['x-box-token'] = boxToken;
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE_URL}/subscription-boxes${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const message = Array.isArray(body.message) ? body.message.join(', ') : typeof body.message === 'string' ? body.message : 'Something went wrong';
    throw new BoxApiError(message, response.status, typeof body.code === 'string' ? body.code : undefined, body);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export const subscriptionBoxesApi = {
  /**
   * Is the new experience on for her? Throws when it cannot find out (the network, the server, or an
   * answer that is not a plain yes or no), so the caller can tell "off" from "do not know".
   */
  async config(accessToken: string | null | undefined): Promise<{ enabled: boolean }> {
    const result = await boxFetch<{ enabled?: unknown }>('/config', accessToken);
    if (typeof result.enabled !== 'boolean') throw new BoxApiError('Unexpected answer', 200);
    return { enabled: result.enabled };
  },

  mine: (accessToken: string | null | undefined) => boxFetch<MyBoxes>('/me', accessToken),

  pay: (accessToken: string | null | undefined, boxId: string, expectedTotalKobo?: number) =>
    boxFetch<PayResult>(`/${boxId}/pay`, accessToken, { method: 'POST', body: expectedTotalKobo === undefined ? {} : { expectedTotalKobo } }),

  skip: (accessToken: string | null | undefined, boxId: string) => boxFetch<{ ok: true }>(`/${boxId}/skip`, accessToken, { method: 'POST' }),
  undoSkip: (accessToken: string | null | undefined, boxId: string) => boxFetch<{ ok: true }>(`/${boxId}/undo-skip`, accessToken, { method: 'POST' }),

  leaveOut: (accessToken: string | null | undefined, boxId: string, subscriptionId: string) =>
    boxFetch<{ ok: true }>(`/${boxId}/leave-out`, accessToken, { method: 'POST', body: { subscriptionId } }),

  moveDay: (accessToken: string | null | undefined, boxId: string, date: string) =>
    boxFetch<{ ok: true }>(`/${boxId}/move`, accessToken, { method: 'POST', body: { date } }),

  changeLocation: (accessToken: string | null | undefined, boxId: string, location: LocationInput) =>
    boxFetch<{ ok: true }>(`/${boxId}/location`, accessToken, { method: 'POST', body: location as unknown as Json }),

  /** Which ways of delivering to this address the box could use (Community Delivery, Instant), and what each costs. Pick-up needs no address. */
  deliveryOptions: (accessToken: string | null | undefined, boxId: string, lat: number, lng: number) =>
    boxFetch<DeliveryOptions>(`/${boxId}/delivery-options?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`, accessToken),

  setDefaultDelivery: (accessToken: string | null | undefined, location: Omit<LocationInput, 'scope'>) =>
    boxFetch<{ ok: true }>('/delivery-default', accessToken, { method: 'PUT', body: location as unknown as Json }),

  setQuantity: (accessToken: string | null | undefined, subscriptionId: string, quantity: number) =>
    boxFetch<{ ok: true }>(`/items/${subscriptionId}/quantity`, accessToken, { method: 'PATCH', body: { quantity } }),

  setVariant: (accessToken: string | null | undefined, subscriptionId: string, variantId: string, quantity?: number) =>
    boxFetch<{ ok: true }>(`/items/${subscriptionId}/variant`, accessToken, { method: 'PATCH', body: quantity === undefined ? { variantId } : { variantId, quantity } }),

  /** Applies at once. Answers with the day the item is next due now. */
  setFrequency: (accessToken: string | null | undefined, subscriptionId: string, frequency: RenewalFrequency) =>
    boxFetch<{ nextDue: string }>(`/items/${subscriptionId}/frequency`, accessToken, { method: 'PATCH', body: { frequency } }),

  pause: (accessToken: string | null | undefined, subscriptionId: string) => boxFetch<{ ok: true }>(`/items/${subscriptionId}/pause`, accessToken, { method: 'POST' }),
  resume: (accessToken: string | null | undefined, subscriptionId: string) => boxFetch<{ ok: true }>(`/items/${subscriptionId}/resume`, accessToken, { method: 'POST' }),
  reactivate: (accessToken: string | null | undefined, subscriptionId: string) => boxFetch<{ ok: true }>(`/items/${subscriptionId}/reactivate`, accessToken, { method: 'POST' }),

  stop: (accessToken: string | null | undefined, subscriptionId: string, reason?: string) =>
    boxFetch<{ ok: true }>(`/items/${subscriptionId}`, accessToken, { method: 'DELETE', body: reason ? { reason } : undefined }),

  enrol: (accessToken: string | null | undefined, input: EnrolInput) =>
    boxFetch<{ subscriptionId: string }>('/enrol', accessToken, { method: 'POST', body: input as unknown as Json }),

  /** What she could subscribe to: from one order (by its number), or from what she usually buys. */
  offer: (accessToken: string | null | undefined, orderNumber?: string) =>
    boxFetch<Offer>(orderNumber ? `/offer?orderNumber=${encodeURIComponent(orderNumber)}` : '/offer', accessToken),

  /** Subscribe to lines of an order she has placed. Each pick that could not be done comes back in `skipped`. */
  subscribeFromOrder: (accessToken: string | null | undefined, orderNumber: string, picks: OfferPick[]) =>
    boxFetch<OfferResult>('/offer/subscribe', accessToken, { method: 'POST', body: { orderNumber, picks } as unknown as Json }),

  /** Everything she can subscribe to, with what she already has marked. */
  catalog: (accessToken: string | null | undefined, categoryId?: string) =>
    boxFetch<Catalog>(categoryId ? `/catalog?categoryId=${encodeURIComponent(categoryId)}` : '/catalog', accessToken),

  /** Set how many of each of these she wants as one-time extras in this box (0 removes it). Safe to repeat. */
  setExtras: (accessToken: string | null | undefined, boxId: string, items: ExtraInput[]) =>
    boxFetch<{ version: number }>(`/${boxId}/extras`, accessToken, { method: 'POST', body: { items } as unknown as Json }),

  removeExtra: (accessToken: string | null | undefined, boxId: string, lineId: string) =>
    boxFetch<{ ok: true }>(`/${boxId}/extras/${lineId}`, accessToken, { method: 'DELETE' }),
};

// ---- small helpers the screens share ---------------------------------------------------

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Tue 15 Dec" for "2026-12-15". The calendar day is read as written, never shifted by the viewer's time zone. */
export function formatDay(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAY_NAMES[weekday]} ${d} ${MONTH_NAMES[m - 1]}`;
}

const lagosParts = (iso: string) => {
  const t = new Date(new Date(iso).getTime() + 3_600_000); // Lagos is UTC+1 all year
  return { ymd: `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`, hour: t.getUTCHours(), minute: t.getUTCMinutes() };
};

/** "Mon 14 Dec, 4pm" for a moment, in Lagos time. */
export function formatDeadline(iso: string): string {
  const { ymd, hour, minute } = lagosParts(iso);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const time = `${h12}${minute ? `:${String(minute).padStart(2, '0')}` : ''}${hour < 12 ? 'am' : 'pm'}`;
  return `${formatDay(ymd)}, ${time}`;
}

/** What to show for where a box goes: "12 Ifako St, Gbagada", "Pick-up: Yaba station", or a prompt. */
export function describePlace(delivery: BoxDelivery): string {
  if (delivery.type === 'pickup') return `Pick-up: ${delivery.pickupStationName ?? 'your station'}`;
  if (delivery.type) return delivery.address ?? 'Your saved address';
  return 'Add a delivery address';
}
