import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Search, Sparkles, ChevronRight, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import desktopPlaceholder from "@/assets/desktop-placeholder.jpg";
import { api, ProductCard as APIProductCard } from "@/lib/api";
 import { AssistDrawer, ProductCard, ProductDetailDrawer, CategoryView } from "@/components/catalogue";
 import { CatalogueProduct, getProductsByCategory } from "@/data/catalogueData";
import { WalletBalancePill } from "@/components/wallet/WalletBalancePill";

const Catalogue = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [isAssistDrawerOpen, setIsAssistDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogueProduct | null>(null);
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string; slug: string } | null>(null);

  // Debounce search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-open product drawer if navigated with product slug
  useEffect(() => {
    const state = location.state as { openProductSlug?: string } | null;
    if (state?.openProductSlug) {
      handleProductClick(state.openProductSlug);
      // Clear the state after opening to prevent re-opening on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search results query — only active when search overlay is open and query is non-empty
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['searchProducts', debouncedQuery],
    queryFn: () => api.getProducts({ search: debouncedQuery, limit: 20, sortBy: 'name', sortOrder: 'asc' }),
    enabled: isSearchOpen && debouncedQuery.trim().length > 0,
  });

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

  // Open search overlay
  const handleOpenSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setIsSearchOpen(true);
  };

  // Close search overlay
  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setDebouncedQuery("");
  };

  // Handle "See all" click
  const handleSeeAll = (category: { id: string; name: string; slug?: string }) => {
    setSelectedCategory(category);
  };

  // Handle back from category view
  const handleBackFromCategory = () => {
    setSelectedCategory(null);
  };

  // Desktop placeholder
  if (!isMobile) {
    return (
      <Layout>
        <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center">
          <img
            src={desktopPlaceholder}
            alt="Baby care essentials"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <div className="relative z-10 text-center px-4">
            <h1 className="text-4xl font-bold text-foreground mb-4">Desktop Experience Coming Soon</h1>
            <p className="text-muted-foreground max-w-md mx-auto text-lg font-medium">
              Browse on a mobile device or a tablet to shop.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

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
      {/* Search overlay — full screen, fixed position */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Search header */}
          <div className="px-4 pt-6 pb-4 flex items-center gap-3">
            <button
              onClick={handleCloseSearch}
              className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {/* No query yet */}
            {!debouncedQuery.trim() && (
              <div className="flex items-center justify-center py-16">
                <p className="text-muted-foreground text-sm">Start typing to search products...</p>
              </div>
            )}

            {/* Loading */}
            {debouncedQuery.trim() && searchLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Loading products...</div>
              </div>
            )}

            {/* Results grid */}
            {debouncedQuery.trim() && !searchLoading && searchData && (
              <>
                {searchData.products.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No products found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {searchData.products.map((product, index) => (
                      <div
                        key={product.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <ProductCard
                          product={product}
                          size="large"
                          onClick={() => {
                            handleProductClick(product);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Product detail drawer for search results */}
          <ProductDetailDrawer
            open={isProductDrawerOpen}
            onOpenChange={setIsProductDrawerOpen}
            product={selectedProduct}
            productSlug={selectedProductSlug}
          />
        </div>
      )}

      <div className="min-h-screen pb-24">
        {/* Header */}
        <div className="px-4 pt-6 pb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Shop</h1>
          <WalletBalancePill size="sm" />
        </div>

        {/* Search bar — tap to open overlay */}
        <div className="px-4 pb-4">
          <div className="relative" onClick={handleOpenSearch}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              readOnly
              placeholder="Search products..."
              className="pl-9 cursor-pointer"
            />
          </div>
        </div>

        {/* Assist prompt with icon — temporarily hidden, bring back later */}
        {/* <div className="px-4 pb-6">
          <button
            onClick={() => setIsAssistDrawerOpen(true)}
            className="w-full flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors text-left"
          >
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex flex-wrap items-center gap-1">
              <p className="text-sm text-muted-foreground">
                Not sure of what to order?
              </p>
              <p className="text-sm font-medium text-primary inline-flex items-center gap-1">
                Try assisted shopping
                <ChevronRight className="h-4 w-4" />
              </p>
            </div>
          </button>
        </div> */}

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

      {/* Assist Drawer — temporarily hidden, bring back later */}
      {/* <AssistDrawer
        open={isAssistDrawerOpen}
        onOpenChange={setIsAssistDrawerOpen}
      /> */}
 
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
