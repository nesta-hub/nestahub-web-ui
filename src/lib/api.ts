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

export interface Category {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  productCount: number;
  isActive: boolean;
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
export interface AgeGroup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ageRangeStart?: number;
  ageRangeEnd?: number;
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

export interface Bundle {
  id: string;
  name: string;
  slug: string;
  totalPrice: number;
  sortOrder: number;
  categories: BundleCategory[];
}

export interface BundlesByAgeGroup {
  ageGroup: AgeGroup;
  bundles: Bundle[];
}

export interface BundlesGroupedResponse {
  ageGroups: BundlesByAgeGroup[];
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

export interface BundleAgeGroupDetail {
  id: string;
  bundleId: string;
  ageGroupId: string;
  sortOrder: number;
  ageGroup: AgeGroup;
  categories: BundleCategoryDetail[];
  categoryCount: number;
  productCount: number;
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
  ageGroupCount: number;
  calculatedPrice: number;
  bundleAgeGroups: BundleAgeGroupDetail[];
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

  // Categories
  async getCategories(): Promise<CategoriesResponse> {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
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

  // Orders
  async createOrder(
    data: {
      orderType: 'shop' | 'bundle' | 'gift_card';
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

  async markPaymentMade(orderNumber: string, token: string): Promise<OrderResponse> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}/payment-made`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to confirm payment');
    }
    return response.json();
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
};

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
  // Gift card specific fields
  giftCardThemeId?: string | null;
  giftCardAmount?: number | null;
  giftCardRecipientName?: string | null;
  giftCardMessage?: string | null;
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
  currentBalance: number;
  senderName: string;
  recipientName: string;
  message?: string;
  status: string;
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

export async function getGiftCard(giftId: string): Promise<GiftCardPublic> {
  const response = await fetch(`${API_BASE_URL}/gift-cards/${giftId}`);
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
