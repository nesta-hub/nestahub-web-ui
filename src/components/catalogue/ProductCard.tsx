 import { cn } from "@/lib/utils";
import { CatalogueProduct, getProductPriceRange, formatPrice as formatPriceOld } from "@/data/catalogueData";
import { ProductCard as APIProductCard, formatPrice as formatPriceAPI } from "@/lib/api";
import { CloudinaryPresets } from "@/lib/cloudinary";

interface ProductCardProps {
  product: CatalogueProduct | APIProductCard;
  onClick: () => void;
  size?: 'small' | 'large';
}

// Type guard to check if product is from API
function isAPIProduct(product: CatalogueProduct | APIProductCard): product is APIProductCard {
  return 'minPrice' in product && 'maxPrice' in product;
}

export function ProductCard({ product, onClick, size = 'small' }: ProductCardProps) {
  const isLarge = size === 'large';

  // Determine price and format based on product type
  const { minPrice, maxPrice, formatPrice, imageUrl } = isAPIProduct(product)
    ? {
        minPrice: product.minPrice,
        maxPrice: product.maxPrice,
        formatPrice: formatPriceAPI,
        imageUrl: product.imageUrl
      }
    : {
        minPrice: getProductPriceRange(product).min,
        maxPrice: getProductPriceRange(product).max,
        formatPrice: formatPriceOld,
        imageUrl: product.image
      };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 snap-start text-left transition-all active:scale-[0.98]",
        isLarge ? "w-full" : "w-32"
      )}
    >
      <div className={cn(
        "aspect-square rounded-xl bg-secondary/50 mb-2 overflow-hidden",
        isLarge && "rounded-2xl"
      )}>
        {imageUrl ? (
          <img src={CloudinaryPresets.card(imageUrl)} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
        )}
      </div>
      <p className={cn(
        "font-medium text-foreground truncate",
        isLarge ? "text-sm" : "text-sm"
      )}>
        {product.brand} {product.name}
      </p>
      <p className={cn(
        "text-muted-foreground",
        isLarge ? "text-xs" : "text-xs"
      )}>
        {minPrice === maxPrice
          ? formatPrice(minPrice)
          : `from ${formatPrice(minPrice)}`
        }
      </p>
    </button>
  );
}