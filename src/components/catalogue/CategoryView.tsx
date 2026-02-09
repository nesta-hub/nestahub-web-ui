import { useState, useMemo } from "react";
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./ProductCard";
import { api, ProductCard as APIProductCard } from "@/lib/api";

interface CategoryViewProps {
  category: { id: string; name: string; slug: string };
  categorySlug: string;
  onBack: () => void;
  onProductClick: (product: string | APIProductCard) => void;
}
 
export function CategoryView({ category, categorySlug, onBack, onProductClick }: CategoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch products from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['categoryProducts', categorySlug, page, searchQuery],
    queryFn: () => api.getProducts({
      category: categorySlug,
      page,
      limit,
      search: searchQuery || undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    }),
  });

  const products = data?.products || [];
  const hasNextPage = data?.hasNextPage || false;
  const hasPreviousPage = data?.hasPreviousPage || false;
   
   return (
     <div className="min-h-screen pb-24 animate-fade-in">
       {/* Header with back button */}
       <div className="px-4 pt-6 pb-4 flex items-center gap-3">
         <button
           onClick={onBack}
           className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
         >
           <ArrowLeft className="w-5 h-5" />
         </button>
         <h1 className="text-xl font-bold text-foreground">
           {category.name}
         </h1>
       </div>
       
       {/* Search bar */}
       <div className="px-4 pb-4">
         <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
             placeholder={`Search ${category.name} products...`}
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-9"
           />
         </div>
       </div>
       
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading products...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Failed to load products. Please try again.</div>
        </div>
      )}

      {/* 2-column grid of products */}
      {!isLoading && !error && (
        <div className="px-4">
          <div className="grid grid-cols-2 gap-4">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProductCard
                  product={product}
                  size="large"
                  onClick={() => onProductClick(product)}
                />
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}

          {/* Pagination controls */}
          {(hasNextPage || hasPreviousPage) && products.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p - 1)}
                disabled={!hasPreviousPage}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}