const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface VariantAttribute {
  attributeName: string;
  attributeSlug: string;
  value: string;
  displayValue: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  isInStock: boolean;
  imageUrl?: string;
  description?: string;
  subscriptionPrice?: number;
  recommendedFrequencyWeeks?: number;
  isSubscribable: boolean;
  attributes: VariantAttribute[];
  isActive: boolean;
}

export interface ProductCard {
  id: string;
  name: string;
  brand: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  categoryId: string;
  categoryName: string;
  categoryDisplayName: string;
  categorySlug: string;
  subcategoryId?: string;
  subcategoryName?: string;
  subcategorySlug?: string;
  minPrice: number;
  maxPrice: number;
  variantCount: number;
  isInStock: boolean;
  isActive: boolean;
}

export interface ProductDetail extends ProductCard {
  variants: ProductVariant[];
  availableAttributes: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  iconKey?: string;
  tint?: string;
  groupId?: string;
  sortOrder: number;
  productCount: number;
  isActive: boolean;
  subcategories?: Subcategory[];
}

export interface CategoryGroup {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  categories: Category[];
}

export interface CategoryTreeResponse {
  groups: CategoryGroup[];
  ungrouped: Category[];
}

export interface RecentVariant {
  productId: string;
  productName: string;
  brand: string;
  slug: string;
  imageUrl?: string;
  lastOrderedAt: string;
  variant: ProductVariant;
}

export interface RecentVariantsResponse {
  variants: RecentVariant[];
  total: number;
}

export interface CategoryWithProducts {
  category: Category;
  products: ProductCard[];
  totalProducts: number;
}

export interface FeaturedProductsResponse {
  categories: CategoryWithProducts[];
}

export interface ProductsListResponse {
  products: ProductCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CategoriesResponse {
  categories: Category[];
  total: number;
}

// Gift Bundle Types
export interface GiftCategorySummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

export interface SizeSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface BundleCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  totalPrice: number;
  productCount: number;
  sortOrder: number;
}

/** Curated display item shown in the gifting UI (verbatim from the design). */
export interface BundleDisplayItem {
  name: string;
  detail: string;
  qty: string;
  emoji: string;
}

export interface Bundle {
  id: string;
  name: string;
  slug: string;
  totalPrice: number;
  sortOrder: number;
  size?: SizeSummary | null;
  categories: BundleCategory[];
  /** Curated copy (present once the bundle carries design content). */
  badge?: string | null;
  tagline?: string | null;
  description?: string | null;
  heroImageUrl?: string | null;
  bundleImages?: string[] | null;
  defaultPackagingOptionId?: string | null;
  items?: BundleDisplayItem[];
}

export interface BundlesByGiftCategory {
  giftCategory: GiftCategorySummary;
  bundles: Bundle[];
}

export interface BundlesGroupedResponse {
  giftCategories: BundlesByGiftCategory[];
}

export interface GiftCategoriesListResponse {
  giftCategories: (GiftCategorySummary & { sortOrder: number; isActive: boolean })[];
  total: number;
}

export interface GiftPackageSizesListResponse {
  sizes: (SizeSummary & { sortOrder: number; isActive: boolean })[];
  total: number;
}

export interface BundleProductVariant {
  id: string;
  sku: string;
  price: number;
  imageUrl?: string;
  attributes: VariantAttribute[];
}

export interface BundleCategoryProduct {
  id: string;
  variantId: string;
  quantity: number;
  sortOrder: number;
  variant: BundleProductVariant & {
    product: {
      id: string;
      name: string;
      brand: string;
      slug: string;
    };
  };
}

export interface BundleCategoryDetail {
  id: string;
  categoryId: string;
  description: string;
  sortOrder: number;
  category: {
    id: string;
    name: string;
    displayName: string;
    slug: string;
  };
  products: BundleCategoryProduct[];
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface BundleDetail {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  giftCategory: GiftCategorySummary;
  size?: SizeSummary | null;
  categories: BundleCategoryDetail[];
  categoryCount: number;
  productCount: number;
  calculatedPrice: number;
  priceOverride?: number | null;
  badge?: string | null;
  tagline?: string | null;
  description?: string | null;
  heroImageUrl?: string | null;
  bundleImages?: string[] | null;
  defaultPackagingOptionId?: string | null;
  items?: BundleDisplayItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryProductSummary {
  id: string;
  name: string;
  brand: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  minPrice: number;
  maxPrice: number;
}

export interface CategoryProductsResponse {
  category: {
    id: string;
    name: string;
    displayName: string;
    slug: string;
    description?: string;
  };
  products: CategoryProductSummary[];
  total: number;
}

export interface OrderResponse {
  orderNumber: string;
  status: string;
  orderType: string;
  totalAmount: number; // in kobo
  createdAt: string;
  paymentMadeAt?: string | null;
  /**
   * Guest orders only, returned ONCE at creation and never again. Persisted by
   * `createBulkGiftCardOrder`; read it back with `getClaimToken`.
   */
  claimToken?: string;
}

export const api = {
  // Featured products for landing page
  async getFeaturedProducts(limit: number = 5): Promise<FeaturedProductsResponse> {
    const response = await fetch(`${API_BASE_URL}/products/featured?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch featured products');
    return response.json();
  },

  // Product details
  async getProduct(slugOrId: string): Promise<ProductDetail> {
    const response = await fetch(`${API_BASE_URL}/products/${slugOrId}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },

  // Browse products with filters
  async getProducts(params: {
    category?: string;
    subcategory?: string;
    brand?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'price' | 'createdAt' | 'brand';
    sortOrder?: 'asc' | 'desc';
  }): Promise<ProductsListResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, String(value));
    });
    const response = await fetch(`${API_BASE_URL}/products?${query}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  // Buy-again: the authenticated customer's recently purchased variants
  async getRecentVariants(
    token: string,
    limit = 8,
  ): Promise<RecentVariantsResponse> {
    const response = await fetch(
      `${API_BASE_URL}/products/recent-variants?limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) throw new Error('Failed to fetch recent variants');
    return response.json();
  },

  // Categories
  async getCategories(): Promise<CategoriesResponse> {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  // Full catalogue taxonomy tree: groups -> categories -> subcategories
  async getCategoryTree(): Promise<CategoryTreeResponse> {
    const response = await fetch(`${API_BASE_URL}/categories/tree`);
    if (!response.ok) throw new Error('Failed to fetch category tree');
    return response.json();
  },

  // Customer-facing packaging options (Signature Box / Gift Bag) for gift checkout
  async getPackagingOptions(): Promise<
    Array<{
      id: string;
      name: string;
      description?: string;
      price: number;
      imageUrl?: string;
      sortOrder: number;
    }>
  > {
    const response = await fetch(`${API_BASE_URL}/packaging-options`);
    if (!response.ok) throw new Error('Failed to fetch packaging options');
    return response.json();
  },

  // Gift Bundles
  async getBundles(): Promise<BundlesGroupedResponse> {
    const response = await fetch(`${API_BASE_URL}/gift-bundles`);
    if (!response.ok) throw new Error('Failed to fetch bundles');
    return response.json();
  },

  async getBundle(idOrSlug: string): Promise<BundleDetail> {
    const response = await fetch(`${API_BASE_URL}/gift-bundles/${idOrSlug}`);
    if (!response.ok) throw new Error('Failed to fetch bundle');
    return response.json();
  },

  async getCategoryProducts(categoryId: string): Promise<CategoryProductsResponse> {
    const response = await fetch(`${API_BASE_URL}/gift-bundles/category/${categoryId}/products`);
    if (!response.ok) throw new Error('Failed to fetch category products');
    return response.json();
  },

  async getGiftCategories(): Promise<GiftCategoriesListResponse> {
    const response = await fetch(`${API_BASE_URL}/gift-categories`);
    if (!response.ok) throw new Error('Failed to fetch gift categories');
    return response.json();
  },

  async getGiftPackageSizes(): Promise<GiftPackageSizesListResponse> {
    const response = await fetch(`${API_BASE_URL}/gift-package-sizes`);
    if (!response.ok) throw new Error('Failed to fetch gift package sizes');
    return response.json();
  },

  // Orders
  async createOrder(
    data: {
      orderType: 'shop' | 'bundle' | 'custom_gift' | 'gift_card';
      fullName: string;
      phoneNumber: string;
      deliveryMethod?: 'pickup' | 'address';
      deliverySpeed?: 'standard' | 'weekend' | 'sameday' | 'nextday';
      paymentOption?: 'pay-now' | 'pay-on-delivery';
      pickupStationId?: string | null;
      deliveryAddress?: string | null;
      deliveryLat?: number;
      deliveryLng?: number;
      bundleId?: string | null;
      giftSizeId?: string | null;
      giftRecipientName?: string;
      giftRecipientPhone?: string;
      giftMessage?: string;
      items?: Array<{
        variantId: string;
        quantity: number;
        isAutoRenew: boolean;
        frequencyWeeks?: number | null;
      }>;
      giftCardDetails?: {
        themeId: string;
        message?: string;
        amount: number;
        recipientName: string;
        recipientPhone: string;
      };
    },
    token: string,
  ): Promise<OrderResponse> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create order');
    }
    return response.json();
  },

  // Order a curated, fixed-price gift bundle (separate from createOrder; priced
  // server-side from the bundle's override + optional packaging + delivery).
  async createGiftBundleOrder(
    data: {
      bundleId: string;
      fullName: string;
      phoneNumber?: string;
      deliveryMethod: 'pickup' | 'address';
      deliverySpeed?: 'standard' | 'weekend' | 'sameday' | 'nextday';
      paymentOption?: 'pay-now' | 'pay-on-delivery';
      pickupStationId?: string | null;
      deliveryAddress?: string | null;
      deliveryLat?: number;
      deliveryLng?: number;
      packagingOptionId?: string | null;
      giftRecipientName?: string;
      giftRecipientPhone?: string;
      giftMessage?: string;
    },
    token: string,
  ): Promise<OrderResponse> {
    const response = await fetch(`${API_BASE_URL}/orders/gift-bundle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create gift bundle order');
    }
    return response.json();
  },

  async markPaymentMade(orderNumber: string, token?: string): Promise<OrderResponse> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}/payment-made`, {
      method: 'PATCH',
      headers: ownershipHeaders(token, getClaimToken(orderNumber)),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to confirm payment');
    }
    return response.json();
  },

  async notifyPending(orderNumber: string, token?: string | null): Promise<void> {
    await fetch(`${API_BASE_URL}/orders/${orderNumber}/notify-pending`, {
      method: 'POST',
      headers: ownershipHeaders(token ?? undefined, getClaimToken(orderNumber)),
    });
    // Ignore errors — this is fire-and-forget; a failed notify means a delayed email, not a broken flow.
  },

  async cancelOrder(orderNumber: string, token: string): Promise<OrderResponse> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}/cancel`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to cancel order');
    }
    return response.json();
  },

  async checkPendingMatch(
    items: { variantId: string; quantity: number }[],
    token: string,
  ): Promise<{ match: true; orderNumber: string; totalAmount: number; paymentOption: string | null } | { match: false }> {
    const response = await fetch(`${API_BASE_URL}/orders/check-pending-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
    });
    if (!response.ok) {
      return { match: false };
    }
    return response.json();
  },

  // Public price list — every active variant with its price, grouped by category.
  // Powers the shareable /prices page. No auth.
  async getPriceList(): Promise<PriceListResponse> {
    const response = await fetch(`${API_BASE_URL}/products/price-list`);
    if (!response.ok) throw new Error('Failed to fetch price list');
    return response.json();
  },
};

// ─── Public Price List ────────────────────────────────────────────────────────

export interface PriceListVariant {
  id: string;
  sku: string;
  /** Composed from variant attributes, e.g. "3-6M (up to 8kg)". May be empty. */
  label: string;
  /** Kobo. */
  price: number;
  subscriptionPrice?: number;
  compareAtPrice?: number;
  inStock: boolean;
}

export interface PriceListProduct {
  id: string;
  name: string;
  brand: string;
  slug: string;
  imageUrl?: string;
  variants: PriceListVariant[];
}

export interface PriceListCategory {
  id: string;
  name: string;
  slug: string;
  products: PriceListProduct[];
  variantCount: number;
}

export interface PriceListResponse {
  categories: PriceListCategory[];
  categoryCount: number;
  productCount: number;
  variantCount: number;
  updatedAt: string;
}

// Helper function to format price
export function formatPrice(price: number): string {
  // Convert from kobo (minor units) to Naira (major units)
  const naira = price / 100;
  return `₦${naira.toLocaleString()}`;
}

// Helper function to get price range display
export function getPriceRangeDisplay(minPrice: number, maxPrice: number): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice);
  }
  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
}

// ─── User Orders ──────────────────────────────────────────────────────────────

export interface MyOrderItem {
  productName: string;
  productBrand: string;
  variant: string; // pre-formatted string e.g. "Jumbo · Size 3"
  quantity: number;
  unitPrice: number; // kobo
}

export interface MyOrder {
  orderNumber: string;
  status: string;
  orderType: string;
  totalAmount: number; // kobo
  createdAt: string;
  deliveryMethod: string;
  fullName: string;
  deliveryAddress: string | null;
  pickupStationName: string | null;
  pickupStationAddress: string | null;
  items: MyOrderItem[];
  canCancel: boolean;
  canConfirmPayment: boolean;
  paymentOption: string | null;
  // Bundle specific fields
  bundleId?: string | null;
  bundleName?: string | null;
  giftRecipientName?: string | null;
  giftRecipientPhone?: string | null;
  giftMessage?: string | null;
  // Gift card specific fields
  giftCardThemeId?: string | null;
  giftCardAmount?: number | null;
  giftCardRecipientName?: string | null;
  giftCardMessage?: string | null;
  giftCardOrderItems?: Array<{
    id: string;
    themeId: string;
    amount: number;
    recipientName: string;
    recipientEmail?: string | null;
    recipientPhone?: string | null;
    senderName?: string | null;
    isAnonymous?: boolean | null;
    deliveryMethod?: string | null;
    message?: string | null;
  }> | null;
  /**
   * Cards actually issued — only present once payment is confirmed. Carries
   * the shareable link, which the order items do not.
   */
  giftCards?: Array<{
    id: string;
    link: string;
    themeId: string;
    amount: number;
    recipientName: string;
    deliveryMethod: 'link' | 'email' | 'whatsapp';
    recipientEmail?: string | null;
    deliveredAt?: string | null;
    message?: string | null;
  }> | null;
}

export interface MyOrdersResponse {
  orders: MyOrder[];
}

// ─── User Subscriptions ───────────────────────────────────────────────────────

export interface MySubscriptionAttribute {
  name: string;
  value: string;
}

export interface MySubscription {
  id: string;
  status: string;
  productId: string;
  productName: string;
  productBrand: string;
  productSlug: string;
  categoryId: string;
  variantId: string;
  variantAttributes: MySubscriptionAttribute[];
  frequencyWeeks: number;
  nextRenewalDate: string | null;
  unitPrice: number; // kobo - subscription price
  regularPrice: number; // kobo - original price before discount
  subscriptionPrice: number | null; // kobo - subscription price if available
  quantity: number;
  imageUrl: string | null;
  lastSkipped: boolean; // Indicates if user has already skipped recently
  lastMoved: boolean; // Indicates if user has already moved date recently
  lastDeliveryMethod: string | null; // 'pickup' | 'address' from original order
  lastDeliverySpeed: string | null; // 'standard' | 'weekend' from original order
  lastDeliveryAddress: string | null; // Address from original order
  lastDeliveryLat: number | null; // Latitude from original order
  lastDeliveryLng: number | null; // Longitude from original order
  lastPickupStationId: string | null; // Pickup station ID from original order
  lastPickupStationName: string | null; // Pickup station name for display
}

export interface MySubscriptionsResponse {
  subscriptions: MySubscription[];
}

// Pickup Station Types
export interface PickupStation {
  id: string;
  name: string;
  address: string;
  city?: string;
  dayOfWeek: string;
  hours: string;
  phoneNumber: string;
  isActive: boolean;
  sortOrder: number;
}

// Pickup Station API
export async function getPickupStations(): Promise<PickupStation[]> {
  const response = await fetch(`${API_BASE_URL}/pickup-stations`);
  if (!response.ok) {
    throw new Error('Failed to fetch pickup stations');
  }
  return response.json();
}

// ─── User Orders API ──────────────────────────────────────────────────────────

export async function getMyOrders(token: string): Promise<MyOrdersResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
}

// ─── User Subscriptions API ───────────────────────────────────────────────────

export async function getMySubscriptions(token: string): Promise<MySubscriptionsResponse> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch subscriptions');
  return response.json();
}

export async function pauseSubscription(id: string, token: string): Promise<MySubscription> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/${id}/pause`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to pause subscription');
  return response.json();
}

export async function resumeSubscription(id: string, token: string): Promise<MySubscription> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/${id}/resume`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to resume subscription');
  return response.json();
}

export async function cancelSubscription(id: string, token: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to cancel subscription');
  return response.json();
}

export async function updateSubscriptionFrequency(
  id: string,
  frequencyWeeks: number,
  token: string,
): Promise<MySubscription> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/${id}/frequency`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ frequencyWeeks }),
  });
  if (!response.ok) throw new Error('Failed to update frequency');
  return response.json();
}

export async function updateSubscriptionQuantity(
  id: string,
  quantity: number,
  token: string,
): Promise<MySubscription> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/${id}/quantity`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!response.ok) throw new Error('Failed to update quantity');
  return response.json();
}

export async function updateSubscriptionVariant(
  id: string,
  variantId: string,
  token: string,
): Promise<MySubscription> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/${id}/variant`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ variantId }),
  });
  if (!response.ok) throw new Error('Failed to update variant');
  return response.json();
}

export async function moveSubscriptionNextDate(
  id: string,
  nextDate: string,
  resetSchedule: boolean,
  token: string,
  newFrequencyWeeks?: number,
): Promise<MySubscription> {
  const body: any = { nextDate, resetSchedule };
  if (newFrequencyWeeks !== undefined) {
    body.newFrequencyWeeks = newFrequencyWeeks;
  }

  const response = await fetch(`${API_BASE_URL}/subscriptions/${id}/next-date`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Failed to move next date');
  return response.json();
}

export async function skipSubscriptionCycle(id: string, token: string): Promise<MySubscription> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/${id}/skip`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to skip cycle');
  return response.json();
}

export async function reactivateSubscription(id: string, token: string): Promise<MySubscription> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/${id}/reactivate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to reactivate subscription');
  return response.json();
}

export async function cancelSubscriptionWithReason(
  id: string,
  reason: string | undefined,
  token: string,
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error('Failed to cancel subscription');
  return response.json();
}

export async function changeSubscriptionVariant(
  id: string,
  variantId: string,
  token: string,
  quantity?: number,
): Promise<MySubscription> {
  const body: any = { variantId };
  if (quantity !== undefined) {
    body.quantity = quantity;
  }

  const response = await fetch(`${API_BASE_URL}/subscriptions/${id}/variant`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Failed to change subscription variant');
  return response.json();
}

export async function reorderSubscription(
  id: string,
  deliveryMethod: string,
  deliveryDetails: {
    addressId?: string;
    deliveryAddress?: string;
    deliverySpeed?: string;
    deliveryLat?: number;
    deliveryLng?: number;
    pickupStationId?: string;
  },
  paymentReference: string | undefined,
  token: string,
): Promise<{ orderId: string; nextRenewalDate: string }> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/${id}/reorder`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deliveryMethod,
      deliverySpeed: deliveryDetails.deliverySpeed,
      deliveryAddress: deliveryDetails.deliveryAddress,
      deliveryLat: deliveryDetails.deliveryLat,
      deliveryLng: deliveryDetails.deliveryLng,
      addressId: deliveryDetails.addressId,
      pickupStationId: deliveryDetails.pickupStationId,
      paymentReference,
    }),
  });
  if (!response.ok) throw new Error('Failed to process reorder');
  return response.json();
}

export async function reorderMultipleSubscriptions(
  subscriptionIds: string[],
  deliveryMethod: string,
  deliveryDetails: {
    addressId?: string;
    deliveryAddress?: string;
    deliverySpeed?: string;
    deliveryLat?: number;
    deliveryLng?: number;
    pickupStationId?: string;
  },
  paymentReference: string | undefined,
  token: string,
): Promise<{ orderId: string; nextRenewalDate: string }> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/reorder-multiple`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscriptionIds,
      deliveryMethod,
      deliverySpeed: deliveryDetails.deliverySpeed,
      deliveryAddress: deliveryDetails.deliveryAddress,
      deliveryLat: deliveryDetails.deliveryLat,
      deliveryLng: deliveryDetails.deliveryLng,
      addressId: deliveryDetails.addressId,
      pickupStationId: deliveryDetails.pickupStationId,
      paymentReference,
    }),
  });
  if (!response.ok) throw new Error('Failed to process consolidated reorder');
  return response.json();
}

// ─── Gift Cards ───────────────────────────────────────────────────────────

export interface GiftCardPublic {
  themeId: string;
  initialValue: number;
  currentBalance: number;
  /** Absent when the card was sent anonymously. */
  senderName?: string;
  recipientName: string;
  message?: string;
  status: string;
  code: string;
  redeemedByCurrentUser?: boolean;
}

/**
 * Guest order credentials.
 *
 * A guest has no session, so their claim token IS their proof of ownership for
 * the one order it was issued against. It is returned once at order creation
 * and cannot be recovered — losing it means falling back to the links emailed
 * to them.
 */
const CLAIM_TOKEN_KEY = 'nesta_order_claim_tokens';

type ClaimTokenMap = Record<string, string>;

function readClaimTokens(): ClaimTokenMap {
  try {
    return JSON.parse(localStorage.getItem(CLAIM_TOKEN_KEY) || '{}');
  } catch {
    return {};
  }
}

export function storeClaimToken(orderNumber: string, token: string): void {
  try {
    const all = readClaimTokens();
    all[orderNumber] = token;
    localStorage.setItem(CLAIM_TOKEN_KEY, JSON.stringify(all));
  } catch {
    // Private browsing with storage disabled. The order still exists and the
    // links still reach them by email; only in-app polling is lost.
  }
}

export function getClaimToken(orderNumber: string): string | undefined {
  return readClaimTokens()[orderNumber];
}

export function getAllClaimTokens(): ClaimTokenMap {
  return readClaimTokens();
}

export function clearClaimToken(orderNumber: string): void {
  try {
    const all = readClaimTokens();
    delete all[orderNumber];
    localStorage.setItem(CLAIM_TOKEN_KEY, JSON.stringify(all));
  } catch {
    /* nothing to clean up */
  }
}

/** Bearer session when signed in, claim token when not. Never both. */
function ownershipHeaders(token?: string, claimToken?: string): HeadersInit {
  if (token) return { Authorization: `Bearer ${token}` };
  if (claimToken) return { 'x-claim-token': claimToken };
  return {};
}

export interface BulkGiftCardItem {
  themeId: string;
  amount: number;
  recipientName: string;
  recipientEmail?: string;
  senderName?: string;
  /** Hide the sender name from the recipient. Email/WhatsApp delivery only. */
  isAnonymous?: boolean;
  /** Nigerian number, required for whatsapp delivery. */
  recipientPhone?: string;
  message?: string;
  deliveryMethod: 'link' | 'email' | 'whatsapp';
}

/**
 * Create a gift card order, signed in or as a guest.
 *
 * Pass `token` for a signed-in buyer, or `data.guestEmail` for a guest. A guest
 * response carries `claimToken` — stored here, because it is the only chance to
 * keep it.
 */
export async function createBulkGiftCardOrder(
  data: { fullName: string; guestEmail?: string; giftCards: BulkGiftCardItem[] },
  token?: string,
): Promise<OrderResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/gift-cards/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create gift card order');
  }
  const order: OrderResponse = await response.json();
  if (order.claimToken) storeClaimToken(order.orderNumber, order.claimToken);
  return order;
}

export interface OrderStatusGiftCard {
  id: string;
  link: string;
  recipientName: string;
  amount: number;
  deliveryMethod: 'link' | 'email' | 'whatsapp';
  recipientEmail?: string | null;
  deliveredAt?: string | null;
  senderName?: string | null;
  isAnonymous?: boolean | null;
  message?: string | null;
}

export interface OrderStatus {
  orderNumber: string;
  status: string;
  orderType: string;
  confirmed: boolean;
  isGuest: boolean;
  buyerEmail?: string | null;
  totalAmount: number;
  paymentMadeAt?: string | null;
  giftCards: OrderStatusGiftCard[];
}

/** Poll one order's confirmation state. Drives the post-payment wait (§1). */
export async function getOrderStatus(
  orderNumber: string,
  token?: string,
): Promise<OrderStatus> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}/status`, {
    headers: ownershipHeaders(token, getClaimToken(orderNumber)),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to read order status');
  }
  return response.json();
}

/**
 * Attach a guest order to the account that just signed in.
 *
 * The server consumes the token, so the local copy is dropped either way — on
 * success it is spent, and on failure it will never work.
 */
export async function claimGuestOrder(
  orderNumber: string,
  claimToken: string,
  token: string,
): Promise<{ orderNumber: string }> {
  const response = await fetch(`${API_BASE_URL}/orders/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ claimToken }),
  });
  clearClaimToken(orderNumber);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to claim order');
  }
  return response.json();
}

export interface GiftCardReveal {
  code: string;
}

export interface GiftCardValidation {
  valid: boolean;
  currentBalance: number; // in kobo
  status: string;
  expiresAt: string | null;
  reason?: string; // 'not_found' | 'expired' | 'exhausted' | 'void'
}

export async function getGiftCard(giftId: string, token?: string): Promise<GiftCardPublic> {
  const response = await fetch(`${API_BASE_URL}/gift-cards/${giftId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Gift card not found or has expired');
    }
    throw new Error('Failed to load gift card');
  }
  return response.json();
}

export async function revealGiftCard(giftId: string, phone: string): Promise<GiftCardReveal> {
  const response = await fetch(`${API_BASE_URL}/gift-cards/${giftId}/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Incorrect phone number. Please try again.');
    }
    if (response.status === 404) {
      throw new Error('Gift card not found');
    }
    throw new Error('Verification failed. Please try again.');
  }
  return response.json();
}

export async function validateGiftCard(code: string): Promise<GiftCardValidation> {
  const response = await fetch(`${API_BASE_URL}/gift-cards/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    throw new Error('Failed to validate gift card');
  }
  return response.json();
}

export interface RedeemGiftCardResponse {
  redeemedAmount: number; // in kobo
  walletBalance: number; // in kobo
  transactionId: string;
}

export async function redeemGiftCardToWallet(
  code: string,
  token: string,
): Promise<RedeemGiftCardResponse> {
  const response = await fetch(`${API_BASE_URL}/gift-cards/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    let message = 'Could not redeem this gift card. Please try again.';
    try {
      const body = await response.json();
      if (body?.message) message = Array.isArray(body.message) ? body.message[0] : body.message;
    } catch {
      /* keep default message */
    }
    throw new Error(message);
  }
  return response.json();
}

export interface ApplyGiftCardResponse {
  code: string;
  balance: number; // in kobo
  amountApplied: number; // in kobo
  adjustedTotal: number; // in kobo
}

export async function applyGiftCardToOrder(
  orderNumber: string,
  code: string,
  token: string,
): Promise<ApplyGiftCardResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}/apply-gift-card`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to apply gift card');
  }
  return response.json();
}

export async function removeGiftCardFromOrder(
  orderNumber: string,
  token: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}/gift-card`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to remove gift card');
  }
}

// ─── Wallet ──────────────────────────────────────────────────────────────────

export interface WalletSummary {
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  source: string;
  amount: number;
  balanceAfter: number;
  description?: string;
  orderNumber?: string;
  createdAt: string;
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface ApplyWalletResponse {
  amountApplied: number;
  walletBalance: number;
  adjustedTotal: number;
}

export async function getWalletSummary(token: string): Promise<WalletSummary> {
  const response = await fetch(`${API_BASE_URL}/wallet/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch wallet summary');
  return response.json();
}

export async function getWalletTransactions(
  token: string,
  page = 1,
  limit = 20,
  type?: 'credit' | 'debit',
): Promise<WalletTransactionsResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (type) params.set('type', type);
  const response = await fetch(
    `${API_BASE_URL}/wallet/transactions?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error('Failed to fetch wallet transactions');
  return response.json();
}

export async function applyWalletToOrder(
  orderNumber: string,
  amount: number,
  token: string,
): Promise<ApplyWalletResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}/apply-wallet`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to apply wallet balance');
  }
  return response.json();
}

export async function removeWalletFromOrder(
  orderNumber: string,
  token: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}/wallet`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to remove wallet credit');
  }
}

// ─── Referral ─────────────────────────────────────────────────────────────────

export interface ReferralInfo {
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarned: number;
}

export async function getReferralInfo(token: string): Promise<ReferralInfo> {
  const response = await fetch(`${API_BASE_URL}/wallet/referral`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch referral info');
  return response.json();
}

export async function attributeReferral(
  referralCode: string,
  token: string,
): Promise<{ attributed: boolean; reason?: string }> {
  const response = await fetch(`${API_BASE_URL}/wallet/referral/attribute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ referralCode }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to attribute referral');
  }
  return response.json();
}
