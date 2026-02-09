// Stage definitions
export interface Stage {
  id: string;
  name: string;
  ageRange?: string;
  weightRange?: string;
  description: string;
  emoji: string;
}

export const stagesByAge: Stage[] = [
  { id: 'tiny-tots', name: 'Tiny Tots', ageRange: '0-1 month', description: 'Newborn care', emoji: '👶' },
  { id: 'wiggly-wonders', name: 'Wiggly Wonders', ageRange: '1-3 months', description: 'Early discoveries', emoji: '🌟' },
  { id: 'giggly-rollers', name: 'Giggly Rollers', ageRange: '3-6 months', description: 'Rolling adventures', emoji: '🎈' },
  { id: 'bouncy-buddies', name: 'Bouncy Buddies', ageRange: '6-12 months', description: 'Active exploration', emoji: '🦋' },
  { id: 'steady-steps', name: 'Steady Steps', ageRange: '12-24 months', description: 'First steps', emoji: '👣' },
  { id: 'little-explorers', name: 'Little Explorers', ageRange: '24-36 months', description: 'Big adventures', emoji: '🚀' },
];

export const stagesByWeight: Stage[] = [
  { id: 'weight-1', name: 'Tiny Tots', weightRange: '2-4 kg', description: 'Newborn care', emoji: '👶' },
  { id: 'weight-2', name: 'Wiggly Wonders', weightRange: '4-6 kg', description: 'Early discoveries', emoji: '🌟' },
  { id: 'weight-3', name: 'Giggly Rollers', weightRange: '6-8 kg', description: 'Rolling adventures', emoji: '🎈' },
  { id: 'weight-4', name: 'Bouncy Buddies', weightRange: '8-10 kg', description: 'Active exploration', emoji: '🦋' },
  { id: 'weight-5', name: 'Steady Steps', weightRange: '10-13 kg', description: 'First steps', emoji: '👣' },
  { id: 'weight-6', name: 'Little Explorers', weightRange: '13+ kg', description: 'Big adventures', emoji: '🚀' },
];

// Bundle item in a tier
export interface BundleItem {
  category: string;
  quantity: string;
}

// Bundle tier definition
export interface BundleTier {
  id: string;
  name: string;
  type: 'essentials' | 'essentials-plus' | 'care-plus' | 'complete-care';
  summary: string;
  contents: BundleItem[];
  basePrice: number;
  isPopular?: boolean;
}

export const bundleTiers: BundleTier[] = [
  {
    id: 'essentials',
    name: 'Essentials',
    type: 'essentials',
    summary: 'Diapers only',
    contents: [
      { category: 'Diapers', quantity: '2 Jumbo + 1 Midi pack' },
    ],
    basePrice: 12500,
  },
  {
    id: 'essentials-plus',
    name: 'Essentials Plus',
    type: 'essentials-plus',
    summary: 'Diapers + Wipes',
    contents: [
      { category: 'Diapers', quantity: '2 Jumbo + 1 Midi pack' },
      { category: 'Wipes', quantity: '6 packs' },
    ],
    basePrice: 16800,
    isPopular: true,
  },
  {
    id: 'care-plus',
    name: 'Care Plus',
    type: 'care-plus',
    summary: 'Diapers + Wipes + Vaseline',
    contents: [
      { category: 'Diapers', quantity: '2 Jumbo + 1 Midi pack' },
      { category: 'Wipes', quantity: '6 packs' },
      { category: 'Vaseline', quantity: '1 tub' },
    ],
    basePrice: 19500,
  },
  {
    id: 'complete-care',
    name: 'Complete Care',
    type: 'complete-care',
    summary: 'Diapers + Wipes + Vaseline + Lotion + Wash + Oil',
    contents: [
      { category: 'Diapers', quantity: '2 Jumbo + 1 Midi pack' },
      { category: 'Wipes', quantity: '6 packs' },
      { category: 'Vaseline', quantity: '1 tub' },
      { category: 'Lotion', quantity: '1 bottle' },
      { category: 'Baby Wash', quantity: '1 bottle' },
      { category: 'Baby Oil', quantity: '1 bottle' },
    ],
    basePrice: 28000,
  },
];

// Product size options
export interface ProductSize {
  id: string;
  name: string;
  weightRange?: string;
  priceDelta: number;
}

export const diaperSizes: ProductSize[] = [
  { id: 'size-1', name: 'Size 1', weightRange: '2-5 kg', priceDelta: 0 },
  { id: 'size-2', name: 'Size 2', weightRange: '3-6 kg', priceDelta: 0 },
  { id: 'size-3', name: 'Size 3', weightRange: '5-9 kg', priceDelta: 200 },
  { id: 'size-4', name: 'Size 4', weightRange: '7-14 kg', priceDelta: 400 },
];

// Product brand/variant options
export interface ProductVariant {
  id: string;
  name: string;
  brand: string;
  priceDelta: number;
  image?: string;
}

export const diaperVariants: ProductVariant[] = [
  { id: 'kisskids-superdry', name: 'Super Dry', brand: 'KissKids', priceDelta: 0 },
  { id: 'kisskids-eco', name: 'Eco Friendly', brand: 'KissKids', priceDelta: 500 },
  { id: 'pampers-premium', name: 'Premium Care', brand: 'Pampers', priceDelta: 1500 },
  { id: 'huggies-comfort', name: 'Comfort', brand: 'Huggies', priceDelta: 1200 },
];

export const wipesVariants: ProductVariant[] = [
  { id: 'pears-unscented', name: 'Unscented', brand: 'Pears', priceDelta: 0 },
  { id: 'pears-scented', name: 'Lavender Scented', brand: 'Pears', priceDelta: 200 },
  { id: 'johnsons-sensitive', name: 'Sensitive', brand: "Johnson's", priceDelta: 300 },
];

export const skinCareVariants: ProductVariant[] = [
  { id: 'johnsons-original', name: 'Original', brand: "Johnson's", priceDelta: 0 },
  { id: 'cerave-baby', name: 'Baby', brand: 'CeraVe', priceDelta: 800 },
  { id: 'aveeno-baby', name: 'Baby', brand: 'Aveeno', priceDelta: 600 },
];

// Packaging options
export interface PackagingOption {
  id: string;
  name: string;
  priceDelta: number;
}

export const diaperPackaging: PackagingOption[] = [
  { id: 'jumbo', name: 'Jumbo', priceDelta: 0 },
  { id: 'midi', name: 'Midi', priceDelta: -300 },
];

export const wipesPackaging: PackagingOption[] = [
  { id: 'big', name: 'Big', priceDelta: 0 },
  { id: 'regular', name: 'Regular', priceDelta: -100 },
];

// Configured bundle product
export interface ConfiguredProduct {
  category: string;
  selectedVariant: ProductVariant;
  selectedSize?: ProductSize;
  selectedPackaging?: PackagingOption;
  quantity: number;
}

// Delivery frequency type
export type DeliveryFrequency = 'one-time' | 'bi-weekly' | 'monthly';

// Subscription configuration
export interface SubscriptionConfig {
  frequency: DeliveryFrequency;
  startDate: Date;
}

// Helper to get stage by ID
export function getStageById(stageId: string): Stage | undefined {
  return stagesByAge.find(s => s.id === stageId) || stagesByWeight.find(s => s.id === stageId);
}

// Helper to get tier by ID
export function getTierById(tierId: string): BundleTier | undefined {
  return bundleTiers.find(t => t.id === tierId);
}

// Pickup station type
export interface PickupStation {
  id: string;
  name: string;
  address: string;
  dayOfWeek: string;
  hours: string;
  phoneNumber: string;
}

// Pickup stations data
export const pickupStations: PickupStation[] = [
  {
    id: 'noic-gbagada',
    name: 'NOIC Gbagada',
    address: 'Charly Boy bus-stop, Gbagada/Oworo Expressway, Lagos',
    dayOfWeek: 'Tuesdays',
    hours: '6pm - 9pm',
    phoneNumber: '07081940881',
  },
  {
    id: 'charity-pavilion',
    name: 'Charity Pavilion',
    address: 'Abule-Ado, Lagos',
    dayOfWeek: 'Sundays',
    hours: '2pm - 4pm',
    phoneNumber: '07081940881',
  },
];

// Delivery information
export interface DeliveryInfo {
  deliveryMethod: 'pickup' | 'address';
  // For pickup
  pickupStationId?: string;
  pickupStationName?: string;
  pickupStationAddress?: string;
  pickupStationDay?: string;
  pickupStationHours?: string;
  pickupStationPhone?: string;
  // For address delivery
  fullName?: string;
  phoneNumber?: string;
  deliveryAddress?: string;
}

// Order for checkout
export interface Order {
  id: string;
  products: ConfiguredProduct[];
  tier: BundleTier;
  stage: Stage;
  orderType: 'subscribe' | 'one-time';
  totalPrice: number;
  deliveryInfo: DeliveryInfo;
}

// Generate order ID helper
export function generateOrderId(): string {
  return `NST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// Format price in Naira
export function formatPrice(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

// Calculate subscription price (5% discount)
export function getSubscriptionPrice(basePrice: number): number {
  return Math.round(basePrice * 0.95);
}

// Stage pricing multipliers (simulate different prices per stage)
export const stagePriceMultipliers: Record<string, number> = {
  'tiny-tots': 1.0,
  'wiggly-wonders': 1.05,
  'giggly-rollers': 1.08,
  'bouncy-buddies': 1.12,
  'steady-steps': 1.15,
  'little-explorers': 1.18,
  'weight-1': 1.0,
  'weight-2': 1.05,
  'weight-3': 1.08,
  'weight-4': 1.12,
  'weight-5': 1.15,
  'weight-6': 1.18,
};

export function getPriceForStage(basePrice: number, stageId: string | null): number {
  if (!stageId) return basePrice;
  const multiplier = stagePriceMultipliers[stageId] || 1.0;
  return Math.round(basePrice * multiplier);
}

// Product category definition for Assisted Shopping
export interface ProductCategory {
  id: string;
  name: string;
  emoji: string;
  iconPath?: string;
  defaultQuantity: number;
  hasSize: boolean;
  variants: ProductVariant[];
  basePrice: number;
}

export const productCategories: ProductCategory[] = [
  { 
    id: 'diapers', 
    name: 'Diapers', 
    emoji: '🩲',
    iconPath: '@/assets/icons/icon-diapers.png',
    defaultQuantity: 2,
    hasSize: true,
    variants: diaperVariants,
    basePrice: 8000,
  },
  { 
    id: 'wipes', 
    name: 'Wipes', 
    emoji: '🧻',
    iconPath: '@/assets/icons/icon-wipes.png',
    defaultQuantity: 4,
    hasSize: false,
    variants: wipesVariants,
    basePrice: 2500,
  },
  { 
    id: 'body-lotion', 
    name: 'Body Lotion', 
    emoji: '🧴',
    iconPath: '@/assets/icons/icon-body-lotion.png',
    defaultQuantity: 1,
    hasSize: false,
    variants: skinCareVariants,
    basePrice: 2000,
  },
  { 
    id: 'body-cream', 
    name: 'Body Cream', 
    emoji: '🧈',
    iconPath: '@/assets/icons/icon-body-cream.png',
    defaultQuantity: 1,
    hasSize: false,
    variants: skinCareVariants,
    basePrice: 1800,
  },
  { 
    id: 'baby-wash', 
    name: 'Baby Wash', 
    emoji: '🫧',
    iconPath: '@/assets/icons/icon-baby-wash.png',
    defaultQuantity: 1,
    hasSize: false,
    variants: skinCareVariants,
    basePrice: 2200,
  },
  { 
    id: 'baby-oil', 
    name: 'Baby Oil', 
    emoji: '💧',
    iconPath: '@/assets/icons/icon-baby-oil.png',
    defaultQuantity: 1,
    hasSize: false,
    variants: skinCareVariants,
    basePrice: 1500,
  },
];

// Helper to get recommended size for stage
export function getRecommendedSizeForStage(stageId: string): ProductSize {
  const sizeMap: Record<string, string> = {
    'tiny-tots': 'size-1',
    'weight-1': 'size-1',
    'wiggly-wonders': 'size-2',
    'weight-2': 'size-2',
    'giggly-rollers': 'size-2',
    'weight-3': 'size-2',
    'bouncy-buddies': 'size-3',
    'weight-4': 'size-3',
    'steady-steps': 'size-3',
    'weight-5': 'size-3',
    'little-explorers': 'size-4',
    'weight-6': 'size-4',
  };
  
  const sizeId = sizeMap[stageId] || 'size-2';
  return diaperSizes.find(s => s.id === sizeId) || diaperSizes[0];
}

// Helper to get category by ID
export function getCategoryById(categoryId: string): ProductCategory | undefined {
  return productCategories.find(c => c.id === categoryId);
}

// Helper to calculate base price from selected categories
export function calculateCategoryBasePrice(categoryIds: string[]): number {
  return categoryIds.reduce((sum, catId) => {
    const category = productCategories.find(c => c.id === catId);
    return sum + (category?.basePrice || 0);
  }, 0);
}

// Stage-specific bundle content overrides
// Some stages have extra items in certain tiers
export const stageBundleContents: Record<string, Record<string, BundleItem[]>> = {
  'tiny-tots': {}, // Uses default tier contents
  'wiggly-wonders': {
    'essentials-plus': [
      { category: 'Diapers', quantity: '2 Jumbo + 1 Midi pack' },
      { category: 'Wipes', quantity: '6 packs' },
      { category: 'Lotion', quantity: '1 bottle' },
    ],
    'care-plus': [
      { category: 'Diapers', quantity: '2 Jumbo + 1 Midi pack' },
      { category: 'Wipes', quantity: '6 packs' },
      { category: 'Vaseline', quantity: '1 tub' },
      { category: 'Lotion', quantity: '1 bottle' },
    ],
  },
  'giggly-rollers': {
    'essentials-plus': [
      { category: 'Diapers', quantity: '2 Jumbo + 1 Midi pack' },
      { category: 'Wipes', quantity: '6 packs' },
      { category: 'Lotion', quantity: '1 bottle' },
    ],
    'care-plus': [
      { category: 'Diapers', quantity: '2 Jumbo + 1 Midi pack' },
      { category: 'Wipes', quantity: '6 packs' },
      { category: 'Vaseline', quantity: '1 tub' },
      { category: 'Lotion', quantity: '1 bottle' },
      { category: 'Baby Wash', quantity: '1 bottle' },
    ],
  },
  'bouncy-buddies': {}, // Uses default
  'steady-steps': {}, // Uses default
  'little-explorers': {}, // Uses default
};

// Helper to get bundle contents for a specific stage
// Category descriptions for gifting flow
export const bundleCategoryDescriptions: Record<string, string> = {
  'Diapers': "A month's diaper supply package",
  'Wipes': '2 months worth of wipes usage',
  'Vaseline': 'A tub of petroleum jelly for skin care',
  'Lotion': "A bottle of baby lotion for smoothening baby's skin",
  'Baby Wash': 'A bottle of gentle baby body wash',
  'Baby Oil': 'A bottle of nourishing baby oil',
};

// Category name to catalogue categoryId mapping
export const bundleCategoryToCatalogueId: Record<string, string> = {
  'Diapers': 'diapers',
  'Wipes': 'wipes',
  'Vaseline': 'skincare',
  'Lotion': 'skincare',
  'Baby Wash': 'skincare',
  'Baby Oil': 'skincare',
};

export function getBundleContentsForStage(tierId: string, stageId: string): BundleItem[] {
  const tier = getTierById(tierId);
  if (!tier) return [];
  
  const stageOverrides = stageBundleContents[stageId];
  if (stageOverrides && stageOverrides[tierId]) {
    return stageOverrides[tierId];
  }
  return tier.contents;
}
