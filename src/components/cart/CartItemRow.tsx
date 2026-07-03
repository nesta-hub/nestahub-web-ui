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
    removeFromCart(item.variantId);
  };

  const handleQuantityChange = (qty: number) => {
    updateQuantity(item.variantId, qty);
  };

  // Build display - prioritize API attributes, show "Default" for simple products
  const variantParts = item.attributes && item.attributes.length > 0
    ? item.attributes.map(attr => attr.displayValue || attr.value)
    : item.attributes // If attributes array exists (even if empty), it's a new API product
      ? ['Default'] // Show "Default" for simple products with no attributes
      : [item.typeName, item.sizeName].filter(Boolean); // Legacy fallback
  const variantLabel = variantParts.join(' · ');

  // Calculate display price - use subscription price if subscribed
  const displayUnitPrice = item.isAutoRenew && item.subscriptionPrice
    ? item.subscriptionPrice
    : item.unitPrice;

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
          <span className="text-xs font-medium mt-1 inline-flex items-center gap-1 text-primary">
            One-time
          </span>
        )}

        {/* Price, Quantity & Remove */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm font-semibold text-foreground">
            {formatPrice(displayUnitPrice * item.quantity)}
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
