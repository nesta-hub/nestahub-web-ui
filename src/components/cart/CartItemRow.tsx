import { Trash2 } from "lucide-react";
import { CartItem, useCart } from "@/contexts/CartContext";
import { QuantityControl } from "./QuantityControl";
import { formatPrice } from "@/data/catalogueData";
import { CloudinaryPresets } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(item.productId, item.typeId, item.sizeId, newQuantity);
  };

  const handleRemove = () => {
    removeFromCart(item.productId, item.typeId, item.sizeId);
  };

  // Build display - prioritize API attributes, fallback to legacy
  const variantLabel = item.attributes && item.attributes.length > 0
    ? item.attributes.map(attr => attr.value).join(' · ')  // e.g., "Size 1 · Jumbo"
    : item.sizeName
      ? `${item.typeName} · ${item.sizeName}`
      : item.typeName;

  return (
    <div className="flex gap-3 p-3 rounded-xl border border-border bg-card">
      {/* Product Image */}
      <div className="w-16 h-16 rounded-lg bg-secondary/50 overflow-hidden flex-shrink-0">
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
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {variantLabel}
        </p>
        <p className="text-sm font-semibold text-foreground mt-1">
          {formatPrice(item.unitPrice)}
        </p>

        {/* Quantity and Remove */}
        <div className="flex items-center justify-between mt-2">
          <QuantityControl
            value={item.quantity}
            onChange={handleQuantityChange}
            size="sm"
          />
          <button
            onClick={handleRemove}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              "text-muted-foreground hover:text-destructive",
              "hover:bg-destructive/10 transition-colors"
            )}
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
