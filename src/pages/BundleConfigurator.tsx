import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, ChevronDown } from "lucide-react";
import { addDays } from "date-fns";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  VariantSheet,
  DeliverySection,
  OrderSummary,
} from "@/components/bundles";
import { api, type ProductVariant as ApiProductVariant } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";

// Types for configured products
type ConfiguredProduct = {
  categoryId: string;
  categoryName: string;
  categoryDisplayName: string;
  bundleCategoryProductId: string;
  quantity: number;
  selectedVariantId: string;
  selectedVariant: {
    id: string;
    sku: string;
    price: number;
    imageUrl?: string;
    productId: string;
    productName: string;
    brand: string;
    attributes: Array<{ attributeName: string; displayValue: string }>;
  };
};

type SubscriptionConfig = {
  frequency: "one-time" | "weekly" | "bi-weekly" | "monthly";
  startDate: Date;
};

// Helper to calculate subscription discount (5% off)
const getSubscriptionPrice = (price: number) => Math.round(price * 0.95);

// Helper to format price
const formatPrice = (priceInKobo: number) => {
  const naira = priceInKobo / 100;
  return `₦${naira.toLocaleString()}`;
};

const BundleConfigurator = () => {
  const { bundleId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Parse bundleId (format: stageId__bundleSlug)
  const parts = bundleId?.split("__") || [];
  const stageId = parts[0];
  const bundleSlug = parts[1];

  // Fetch bundles to get stage info
  const { data: bundlesData } = useQuery({
    queryKey: ['bundles'],
    queryFn: api.getBundles,
  });

  // Fetch bundle details
  const { data: bundleData, isLoading: bundleLoading, error: bundleError } = useQuery({
    queryKey: ['bundle', bundleSlug],
    queryFn: () => bundleSlug ? api.getBundle(bundleSlug) : Promise.reject('No bundle slug'),
    enabled: !!bundleSlug,
  });

  // State for configured products
  const [products, setProducts] = useState<ConfiguredProduct[]>([]);

  // State for subscription config
  const [subscriptionConfig, setSubscriptionConfig] = useState<SubscriptionConfig>({
    frequency: "one-time",
    startDate: addDays(new Date(), 1),
  });

  // Sheet states
  const [variantSheetOpen, setVariantSheetOpen] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState<number | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // Fetch category products when changing variant
  const { data: categoryProductsData } = useQuery({
    queryKey: ['categoryProducts', activeCategoryId],
    queryFn: () => activeCategoryId ? api.getCategoryProducts(activeCategoryId) : Promise.reject('No category'),
    enabled: !!activeCategoryId && variantSheetOpen,
  });

  // Initialize products from bundle data
  useEffect(() => {
    if (bundleData?.categories && products.length === 0) {
      const initialProducts: ConfiguredProduct[] = [];

      bundleData.categories.forEach((category) => {
        category.products.forEach((product) => {
          initialProducts.push({
            categoryId: category.categoryId,
            categoryName: category.category.name,
            categoryDisplayName: category.category.displayName,
            bundleCategoryProductId: product.id,
            quantity: product.quantity,
            selectedVariantId: product.variantId,
            selectedVariant: {
              id: product.variant.id,
              sku: product.variant.sku,
              price: product.variant.price,
              imageUrl: product.variant.imageUrl,
              productId: product.variant.product.id,
              productName: product.variant.product.name,
              brand: product.variant.product.brand,
              attributes: product.variant.attributes.map(attr => ({
                attributeName: attr.attributeName,
                displayValue: attr.displayValue,
              })),
            },
          });
        });
      });

      setProducts(initialProducts);
    }
  }, [bundleData, products.length]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return products.reduce((total, product) => {
      return total + (product.selectedVariant.price * product.quantity);
    }, 0);
  }, [products]);

  const finalPrice =
    subscriptionConfig.frequency === "one-time"
      ? totalPrice
      : getSubscriptionPrice(totalPrice);

  // Find stage info (now a gift category)
  const giftCategoryData = bundlesData?.giftCategories.find(gc => gc.giftCategory.slug === stageId);
  const stage = giftCategoryData ? {
    id: giftCategoryData.giftCategory.slug,
    name: giftCategoryData.giftCategory.name,
    ageRange: undefined,
    emoji: '🎁',
  } : undefined;

  const tier = bundleData ? {
    id: bundleData.slug,
    name: bundleData.name,
  } : undefined;

  // Loading state
  if (bundleLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Error state
  if (bundleError || !stage || !tier) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-destructive">
            {bundleError ? 'Failed to load bundle' : 'Bundle not found'}
          </p>
        </div>
      </Layout>
    );
  }

  const handleChangeBrand = (index: number) => {
    const product = products[index];
    setActiveProductIndex(index);
    setActiveCategoryId(product.categoryId);
    setVariantSheetOpen(true);
  };

  const handleVariantSelect = (variant: ApiProductVariant) => {
    if (activeProductIndex === null) return;

    const product = products[activeProductIndex];
    setProducts((prev) =>
      prev.map((p, i) =>
        i === activeProductIndex ? {
          ...p,
          selectedVariantId: variant.id,
          selectedVariant: {
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            imageUrl: variant.imageUrl,
            productId: p.selectedVariant.productId, // Keep existing product ID
            productName: p.selectedVariant.productName, // Will be updated from category products
            brand: p.selectedVariant.brand,
            attributes: variant.attributes.map(attr => ({
              attributeName: attr.attributeName,
              displayValue: attr.displayValue,
            })),
          },
        } : p
      )
    );
  };

  const activeProduct = activeProductIndex !== null ? products[activeProductIndex] : null;

  // Mobile layout
  if (isMobile) {
    return (
      <Layout>
        <div className="container py-6 space-y-6 pb-32">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2"
            onClick={() => navigate(`/bundles/${stageId}`)}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div>
            <h1 className="text-2xl font-bold text-foreground">{tier.name}</h1>
            <p className="text-muted-foreground">
              {stage.name} • {stage.ageRange || stage.weightRange}
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">Your Bundle</h2>
            <div className="space-y-3">
              {products.map((product, index) => (
                <div key={index} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {product.selectedVariant.imageUrl ? (
                      <img src={product.selectedVariant.imageUrl} alt={product.selectedVariant.productName} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Package className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {product.categoryDisplayName}{" "}
                        <span className="font-normal text-muted-foreground">({product.quantity})</span>
                      </h4>
                      <p className="text-sm text-foreground">
                        {product.selectedVariant.brand} {product.selectedVariant.productName}
                      </p>
                      {product.selectedVariant.attributes.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {product.selectedVariant.attributes.map(a => a.displayValue).join(', ')}
                        </p>
                      )}
                      <p className="text-sm font-medium text-foreground mt-1">
                        {formatPrice(product.selectedVariant.price)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleChangeBrand(index)}
                      >
                        Change Brand
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DeliverySection
            basePrice={totalPrice}
            config={subscriptionConfig}
            onConfigChange={setSubscriptionConfig}
          />

          {activeProduct && categoryProductsData && (
            <VariantSheet
              open={variantSheetOpen}
              onOpenChange={setVariantSheetOpen}
              title={`Select ${activeProduct.categoryDisplayName} Product`}
              variants={categoryProductsData.products.flatMap(p =>
                p.variants.map(v => ({
                  id: v.id,
                  name: p.name,
                  brand: p.brand,
                  priceDelta: v.price - activeProduct.selectedVariant.price,
                  imageUrl: v.imageUrl,
                  attributes: v.attributes,
                }))
              )}
              selectedVariantId={activeProduct.selectedVariantId}
              onSelect={handleVariantSelect}
            />
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="container flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-foreground">
                {formatPrice(finalPrice)}
              </p>
            </div>
            <Button size="lg">Add to Cart</Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Desktop layout - Two columns with sticky sidebar
  return (
    <Layout>
      <div className="container py-8 max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/bundles">Bundles</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/bundles/${stageId}`}>{stage.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tier.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[1fr,400px] gap-8 items-start">
          {/* Left column - Products + Delivery */}
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">{tier.name}</h1>
              <p className="text-lg text-muted-foreground">
                {stage.name} • {stage.ageRange || stage.weightRange}
              </p>
            </div>

            {/* Product list */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Your Bundle</h2>
              <div className="space-y-4">
                {products.map((product, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-card border border-border rounded-lg">
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      {product.selectedVariant.imageUrl ? (
                        <img src={product.selectedVariant.imageUrl} alt={product.selectedVariant.productName} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <h4 className="font-semibold text-foreground text-lg">
                          {product.categoryDisplayName}{" "}
                          <span className="font-normal text-muted-foreground">({product.quantity})</span>
                        </h4>
                        <p className="text-base text-foreground">
                          {product.selectedVariant.brand} {product.selectedVariant.productName}
                        </p>
                        {product.selectedVariant.attributes.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {product.selectedVariant.attributes.map(a => a.displayValue).join(', ')}
                          </p>
                        )}
                        <p className="text-base font-medium text-foreground mt-1">
                          {formatPrice(product.selectedVariant.price)} each
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangeBrand(index)}
                        >
                          Change Brand
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <DeliverySection
                basePrice={totalPrice}
                config={subscriptionConfig}
                onConfigChange={setSubscriptionConfig}
              />
            </div>
          </div>

          {/* Right column - Sticky Order Summary */}
          <div className="lg:sticky lg:top-24">
            <OrderSummary
              stage={stage}
              tier={tier}
              products={products}
              totalPrice={totalPrice}
              subscriptionConfig={subscriptionConfig}
            />
          </div>
        </div>

        {/* Dialogs for desktop selection */}
        {activeProduct && categoryProductsData && (
          <VariantSheet
            open={variantSheetOpen}
            onOpenChange={setVariantSheetOpen}
            title={`Select ${activeProduct.categoryDisplayName} Product`}
            variants={categoryProductsData.products.flatMap(p =>
              p.variants.map(v => ({
                id: v.id,
                name: p.name,
                brand: p.brand,
                priceDelta: v.price - activeProduct.selectedVariant.price,
                imageUrl: v.imageUrl,
                attributes: v.attributes,
              }))
            )}
            selectedVariantId={activeProduct.selectedVariantId}
            onSelect={handleVariantSelect}
          />
        )}
      </div>
    </Layout>
  );
};

export default BundleConfigurator;
