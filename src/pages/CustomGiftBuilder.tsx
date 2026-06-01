import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuantityControl } from "@/components/cart/QuantityControl";
import { ProductDetailDrawer } from "@/components/catalogue/ProductDetailDrawer";
import { useCart } from "@/contexts/CartContext";
import { api } from "@/lib/api";
import { GiftBoxComposite } from "@/components/gifting/GiftBoxComposite";

const formatPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

interface CustomItem {
  variantId: string;
  sku: string;
  price: number;
  imageUrl?: string;
  product: { id: string; name: string; brand: string; slug: string };
  attributes: Array<{ attributeName: string; value: string; displayValue: string }>;
  quantity: number;
}

export default function CustomGiftBuilder() {
  const navigate = useNavigate();
  const { addToCart, clearCart } = useCart();

  const { data: sizesData } = useQuery({
    queryKey: ['giftPackageSizes'],
    queryFn: api.getGiftPackageSizes,
  });

  const [sizeId, setSizeId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<CustomItem[]>([]);
  const [selectProductSlug, setSelectProductSlug] = useState<string | null>(null);
  const [selectDrawerOpen, setSelectDrawerOpen] = useState(false);

  const { data: productsData } = useQuery({
    queryKey: ['customGiftProducts', search],
    queryFn: () => api.getProducts({ search, limit: 20 }),
    enabled: search.length >= 2,
  });

  const selectedSize = sizesData?.sizes.find((s) => s.id === sizeId);
  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  const handleVariantSelected = (variant: any, quantity: number) => {
    setItems((prev) => {
      const existing = prev.findIndex((i) => i.variantId === variant.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], quantity };
        return next;
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          sku: variant.sku,
          price: variant.price,
          imageUrl: variant.imageUrl,
          product: variant.product,
          attributes: (variant.attributes ?? []).map((a: any) => ({
            attributeName: a.attributeName,
            value: a.value,
            displayValue: a.displayValue,
          })),
          quantity,
        },
      ];
    });
    setSelectDrawerOpen(false);
    setSelectProductSlug(null);
  };

  const handleProceed = () => {
    clearCart();
    items.forEach((item) => {
      addToCart(
        {
          variantId: item.variantId,
          productId: item.product.id,
          productName: item.product.name,
          brand: item.product.brand,
          slug: item.product.slug,
          typeId: item.variantId,
          typeName: 'Custom gift',
          sizeId: undefined,
          sizeName: undefined,
          attributes: item.attributes,
          unitPrice: item.price,
          image: item.imageUrl,
        },
        item.quantity,
      );
    });
    navigate(`/checkout?source=custom-gift&giftSizeId=${sizeId}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
        <button type="button" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg">Build your own gift set</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 max-w-2xl w-full mx-auto">
        {/* Step 1: choose a box */}
        <section className="space-y-3">
          <h2 className="font-semibold text-foreground">1. Choose your box</h2>
          <div className="flex gap-3 flex-wrap">
            {sizesData?.sizes.map((size) => (
              <button
                key={size.id}
                onClick={() => setSizeId(size.id)}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  sizeId === size.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                }`}
              >
                <span className="block font-medium text-foreground">{size.name}</span>
                {size.description && <span className="block text-xs text-muted-foreground">{size.description}</span>}
              </button>
            ))}
          </div>

          {selectedSize && (
            <div className="h-44 rounded-2xl overflow-hidden">
              <GiftBoxComposite
                categorySlug={selectedSize.slug}
                items={items.map((it) => ({ name: `${it.product.brand} ${it.product.name}`, imageUrl: it.imageUrl }))}
              />
            </div>
          )}
        </section>

        {/* Step 2: add products */}
        <section className="space-y-3">
          <h2 className="font-semibold text-foreground">2. Fill it with products</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products to add…"
              className="pl-9"
            />
          </div>

          {search.length >= 2 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {productsData?.products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    setSelectProductSlug(product.slug);
                    setSelectDrawerOpen(true);
                  }}
                  className="flex-shrink-0 w-32 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="aspect-square rounded-xl bg-secondary/50 mb-2 overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
                    )}
                  </div>
                  <p className="font-medium text-foreground truncate text-sm">
                    {product.brand} {product.name}
                  </p>
                  <p className="text-muted-foreground text-xs">from {formatPrice(product.minPrice)}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Selected items */}
        {items.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-semibold text-foreground">Your gift set</h2>
            <div className="divide-y divide-border">
              {items.map((item, index) => (
                <div key={item.variantId} className="flex gap-3 py-3">
                  <div className="w-14 h-14 rounded-lg bg-secondary/50 overflow-hidden flex-shrink-0">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm truncate">
                      {item.product.brand} {item.product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.attributes.map((a) => a.displayValue).join(' · ')}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                      <div className="flex items-center gap-2">
                        <QuantityControl
                          value={item.quantity}
                          onChange={(q) =>
                            setItems((prev) => prev.map((it, i) => (i === index ? { ...it, quantity: q } : it)))
                          }
                          size="sm"
                        />
                        <button
                          onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 pb-6 border-t bg-background shrink-0 space-y-2 max-w-2xl w-full mx-auto">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">{formatPrice(total)}</span>
        </div>
        <Button
          variant="shop"
          className="w-full h-12 text-base font-semibold"
          onClick={handleProceed}
          disabled={!sizeId || items.length === 0}
        >
          {!sizeId ? 'Choose a box to continue' : items.length === 0 ? 'Add at least one item' : 'Checkout'}
        </Button>
      </div>

      <ProductDetailDrawer
        open={selectDrawerOpen}
        onOpenChange={setSelectDrawerOpen}
        productSlug={selectProductSlug}
        mode="select"
        onSelect={handleVariantSelected}
      />
    </div>
  );
}
