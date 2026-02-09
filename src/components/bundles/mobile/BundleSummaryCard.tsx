import { Package } from "lucide-react";
import { type ConfiguredProduct, productCategories, formatPrice } from "@/data/bundleData";

interface BundleSummaryCardProps {
  categoryIds: string[];
  products: ConfiguredProduct[];
  totalPrice: number;
  onEdit: () => void;
  onClear: () => void;
}

export function BundleSummaryCard({ 
  categoryIds,
  products, 
  totalPrice,
  onEdit, 
  onClear 
}: BundleSummaryCardProps) {
  // Get category names for header
  const categoryNames = categoryIds
    .map(id => productCategories.find(c => c.id === id)?.name)
    .filter(Boolean);
  
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">Your Selection</h3>
      
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        {/* Header with item count and actions */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-foreground">{categoryIds.length} items selected</span>
          <div className="flex gap-3">
            <button 
              className="text-sm text-primary font-medium"
              onClick={onEdit}
            >
              Edit
            </button>
            <button 
              className="text-sm text-muted-foreground font-medium"
              onClick={onClear}
            >
              Clear
            </button>
          </div>
        </div>
        
        {/* Item list */}
        <div className="space-y-2">
          {products.map((product, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">
                {product.category}
              </span>
              <span className="text-muted-foreground">
                — {product.selectedVariant.brand} {product.selectedVariant.name}
              </span>
            </div>
          ))}
        </div>
        
        {/* Total */}
        <div className="pt-2 border-t border-border flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
