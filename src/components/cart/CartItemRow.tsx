import { Trash2, RefreshCw } from "lucide-react";
import { CartItem, useCart } from "@/contexts/CartContext";
import { QuantityControl } from "./QuantityControl";
import { formatPrice } from "@/lib/api";
import { CloudinaryPresets } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { removeFromCart, updateQuantity } = useCart();

  const handleRemove = () => {
    removeFromCart(item.productId, item.typeId, item.sizeId);
  };

  const handleQuantityChange = (qty: number) => {
    updateQuantity(item.productId, item.typeId, item.sizeId, qty);
  };

  // Build display - prioritize API attributes, fallback to legacy
  const variantParts = item.attributes && item.attributes.length > 0
    ? item.attributes.map(attr => attr.displayValue || attr.value)
    : [item.typeName, item.sizeName].filter(Boolean);
  const variantLabel = variantParts.join(' · ');

  return (
    <div className="flex gap-3 py-3">
      {/* Product Image */}
      <div className="w-14 h-14 rounded-lg bg-secondary/50 overflow-hidden flex-shrink-0">
        {item.image ? (
          <img
            src={CloudinaryPresets.cartItem(item.image)}
            alt={item.productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground text-sm leading-tight truncate">
          {item.brand} {item.productName}
        </h4>
        {variantLabel && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {variantLabel}
          </p>
        )}

        {/* Purchase type badge */}
        {item.isAutoRenew ? (
          <span className="text-xs font-medium mt-1 inline-flex items-center gap-1 text-primary">
            <RefreshCw className="w-3 h-3" />
            Every {item.frequencyWeeks} weeks
          </span>
        ) : (
          <span className="text-xs font-medium mt-1 inline-flex items-center gap-1 text-muted-foreground">
            One-time
          </span>
        )}

        {/* Price, Quantity & Remove */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm font-semibold text-foreground">
            {formatPrice(item.unitPrice * item.quantity)}
          </p>
          <div className="flex items-center gap-2">
            <QuantityControl size="sm" value={item.quantity} onChange={handleQuantityChange} />
            <button
              onClick={handleRemove}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center",
                "text-muted-foreground hover:text-destructive",
                "hover:bg-destructive/10 transition-colors"
              )}
              aria-label="Remove item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
