import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
  BundleProductRow,
  VariantSheet,
  SizeSheet,
  DeliverySection,
  OrderSummary,
} from "@/components/bundles";
import {
  getStageById,
  getTierById,
  formatPrice,
  getSubscriptionPrice,
  diaperVariants,
  diaperSizes,
  wipesVariants,
  skinCareVariants,
  type ConfiguredProduct,
  type ProductVariant,
  type ProductSize,
  type SubscriptionConfig,
  type BundleItem,
} from "@/data/bundleData";
import { useIsMobile } from "@/hooks/use-mobile";

// Map category to its variants
const getCategoryVariants = (category: string): ProductVariant[] => {
  switch (category.toLowerCase()) {
    case "diapers":
      return diaperVariants;
    case "wipes":
      return wipesVariants;
    case "vaseline":
    case "lotion":
    case "baby wash":
    case "baby oil":
      return skinCareVariants;
    default:
      return skinCareVariants;
  }
};

// Check if category has size options
const categoryHasSizes = (category: string): boolean => {
  return category.toLowerCase() === "diapers";
};

// Initialize products from tier contents
const initializeProducts = (contents: BundleItem[]): ConfiguredProduct[] => {
  return contents.map((item) => {
    const variants = getCategoryVariants(item.category);
    const hasSizes = categoryHasSizes(item.category);
    return {
      category: item.category,
      quantity: 1, // Default quantity
      selectedVariant: variants[0],
      selectedSize: hasSizes ? diaperSizes[0] : undefined,
    };
  });
};

const BundleConfigurator = () => {
  const { bundleId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Parse bundleId (format: stageId__tierId)
  const parts = bundleId?.split("__") || [];
  const stageId = parts[0];
  const tierId = parts[1];
  const stage = stageId ? getStageById(stageId) : undefined;
  const tier = tierId ? getTierById(tierId) : undefined;

  // State for configured products
  const [products, setProducts] = useState<ConfiguredProduct[]>(() =>
    tier ? initializeProducts(tier.contents) : []
  );

  // State for subscription config
  const [subscriptionConfig, setSubscriptionConfig] = useState<SubscriptionConfig>({
    frequency: "one-time",
    startDate: addDays(new Date(), 1),
  });

  // Sheet states
  const [variantSheetOpen, setVariantSheetOpen] = useState(false);
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);
  const [activeProductIndex, setActiveProductIndex] = useState<number | null>(null);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!tier) return 0;
    let total = tier.basePrice;

    products.forEach((product) => {
      total += product.selectedVariant.priceDelta;
      if (product.selectedSize) {
        total += product.selectedSize.priceDelta;
      }
    });

    return total;
  }, [tier, products]);

  const finalPrice =
    subscriptionConfig.frequency === "one-time"
      ? totalPrice
      : getSubscriptionPrice(totalPrice);

  if (!stage || !tier) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-muted-foreground">Bundle not found</p>
        </div>
      </Layout>
    );
  }

  const handleChangeBrand = (index: number) => {
    setActiveProductIndex(index);
    setVariantSheetOpen(true);
  };

  const handleChangeSize = (index: number) => {
    setActiveProductIndex(index);
    setSizeSheetOpen(true);
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    if (activeProductIndex === null) return;
    setProducts((prev) =>
      prev.map((p, i) =>
        i === activeProductIndex ? { ...p, selectedVariant: variant } : p
      )
    );
  };

  const handleSizeSelect = (size: ProductSize) => {
    if (activeProductIndex === null) return;
    setProducts((prev) =>
      prev.map((p, i) =>
        i === activeProductIndex ? { ...p, selectedSize: size } : p
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
                <BundleProductRow
                  key={index}
                  product={product}
                  onChangeBrand={() => handleChangeBrand(index)}
                  onChangeSize={() => handleChangeSize(index)}
                  showSizeOption={categoryHasSizes(product.category)}
                />
              ))}
            </div>
          </div>

          <DeliverySection
            basePrice={totalPrice}
            config={subscriptionConfig}
            onConfigChange={setSubscriptionConfig}
          />

          {activeProduct && (
            <VariantSheet
              open={variantSheetOpen}
              onOpenChange={setVariantSheetOpen}
              title={`Select ${activeProduct.category} Brand`}
              variants={getCategoryVariants(activeProduct.category)}
              selectedVariantId={activeProduct.selectedVariant.id}
              onSelect={handleVariantSelect}
            />
          )}

          {activeProduct && activeProduct.selectedSize && (
            <SizeSheet
              open={sizeSheetOpen}
              onOpenChange={setSizeSheetOpen}
              title={`Select ${activeProduct.category} Size`}
              sizes={diaperSizes}
              selectedSizeId={activeProduct.selectedSize.id}
              onSelect={handleSizeSelect}
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
                  <BundleProductRow
                    key={index}
                    product={product}
                    onChangeBrand={() => handleChangeBrand(index)}
                    onChangeSize={() => handleChangeSize(index)}
                    showSizeOption={categoryHasSizes(product.category)}
                  />
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
        {activeProduct && (
          <VariantSheet
            open={variantSheetOpen}
            onOpenChange={setVariantSheetOpen}
            title={`Select ${activeProduct.category} Brand`}
            variants={getCategoryVariants(activeProduct.category)}
            selectedVariantId={activeProduct.selectedVariant.id}
            onSelect={handleVariantSelect}
          />
        )}

        {activeProduct && activeProduct.selectedSize && (
          <SizeSheet
            open={sizeSheetOpen}
            onOpenChange={setSizeSheetOpen}
            title={`Select ${activeProduct.category} Size`}
            sizes={diaperSizes}
            selectedSizeId={activeProduct.selectedSize.id}
            onSelect={handleSizeSelect}
          />
        )}
      </div>
    </Layout>
  );
};

export default BundleConfigurator;
