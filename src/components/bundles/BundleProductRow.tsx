import { Button } from "@/components/ui/button";
import { ChevronDown, Package } from "lucide-react";
import type { ConfiguredProduct, ProductSize, ProductVariant } from "@/data/bundleData";

interface BundleProductRowProps {
  product: ConfiguredProduct;
  onChangeBrand: () => void;
  onChangeSize?: () => void;
  showSizeOption?: boolean;
}

export function BundleProductRow({
  product,
  onChangeBrand,
  onChangeSize,
  showSizeOption = false,
}: BundleProductRowProps) {
  return (
    <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
      {/* Product icon */}
      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
        <Package className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* Product details */}
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <h4 className="font-semibold text-foreground">
            {product.category}{" "}
            <span className="font-normal text-muted-foreground">
              ({product.quantity})
            </span>
          </h4>
          <p className="text-sm text-foreground">
            {product.selectedVariant.brand} {product.selectedVariant.name}
          </p>
          {product.selectedSize && (
            <p className="text-sm text-muted-foreground">
              {product.selectedSize.name}
              {product.selectedSize.weightRange && ` ${product.selectedSize.weightRange}`}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onChangeBrand}
          >
            Change Brand
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
          {showSizeOption && onChangeSize && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={onChangeSize}
            >
              Change Size
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
