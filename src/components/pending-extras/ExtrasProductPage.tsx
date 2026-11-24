import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus, Share2, X, ZoomIn } from "lucide-react";
import { VariantPicker } from "@/components/subscription-tab/VariantPicker";
import { onSaleView, selectionOf, variantFor } from "@/components/subscription-tab/variantChoices";
import { usePendingExtras } from "@/contexts/PendingExtrasContext";
import { useProductDetail } from "@/hooks/useCatalogue";
import { formatPrice } from "@/lib/api";
import { apiProductToCatalogue, defaultSelectedAttrs } from "@/lib/catalogueAdapter";
import { CloudinaryPresets } from "@/lib/cloudinary";
import { shareProduct } from "@/lib/shareProduct";

/** The most of one thing an order can hold as extras (the API's limit). */
const MAX_QUANTITY = 20;
/** A description this long is folded to two lines, with "…more". */
const LONG_DESCRIPTION = 90;

interface Props {
  /** Product slug or id. */
  productKey: string;
  /** Back to the shop, with nothing added. */
  onBack: () => void;
  /** Added: back to the shop, which now shows it in the bar. */
  onAdded: () => void;
}

const roundButton =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-shop-ink shadow-[0_8px_18px_-10px_rgba(51,38,28,0.35),0_1px_4px_rgba(51,38,28,0.06)]";
const stepButton = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DCD4CA] bg-white disabled:opacity-40";

/**
 * A product, as a full page, while she is adding extra items to an order: the picture, the name and price, the type and
 * size, how many, and "Add to pending order". Adding it puts it with the other extras, not in her cart, and does not
 * change her subscription.
 */
export function ExtrasProductPage({ productKey, onBack, onAdded }: Props) {
  const { add } = usePendingExtras();
  const { data: detail, isLoading } = useProductDetail(productKey);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  /** Only what is on sale, with the groups (Type, Size) the product has. */
  const view = useMemo(() => (detail ? onSaleView(detail) : null), [detail]);

  // Start on the variant the shop would start on, each time a product opens.
  useEffect(() => {
    if (!detail || !view) return;
    const product = apiProductToCatalogue(view);
    setSelected(defaultSelectedAttrs(view, product) ?? {});
    setQuantity(1);
    setDescriptionOpen(false);
    setZoomed(false);
  }, [detail, view]);

  if (isLoading || !detail || !view) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-shop-page">
        <p className="animate-pulse text-sm text-shop-muted">Loading product…</p>
      </div>
    );
  }

  const variant = variantFor(view, selected);
  const title = `${detail.brand} ${detail.name}`;
  const label = variant ? variant.attributes.map((a) => a.displayValue || a.value).join(" · ") : "";
  const image = variant?.imageUrl || detail.imageUrl;
  const description = variant?.description || detail.description || "";
  const folded = description.length > LONG_DESCRIPTION && !descriptionOpen;
  const lineKobo = variant ? variant.price * quantity : null;

  const addToPendingOrder = () => {
    if (!variant) return;
    add(
      {
        variantId: variant.id,
        productName: detail.name,
        brand: detail.brand,
        variantLabel: label || null,
        imageUrl: image || null,
        unitPriceKobo: variant.price,
      },
      quantity,
    );
    onAdded();
  };

  return (
    <div role="dialog" aria-label={title} className="fixed inset-0 z-50 flex flex-col bg-shop-page text-shop-ink">
      <div className="min-h-0 flex-1 overflow-y-auto pb-[124px]">
        {/* Top bar */}
        <div className="box-border flex h-16 items-center justify-between px-3 pt-3">
          <button type="button" aria-label="Back" onClick={onBack} className={roundButton}>
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Share product" onClick={() => void shareProduct(title, detail.slug)} className={roundButton}>
            <Share2 className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        {/* The product */}
        <div className="flex items-center gap-4 px-5 pt-1.5">
          <button
            type="button"
            aria-label="View larger image"
            onClick={() => setZoomed(true)}
            className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[26px] bg-[#EFEAE4] shadow-[0_10px_22px_-14px_rgba(51,38,28,0.45)]"
          >
            {image && <img src={CloudinaryPresets.categoryTile(image)} alt={detail.name} className="block h-full w-full object-cover" />}
            <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white/90 text-shop-ink">
              <ZoomIn className="h-3.5 w-3.5" />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-[22px] font-extrabold leading-[27px] tracking-[-0.015em]">{title}</h1>
            {label && <p className="mt-[3px] text-[13px] leading-[18px] text-shop-muted">{label}</p>}
            <p className="mt-0.5 text-[20px] font-extrabold leading-7 tracking-[-0.01em]">{lineKobo === null ? "—" : formatPrice(lineKobo)}</p>
          </div>
        </div>

        {/* Description: two lines, with "more" at the end of the second */}
        {description && (
          <div className="px-5 pt-3.5">
            <div className="relative">
              <p className={`m-0 text-[13.5px] leading-5 text-[#5A4E44] ${folded ? "max-h-10 overflow-hidden" : ""}`}>
                {description}
                {descriptionOpen && (
                  <button type="button" aria-expanded="true" onClick={() => setDescriptionOpen(false)} className="ml-0.5 inline-block h-11 px-1 text-[13.5px] font-extrabold leading-[44px] text-shop-brown">
                    less
                  </button>
                )}
              </p>
              {folded && (
                <div className="absolute bottom-0 right-0 h-5 w-20">
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-shop-page/0 from-0% to-shop-page to-[42%]" />
                  <button
                    type="button"
                    aria-expanded="false"
                    aria-label="Read the full description"
                    onClick={() => setDescriptionOpen(true)}
                    className="absolute -top-3 right-0 h-11 pl-[26px] text-[13.5px] font-extrabold text-shop-brown"
                  >
                    …more
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Type and Size, as on every product page */}
        <div className="px-5 pt-5">
          <VariantPicker detail={view} selected={selected} onChange={setSelected} />
        </div>

        {/* Quantity */}
        <div className="flex items-center justify-between px-5 pt-3.5">
          <span className="text-[10.5px] font-semibold uppercase leading-[14px] tracking-[0.16em] text-shop-muted">Quantity</span>
          <span className="flex items-center gap-1.5">
            <button type="button" aria-label="Fewer" disabled={quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))} className={stepButton}>
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="min-w-[30px] text-center text-[18px] font-extrabold tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <button type="button" aria-label="More" disabled={quantity >= MAX_QUANTITY} onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))} className={stepButton}>
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </span>
        </div>

        <p className="mx-5 mt-[18px] text-[12.5px] leading-[18px] text-shop-muted">This item is added to this order only. It does not change your subscription.</p>
      </div>

      {/* Add to pending order, pinned */}
      <div className="absolute inset-x-0 bottom-0 box-border h-[100px] border-t border-shop-line bg-shop-cream/[0.96] px-5 pt-3 backdrop-blur-[14px]">
        <button
          type="button"
          disabled={!variant}
          onClick={addToPendingOrder}
          className="flex h-14 w-full items-center justify-between rounded-[28px] bg-shop-cta pl-6 pr-2 text-[15px] font-extrabold text-shop-cream hover:bg-shop-cta-hover disabled:opacity-50"
        >
          <span>Add to pending order</span>
          <span className="flex items-center gap-2.5">
            <span className="tabular-nums">{lineKobo === null ? "" : formatPrice(lineKobo)}</span>
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-shop-cream text-shop-cta">
              <ArrowRight className="h-[17px] w-[17px]" strokeWidth={2.4} />
            </span>
          </span>
        </button>
      </div>

      {/* Image zoom */}
      {zoomed && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 backdrop-blur-sm" onClick={() => setZoomed(false)}>
          <button
            type="button"
            aria-label="Close magnified image"
            onClick={(event) => {
              event.stopPropagation();
              setZoomed(false);
            }}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/80 text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          {image ? (
            <img src={CloudinaryPresets.detail(image)} alt={detail.name} onClick={(event) => event.stopPropagation()} className="max-h-[80vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl" />
          ) : (
            <div onClick={(event) => event.stopPropagation()} className="h-[80vw] max-h-[480px] w-[92vw] max-w-[480px] rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/30 shadow-2xl" />
          )}
        </div>
      )}
    </div>
  );
}
