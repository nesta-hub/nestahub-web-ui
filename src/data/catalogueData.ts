export interface ProductType {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface ProductSizeOption {
  id: string;
  name: string;
  weightRange: string;
  priceDelta: number;
  description?: string;
}

export interface ProductAttribute {
  name: string;
  values: { id: string; name: string }[];
}

export interface CatalogueProduct {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  subcategoryId?: string;
  image?: string;
  types: ProductType[];
  sizes?: ProductSizeOption[];
  attributes?: ProductAttribute[];
}

export interface CatalogueSubcategory {
  id: string;
  name: string;
}

export interface CatalogueCategory {
  id: string;
  name: string;
  displayName: string;
  groupId: string;
  iconKey?: string;
  tint?: string;
  imageUrl?: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
}

// ─── GROUPS ────────────────────────────────────────────────────────────
export const catalogueGroups: CategoryGroup[] = [
  { id: "baby-care", name: "Baby Care" },
  { id: "feeding", name: "Feeding" },
  { id: "health", name: "Health & Wellness" },
  { id: "mum-care", name: "Mum Care" },
  { id: "nursery", name: "Nursery & Gear" },
];

// ─── CATEGORIES ────────────────────────────────────────────────────────
export const catalogueCategories: CatalogueCategory[] = [
  // Baby Care
  { id: "diapers", name: "Diapers", displayName: "Diapers", groupId: "baby-care", iconKey: "diapers" },
  { id: "wipes", name: "Wipes", displayName: "Wipes", groupId: "baby-care", iconKey: "wipes" },
  { id: "skincare", name: "Skin & Bath", displayName: "Skin & Bath", groupId: "baby-care", iconKey: "baby-wash" },
  { id: "baby-powder", name: "Powder", displayName: "Baby Powder", groupId: "baby-care", iconKey: "body-cream" },
  { id: "diaper-cream", name: "Rash Cream", displayName: "Diaper Rash Cream", groupId: "baby-care", iconKey: "body-cream" },
  { id: "baby-shampoo", name: "Shampoo", displayName: "Baby Shampoo", groupId: "baby-care", iconKey: "baby-wash" },
  // Feeding
  { id: "bottles", name: "Bottles", displayName: "Bottles & Teats", groupId: "feeding" },
  { id: "formula", name: "Formula", displayName: "Infant Formula", groupId: "feeding" },
  { id: "bibs", name: "Bibs", displayName: "Bibs & Burp Cloths", groupId: "feeding" },
  { id: "sterilisers", name: "Sterilisers", displayName: "Sterilisers", groupId: "feeding" },
  { id: "breast-pumps", name: "Breast Pumps", displayName: "Breast Pumps", groupId: "feeding" },
  // Health
  { id: "supplements", name: "Vitamins", displayName: "Vitamins & Supplements", groupId: "health" },
  { id: "thermometers", name: "Thermometers", displayName: "Thermometers", groupId: "health" },
  { id: "teething", name: "Teething", displayName: "Teething Care", groupId: "health" },
  { id: "first-aid", name: "First Aid", displayName: "First Aid", groupId: "health" },
  // Mum Care
  { id: "maternity-pads", name: "Maternity Pads", displayName: "Maternity Pads", groupId: "mum-care" },
  { id: "nipple-cream", name: "Nipple Cream", displayName: "Nipple Cream", groupId: "mum-care" },
  { id: "postpartum", name: "Postpartum", displayName: "Postpartum Care", groupId: "mum-care" },
  { id: "mum-supplements", name: "Supplements", displayName: "Mum Supplements", groupId: "mum-care" },
  // Nursery
  { id: "swaddles", name: "Swaddles", displayName: "Swaddles & Wraps", groupId: "nursery" },
  { id: "sleep-bags", name: "Sleep Bags", displayName: "Sleep Bags", groupId: "nursery" },
  { id: "bath-towels", name: "Bath Towels", displayName: "Bath Towels", groupId: "nursery" },
];

export const catalogueSubcategories: Record<string, CatalogueSubcategory[]> = {
  skincare: [
    { id: "lotion", name: "Lotion" },
    { id: "wash", name: "Wash" },
    { id: "oil", name: "Oil" },
    { id: "cream", name: "Cream" },
  ],
  diapers: [
    { id: "tape", name: "Tape" },
    { id: "pants", name: "Pants" },
  ],
  bottles: [
    { id: "bottle", name: "Bottles" },
    { id: "teats", name: "Teats" },
  ],
  supplements: [
    { id: "vitamin-d", name: "Vitamin D" },
    { id: "iron", name: "Iron" },
    { id: "multi", name: "Multivitamin" },
    { id: "probiotic", name: "Probiotic" },
  ],
};

export function getSubcategoriesForCategory(categoryId: string): CatalogueSubcategory[] {
  return catalogueSubcategories[categoryId] ?? [];
}

export function getCategoryById(id: string): CatalogueCategory | undefined {
  return catalogueCategories.find((c) => c.id === id);
}

export function getCategoriesByGroup(groupId: string): CatalogueCategory[] {
  return catalogueCategories.filter((c) => c.groupId === groupId);
}

// ─── PRODUCTS ──────────────────────────────────────────────────────────
export const catalogueProducts: CatalogueProduct[] = [
  // Diapers
  {
    id: "kisskids-superdry",
    name: "Super Dry",
    brand: "KissKids",
    categoryId: "diapers",
    subcategoryId: "tape",
    types: [
      { id: "jumbo", name: "Jumbo", price: 5000, description: "60 pieces per pack" },
      { id: "eco-small", name: "Eco Small", price: 2500, description: "30 pieces per pack" },
    ],
    sizes: [
      { id: "size-1", name: "Size 1", weightRange: "2-5 kg", priceDelta: 0 },
      { id: "size-2", name: "Size 2", weightRange: "3-6 kg", priceDelta: 0 },
      { id: "size-3", name: "Size 3", weightRange: "5-9 kg", priceDelta: 200 },
      { id: "size-4", name: "Size 4", weightRange: "7-14 kg", priceDelta: 400 },
    ],
  },
  {
    id: "pampers-premium",
    name: "Premium Care",
    brand: "Pampers",
    categoryId: "diapers",
    subcategoryId: "tape",
    types: [
      { id: "jumbo", name: "Jumbo", price: 6500, description: "58 pieces per pack" },
      { id: "midi", name: "Midi", price: 4000, description: "34 pieces per pack" },
    ],
    sizes: [
      { id: "size-1", name: "Size 1", weightRange: "2-5 kg", priceDelta: 0 },
      { id: "size-2", name: "Size 2", weightRange: "3-6 kg", priceDelta: 0 },
      { id: "size-3", name: "Size 3", weightRange: "5-9 kg", priceDelta: 300 },
      { id: "size-4", name: "Size 4", weightRange: "7-14 kg", priceDelta: 500 },
    ],
  },
  {
    id: "huggies-comfort",
    name: "Comfort",
    brand: "Huggies",
    categoryId: "diapers",
    subcategoryId: "pants",
    types: [
      { id: "jumbo", name: "Jumbo", price: 5500, description: "56 pieces per pack" },
      { id: "big", name: "Big", price: 3500, description: "36 pieces per pack" },
    ],
    sizes: [
      { id: "size-1", name: "Size 1", weightRange: "2-5 kg", priceDelta: 0 },
      { id: "size-2", name: "Size 2", weightRange: "3-6 kg", priceDelta: 0 },
      { id: "size-3", name: "Size 3", weightRange: "5-9 kg", priceDelta: 150 },
      { id: "size-4", name: "Size 4", weightRange: "7-14 kg", priceDelta: 350 },
    ],
  },
  {
    id: "kisskids-eco",
    name: "Eco Care",
    brand: "KissKids",
    categoryId: "diapers",
    subcategoryId: "pants",
    types: [
      { id: "jumbo", name: "Jumbo", price: 4500, description: "54 pieces per pack" },
      { id: "eco-small", name: "Eco Small", price: 2200, description: "28 pieces per pack" },
    ],
    sizes: [
      { id: "size-1", name: "Size 1", weightRange: "2-5 kg", priceDelta: 0 },
      { id: "size-2", name: "Size 2", weightRange: "3-6 kg", priceDelta: 0 },
      { id: "size-3", name: "Size 3", weightRange: "5-9 kg", priceDelta: 200 },
      { id: "size-4", name: "Size 4", weightRange: "7-14 kg", priceDelta: 400 },
    ],
  },
  // Wipes
  {
    id: "pears-unscented",
    name: "Unscented",
    brand: "Pears",
    categoryId: "wipes",
    types: [
      { id: "big", name: "Big", price: 1800, description: "80 wipes" },
      { id: "medium", name: "Medium", price: 1200, description: "50 wipes" },
      { id: "small", name: "Small", price: 800, description: "30 wipes" },
    ],
  },
  {
    id: "pampers-sensitive",
    name: "Sensitive",
    brand: "Pampers",
    categoryId: "wipes",
    types: [
      { id: "big", name: "Big", price: 2200, description: "80 wipes" },
      { id: "medium", name: "Medium", price: 1500, description: "50 wipes" },
      { id: "small", name: "Small", price: 1000, description: "30 wipes" },
    ],
  },
  {
    id: "huggies-pure",
    name: "Pure Water",
    brand: "Huggies",
    categoryId: "wipes",
    types: [
      { id: "big", name: "Big", price: 2000, description: "80 wipes" },
      { id: "medium", name: "Medium", price: 1400, description: "50 wipes" },
      { id: "small", name: "Small", price: 900, description: "30 wipes" },
    ],
  },
  {
    id: "johnsons-gentle",
    name: "Gentle Clean",
    brand: "Johnsons",
    categoryId: "wipes",
    types: [
      { id: "big", name: "Big", price: 1900, description: "80 wipes" },
      { id: "medium", name: "Medium", price: 1300, description: "50 wipes" },
      { id: "small", name: "Small", price: 850, description: "30 wipes" },
    ],
  },
  // Skincare
  {
    id: "johnsons-baby-lotion",
    name: "Baby Lotion",
    brand: "Johnsons",
    categoryId: "skincare",
    subcategoryId: "lotion",
    types: [
      { id: "large", name: "Large", price: 3500 },
      { id: "medium", name: "Medium", price: 2500 },
      { id: "small", name: "Small", price: 1500 },
    ],
  },
  {
    id: "cetaphil-baby",
    name: "Baby Wash",
    brand: "Cetaphil",
    categoryId: "skincare",
    subcategoryId: "wash",
    types: [
      { id: "large", name: "Large", price: 4500 },
      { id: "medium", name: "Medium", price: 3000 },
    ],
  },
  {
    id: "aveeno-baby",
    name: "Daily Moisture",
    brand: "Aveeno",
    categoryId: "skincare",
    subcategoryId: "lotion",
    types: [
      { id: "large", name: "Large", price: 5000 },
      { id: "medium", name: "Medium", price: 3500 },
      { id: "small", name: "Small", price: 2200 },
    ],
  },
  {
    id: "mustela-hydra",
    name: "Hydra Bebe",
    brand: "Mustela",
    categoryId: "skincare",
    subcategoryId: "cream",
    types: [
      { id: "large", name: "Large", price: 6000 },
      { id: "medium", name: "Medium", price: 4200 },
    ],
  },
  {
    id: "shea-baby-oil",
    name: "Pure Baby Oil",
    brand: "Shea Moisture",
    categoryId: "skincare",
    subcategoryId: "oil",
    types: [
      { id: "large", name: "Large", price: 4800 },
      { id: "small", name: "Small", price: 2400 },
    ],
  },
  // Powder
  {
    id: "johnsons-powder",
    name: "Baby Powder",
    brand: "Johnsons",
    categoryId: "baby-powder",
    types: [
      { id: "large", name: "Large 200g", price: 2800 },
      { id: "small", name: "Small 100g", price: 1600 },
    ],
  },
  {
    id: "cussons-powder",
    name: "Soft & Fresh Powder",
    brand: "Cussons",
    categoryId: "baby-powder",
    types: [
      { id: "large", name: "Large 200g", price: 2400 },
      { id: "small", name: "Small 100g", price: 1300 },
    ],
  },
  // Diaper rash cream
  {
    id: "sudocrem-classic",
    name: "Antiseptic Healing",
    brand: "Sudocrem",
    categoryId: "diaper-cream",
    types: [
      { id: "large", name: "Large 250g", price: 5200 },
      { id: "medium", name: "Medium 125g", price: 3200 },
      { id: "small", name: "Small 60g", price: 1800 },
    ],
  },
  {
    id: "bepanthen-cream",
    name: "Nappy Care",
    brand: "Bepanthen",
    categoryId: "diaper-cream",
    types: [
      { id: "large", name: "Large 100g", price: 4500 },
      { id: "small", name: "Small 30g", price: 2200 },
    ],
  },
  // Baby Shampoo
  {
    id: "johnsons-shampoo",
    name: "No More Tears",
    brand: "Johnsons",
    categoryId: "baby-shampoo",
    types: [
      { id: "large", name: "Large 500ml", price: 3800 },
      { id: "medium", name: "Medium 200ml", price: 2200 },
    ],
  },
  {
    id: "mustela-shampoo",
    name: "Gentle Shampoo",
    brand: "Mustela",
    categoryId: "baby-shampoo",
    types: [
      { id: "large", name: "Large 500ml", price: 6500 },
      { id: "medium", name: "Medium 200ml", price: 3500 },
    ],
  },
  // Bottles
  {
    id: "avent-natural",
    name: "Natural Bottle",
    brand: "Philips Avent",
    categoryId: "bottles",
    subcategoryId: "bottle",
    types: [
      { id: "260ml", name: "260ml", price: 5500 },
      { id: "125ml", name: "125ml", price: 4200 },
    ],
  },
  {
    id: "tommee-closer",
    name: "Closer to Nature",
    brand: "Tommee Tippee",
    categoryId: "bottles",
    subcategoryId: "bottle",
    types: [
      { id: "260ml", name: "260ml", price: 5200 },
      { id: "150ml", name: "150ml", price: 4000 },
    ],
  },
  {
    id: "avent-teats",
    name: "Natural Teats (2pk)",
    brand: "Philips Avent",
    categoryId: "bottles",
    subcategoryId: "teats",
    types: [
      { id: "slow", name: "Slow Flow", price: 3200 },
      { id: "medium", name: "Medium Flow", price: 3200 },
      { id: "fast", name: "Fast Flow", price: 3200 },
    ],
  },
  // Formula
  {
    id: "nan-pro",
    name: "NAN Pro Stage 1",
    brand: "Nestlé",
    categoryId: "formula",
    types: [
      { id: "900g", name: "900g Tin", price: 14500 },
      { id: "400g", name: "400g Tin", price: 7800 },
    ],
  },
  {
    id: "sma-gold",
    name: "Gold Stage 2",
    brand: "SMA",
    categoryId: "formula",
    types: [
      { id: "900g", name: "900g Tin", price: 13800 },
      { id: "400g", name: "400g Tin", price: 7200 },
    ],
  },
  {
    id: "aptamil-stage1",
    name: "Aptamil Stage 1",
    brand: "Aptamil",
    categoryId: "formula",
    types: [
      { id: "800g", name: "800g Tin", price: 16500 },
    ],
  },
  // Bibs
  {
    id: "tommee-bibs",
    name: "Milk Feeding Bibs (4pk)",
    brand: "Tommee Tippee",
    categoryId: "bibs",
    types: [{ id: "set", name: "Set of 4", price: 4500 }],
  },
  {
    id: "burp-cloths-set",
    name: "Muslin Burp Cloths (6pk)",
    brand: "Aden + Anais",
    categoryId: "bibs",
    types: [{ id: "set", name: "Set of 6", price: 8500 }],
  },
  // Sterilisers
  {
    id: "avent-steriliser",
    name: "Electric Steam Steriliser",
    brand: "Philips Avent",
    categoryId: "sterilisers",
    types: [{ id: "electric", name: "Electric 6-bottle", price: 38500 }],
  },
  {
    id: "milton-tablets",
    name: "Sterilising Tablets",
    brand: "Milton",
    categoryId: "sterilisers",
    types: [
      { id: "28", name: "28 Tablets", price: 3200 },
      { id: "14", name: "14 Tablets", price: 1800 },
    ],
  },
  // Breast pumps
  {
    id: "medela-swing",
    name: "Swing Electric Pump",
    brand: "Medela",
    categoryId: "breast-pumps",
    types: [{ id: "single", name: "Single", price: 62000 }],
  },
  {
    id: "haakaa-manual",
    name: "Silicone Manual Pump",
    brand: "Haakaa",
    categoryId: "breast-pumps",
    types: [
      { id: "150ml", name: "150ml", price: 8500 },
      { id: "100ml", name: "100ml", price: 6500 },
    ],
  },
  // Supplements (Vitamins)
  {
    id: "vitamin-d-drops",
    name: "Vitamin D Drops",
    brand: "Enfamil",
    categoryId: "supplements",
    subcategoryId: "vitamin-d",
    types: [{ id: "standard", name: "Standard", price: 4500 }],
  },
  {
    id: "iron-drops",
    name: "Iron Drops",
    brand: "Wellkid",
    categoryId: "supplements",
    subcategoryId: "iron",
    types: [{ id: "standard", name: "Standard", price: 3800 }],
  },
  {
    id: "multivitamin-syrup",
    name: "Multivitamin Syrup",
    brand: "Haliborange",
    categoryId: "supplements",
    subcategoryId: "multi",
    types: [
      { id: "large", name: "Large", price: 5500 },
      { id: "small", name: "Small", price: 3200 },
    ],
  },
  {
    id: "probiotic-drops",
    name: "Probiotic Drops",
    brand: "BioGaia",
    categoryId: "supplements",
    subcategoryId: "probiotic",
    types: [{ id: "standard", name: "Standard", price: 7500 }],
  },
  // Thermometers
  {
    id: "braun-thermo",
    name: "Ear Thermometer",
    brand: "Braun",
    categoryId: "thermometers",
    types: [{ id: "standard", name: "Standard", price: 22000 }],
  },
  {
    id: "digital-thermo",
    name: "Digital Underarm",
    brand: "Omron",
    categoryId: "thermometers",
    types: [{ id: "standard", name: "Standard", price: 4500 }],
  },
  // Teething
  {
    id: "sophie-giraffe",
    name: "Sophie the Giraffe",
    brand: "Vulli",
    categoryId: "teething",
    types: [{ id: "standard", name: "Standard", price: 8500 }],
  },
  {
    id: "nuby-teether",
    name: "Cooling Teether",
    brand: "Nuby",
    categoryId: "teething",
    types: [{ id: "standard", name: "Standard", price: 2800 }],
  },
  // First aid
  {
    id: "calpol-syrup",
    name: "Infant Paracetamol",
    brand: "Calpol",
    categoryId: "first-aid",
    types: [
      { id: "100ml", name: "100ml", price: 3200 },
      { id: "60ml", name: "60ml", price: 2200 },
    ],
  },
  // Maternity pads
  {
    id: "always-maternity",
    name: "Maternity Pads",
    brand: "Always",
    categoryId: "maternity-pads",
    types: [
      { id: "10pk", name: "10 Pack", price: 2200 },
      { id: "20pk", name: "20 Pack", price: 3800 },
    ],
  },
  {
    id: "natracare-maternity",
    name: "Natural Maternity Pads",
    brand: "Natracare",
    categoryId: "maternity-pads",
    types: [{ id: "10pk", name: "10 Pack", price: 3500 }],
  },
  // Nipple cream
  {
    id: "lansinoh-cream",
    name: "Lanolin Nipple Cream",
    brand: "Lansinoh",
    categoryId: "nipple-cream",
    types: [
      { id: "40g", name: "40g", price: 7500 },
      { id: "10g", name: "10g", price: 3200 },
    ],
  },
  {
    id: "medela-cream",
    name: "Purelan Nipple Cream",
    brand: "Medela",
    categoryId: "nipple-cream",
    types: [{ id: "37g", name: "37g", price: 7200 }],
  },
  // Postpartum
  {
    id: "frida-mom-kit",
    name: "Postpartum Recovery Kit",
    brand: "Frida Mom",
    categoryId: "postpartum",
    types: [{ id: "kit", name: "Kit", price: 22000 }],
  },
  // Mum supplements
  {
    id: "elevit-prenatal",
    name: "Pregnancy Multivitamin",
    brand: "Elevit",
    categoryId: "mum-supplements",
    types: [
      { id: "100ct", name: "100 Tablets", price: 18500 },
      { id: "30ct", name: "30 Tablets", price: 7200 },
    ],
  },
  {
    id: "pregnacare-plus",
    name: "Pregnacare Plus",
    brand: "Vitabiotics",
    categoryId: "mum-supplements",
    types: [{ id: "56ct", name: "56 Tablets", price: 12500 }],
  },
  // Swaddles
  {
    id: "aden-swaddle",
    name: "Muslin Swaddles (4pk)",
    brand: "Aden + Anais",
    categoryId: "swaddles",
    types: [{ id: "set", name: "Set of 4", price: 18500 }],
  },
  {
    id: "love-to-dream",
    name: "Love To Dream Swaddle",
    brand: "Love To Dream",
    categoryId: "swaddles",
    types: [
      { id: "newborn", name: "Newborn", price: 14500 },
      { id: "small", name: "Small", price: 14500 },
    ],
  },
  // Sleep bags
  {
    id: "grobag-original",
    name: "The Original Grobag",
    brand: "Tommee Tippee",
    categoryId: "sleep-bags",
    types: [
      { id: "1tog", name: "1.0 Tog", price: 16500 },
      { id: "25tog", name: "2.5 Tog", price: 18500 },
    ],
  },
  // Bath towels
  {
    id: "hooded-towel",
    name: "Hooded Bath Towel",
    brand: "KissKids",
    categoryId: "bath-towels",
    types: [
      { id: "large", name: "Large", price: 6500 },
      { id: "small", name: "Small", price: 4200 },
    ],
  },
  {
    id: "muslin-washcloths",
    name: "Muslin Washcloths (6pk)",
    brand: "Aden + Anais",
    categoryId: "bath-towels",
    types: [{ id: "set", name: "Set of 6", price: 6800 }],
  },
];

export function formatPrice(price: number): string {
  return `₦${price.toLocaleString()}`;
}

export function getProductPriceRange(product: CatalogueProduct): { min: number; max: number } {
  const typesPrices = product.types.map((t) => t.price);
  const minTypePrice = Math.min(...typesPrices);
  const maxTypePrice = Math.max(...typesPrices);

  if (product.sizes && product.sizes.length > 0) {
    const minSizeDelta = Math.min(...product.sizes.map((s) => s.priceDelta));
    const maxSizeDelta = Math.max(...product.sizes.map((s) => s.priceDelta));
    return {
      min: minTypePrice + minSizeDelta,
      max: maxTypePrice + maxSizeDelta,
    };
  }

  return { min: minTypePrice, max: maxTypePrice };
}

export function getProductsByCategory(categoryId: string): CatalogueProduct[] {
  return catalogueProducts.filter((p) => p.categoryId === categoryId);
}

export function getProductCountByCategory(categoryId: string): number {
  return catalogueProducts.filter((p) => p.categoryId === categoryId).length;
}

export function getProductById(id: string): CatalogueProduct | undefined {
  return catalogueProducts.find((p) => p.id === id);
}

// ─── Recently bought (mock, derived from recent IDs) ───────────────────
export interface RecentVariant {
  product: CatalogueProduct;
  typeId: string;
  sizeId?: string;
}

const RECENT_VARIANT_SEED: Array<{ productId: string; typeId: string; sizeId?: string }> = [
  { productId: "kisskids-superdry", typeId: "jumbo", sizeId: "size-3" },
  { productId: "pears-unscented", typeId: "big" },
  { productId: "johnsons-baby-lotion", typeId: "large" },
  { productId: "pampers-premium", typeId: "midi", sizeId: "size-2" },
  { productId: "multivitamin-syrup", typeId: "large" },
  { productId: "huggies-pure", typeId: "medium" },
];

export function getRecentlyPurchasedVariants(): RecentVariant[] {
  const out: RecentVariant[] = [];
  for (const { productId, typeId, sizeId } of RECENT_VARIANT_SEED) {
    const product = getProductById(productId);
    if (product) out.push({ product, typeId, sizeId });
  }
  return out;
}
