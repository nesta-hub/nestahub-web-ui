import { useState } from "react";
import { Search, Sparkles, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { api, ProductCard as APIProductCard } from "@/lib/api";
 import { AssistDrawer, ProductCard, ProductDetailDrawer, CategoryView } from "@/components/catalogue";
 import { CatalogueProduct, getProductsByCategory } from "@/data/catalogueData";

const Catalogue = () => {
  const [isAssistDrawerOpen, setIsAssistDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<CatalogueProduct | null>(null);
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string; slug: string } | null>(null);

  // Fetch featured products from API
  const { data: featuredData, isLoading, error } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: () => api.getFeaturedProducts(5),
  });

  // Handle product click - can accept either old or new product type
  const handleProductClick = (product: CatalogueProduct | APIProductCard | string) => {
    if (typeof product === 'string') {
      // If it's a slug string
      setSelectedProductSlug(product);
      setSelectedProduct(null);
    } else if ('slug' in product) {
      // New API product type
      setSelectedProductSlug(product.slug);
      setSelectedProduct(null);
    } else {
      // Old catalogue product type
      setSelectedProduct(product);
      setSelectedProductSlug(null);
    }
    setIsProductDrawerOpen(true);
  };

  // Handle "See all" click
  const handleSeeAll = (category: { id: string; name: string; slug?: string }) => {
    setSelectedCategory(category);
  };

  // Handle back from category view
  const handleBackFromCategory = () => {
    setSelectedCategory(null);
  };

  // If category is selected, show CategoryView
  if (selectedCategory) {
    return (
      <Layout>
        <CategoryView
          category={selectedCategory}
          categorySlug={selectedCategory.slug}
          onBack={handleBackFromCategory}
          onProductClick={handleProductClick}
        />
        <ProductDetailDrawer
          open={isProductDrawerOpen}
          onOpenChange={setIsProductDrawerOpen}
          product={selectedProduct}
          productSlug={selectedProductSlug}
        />
      </Layout>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen pb-24 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading products...</div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="min-h-screen pb-24 flex items-center justify-center">
          <div className="text-destructive">Failed to load products. Please try again.</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-foreground">Catalogue</h1>
        </div>

        {/* Search bar - full width */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Assist prompt with icon */}
        <div className="px-4 pb-6">
          <button
            onClick={() => setIsAssistDrawerOpen(true)}
            className="w-full flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors text-left"
          >
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground sm:inline">
                Not sure of what to order?
              </p>
              <p className="text-sm font-medium text-primary mt-0.5 sm:mt-0 sm:inline sm:ml-1 inline-flex items-center gap-1">
                Try assisted shopping
                <ChevronRight className="h-4 w-4" />
              </p>
            </div>
          </button>
        </div>

        {/* Category sections - now using API data */}
        <div className="space-y-8">
          {featuredData?.categories.map((categoryData, index) => (
            <div key={categoryData.category.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              {/* Section header */}
              <div className="flex items-center justify-between px-4 mb-3">
                <h2 className="text-lg font-semibold text-foreground">
                  {categoryData.category.displayName}
                </h2>
                <button
                  onClick={() => handleSeeAll({
                    id: categoryData.category.slug,
                    name: categoryData.category.displayName,
                    slug: categoryData.category.slug
                  })}
                  className="text-sm text-primary font-medium inline-flex items-center gap-0.5"
                >
                  See all
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Product carousel */}
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide ml-4">
                {categoryData.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
                <div className="w-4 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assist Drawer */}
      <AssistDrawer
        open={isAssistDrawerOpen}
        onOpenChange={setIsAssistDrawerOpen}
      />
 
      {/* Product Detail Drawer */}
      <ProductDetailDrawer
        open={isProductDrawerOpen}
        onOpenChange={setIsProductDrawerOpen}
        product={selectedProduct}
        productSlug={selectedProductSlug}
      />
    </Layout>
  );
};

export default Catalogue;
