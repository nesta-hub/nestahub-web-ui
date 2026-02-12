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
