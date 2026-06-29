 import { cn } from "@/lib/utils";
 import { CatalogueProduct, getProductPriceRange, formatPrice } from "@/data/catalogueData";
 
interface ProductCardProps {
  product: CatalogueProduct;
  onClick: () => void;
  size?: 'small' | 'large' | 'tiny';
}

export function ProductCard({ product, onClick, size = 'small' }: ProductCardProps) {
  const priceRange = getProductPriceRange(product);
  const isLarge = size === 'large';
  const isTiny = size === 'tiny';
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 snap-start text-left transition-all active:scale-[0.98]",
        isLarge ? "w-full" : isTiny ? "w-24" : "w-32"
      )}
    >
      <div className={cn(
        "aspect-square rounded-xl bg-secondary/50 mb-1.5 overflow-hidden",
        isLarge && "rounded-2xl"
      )}>
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
        )}
      </div>
       <p className={cn(
         "font-medium text-foreground truncate",
         isTiny ? "text-xs" : "text-sm"
       )}>
         {product.brand} {product.name}
       </p>
       <p className={cn(
         "text-muted-foreground",
         isTiny ? "text-[10px]" : "text-xs"
       )}>
         {priceRange.min === priceRange.max 
           ? formatPrice(priceRange.min)
          : `from ${formatPrice(priceRange.min)}`
         }
       </p>
    </button>
   );
 }