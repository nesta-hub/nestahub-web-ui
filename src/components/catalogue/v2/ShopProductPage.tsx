import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus, RefreshCw, Share2, ShoppingCart, X, ZoomIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlreadySubscribedCard } from "@/components/subscribe-card/AlreadySubscribed";
import { SubscribeChoiceFields } from "@/components/subscribe-card/SubscribeChoiceFields";
import { startingChoice, subscribeFields, type SubscribeChoice } from "@/components/subscribe-card/choice";
import { HowSubscribeWorks } from "@/components/subscribe-more/HowSubscribeWorks";
import { VariantPicker } from "@/components/subscription-tab/VariantPicker";
import { onSaleView, variantFor } from "@/components/subscription-tab/variantChoices";
import { useCart } from "@/contexts/CartContext";
import { useProductDetail } from "@/hooks/useCatalogue";
import { useSubscribedItems } from "@/hooks/useSubscribedItems";
import { formatPrice } from "@/lib/api";
import { apiProductToCatalogue, defaultSelectedAttrs } from "@/lib/catalogueAdapter";
import { CloudinaryPresets } from "@/lib/cloudinary";
import { metaPixel } from "@/lib/metaPixel";
import { shareProduct } from "@/lib/shareProduct";
import { cn } from "@/lib/utils";

/** A description this long is folded to two lines, with "…more". */
const LONG_DESCRIPTION = 90;
const MAX_QUANTITY = 99;

const roundButton =
  "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-shop-ink shadow-[0_8px_18px_-10px_rgba(51,38,28,0.35),0_1px_4px_rgba(51,38,28,0.06)]";
const stepButton = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DCD4CA] bg-white disabled:opacity-40";
const smallCaps = "text-[10.5px] font-semibold uppercase leading-[14px] tracking-[0.16em] text-shop-muted";

/**
 * A product in the shop, as a full page (the new Subscribe experience on a phone): the picture, name and price, the
 * type and size, how many, and, for something she can subscribe to, the Subscribe card, which starts switched off.
 * The button puts it in her cart, subscribed or not; "Learn more" opens how Subscribe works in a bottom drawer.
 */
export function ShopProductPage({ productKey, onBack, onAdded }: { productKey: string; onBack: () => void; onAdded: () => void }) {
  const navigate = useNavigate();
  const { addToCart, itemCount } = useCart();
  const { data: detail, isLoading } = useProductDetail(productKey);
  const subscribedTo = useSubscribedItems(true);

  const [picked, setPicked] = useState<Record<string, string> | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [on, setOn] = useState(false);
  // Her own choice of how often, once she makes one. Until then it follows how long what she picked lasts.
  const [ownChoice, setOwnChoice] = useState<SubscribeChoice | null>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [learnMore, setLearnMore] = useState(false);

  /** Only what is on sale, with the groups (Type, Size) the product has. */
  const view = useMemo(() => (detail ? onSaleView(detail) : null), [detail]);

  // Switched on, the card grows (how often, and more): bring all of it into view, above the pinned button.
  const subscribeRef = useRef<HTMLElement>(null);
  const revealOnNextRender = useRef(false);
  useEffect(() => {
    if (!on || !revealOnNextRender.current) return;
    revealOnNextRender.current = false;
    subscribeRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [on]);

  if (isLoading || !detail || !view) {
    return (
      <div role="dialog" aria-label="Product" className="fixed inset-0 z-[60] flex items-center justify-center bg-shop-page">
        <p className="animate-pulse text-sm text-shop-muted">{isLoading ? "Loading product…" : "This product is not available."}</p>
        {!isLoading && (
          <button type="button" aria-label="Back" onClick={onBack} className={cn(roundButton, "absolute left-3 top-3")}>
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }

  const selected = picked ?? defaultSelectedAttrs(view, apiProductToCatalogue(view)) ?? {};
  const variant = variantFor(view, selected);
  const unitPrice = variant?.price ?? null;
  const canAdd = !!variant && variant.isActive && unitPrice != null;
  // She already subscribes to this type and size: show that subscription, and only a one-time purchase.
  const existing = subscribedTo(variant?.id);
  const canSubscribe = !!variant?.isSubscribable && !existing;
  const subscribing = on && canSubscribe;
  const payUnit = variant?.subscriptionPrice && unitPrice != null && variant.subscriptionPrice < unitPrice ? variant.subscriptionPrice : null;
  const choice = ownChoice ?? startingChoice(variant?.recommendedFrequencyWeeks, quantity);

  const name = `${detail.brand} ${detail.name}`.trim();
  const label = variant ? variant.attributes.map((a) => a.displayValue || a.value).join(" · ") : "";
  const image = variant?.imageUrl || detail.imageUrl;
  const description = variant?.description || detail.description || "";
  const folded = description.length > LONG_DESCRIPTION && !descriptionOpen;
  const totalKobo = unitPrice == null ? null : (subscribing ? (variant?.subscriptionPrice ?? unitPrice) : unitPrice) * quantity;

  const add = () => {
    if (!canAdd || !variant || unitPrice == null) return;
    const attributes = apiProductToCatalogue(view).attributes ?? [];
    const [typeAttr, sizeAttr] = attributes;
    addToCart(
      {
        variantId: variant.id,
        productId: detail.id,
        productName: detail.name,
        brand: detail.brand,
        slug: detail.slug,
        typeId: (typeAttr ? selected[typeAttr.name] : null) || "_default",
        typeName: typeAttr?.values.find((v) => v.id === selected[typeAttr.name])?.name || "",
        sizeId: sizeAttr ? selected[sizeAttr.name] : undefined,
        sizeName: sizeAttr?.values.find((v) => v.id === selected[sizeAttr.name])?.name,
        attributes: variant.attributes.map((a) => ({ attributeName: a.attributeName, value: a.value, displayValue: a.displayValue })),
        unitPrice,
        image: image || undefined,
        ...subscribeFields(subscribing ? choice : null),
        subscriptionPrice: variant.subscriptionPrice,
        recommendedFrequencyWeeks: variant.recommendedFrequencyWeeks,
      },
      quantity,
    );
    metaPixel.addToCart({ content_name: detail.name, content_ids: [detail.id], value: unitPrice, currency: "NGN", num_items: quantity });
    toast.success("Added to cart", { duration: 3000, action: { label: "Go to Cart", onClick: () => navigate("/cart") } });
    onAdded();
  };

  return (
    <div role="dialog" aria-label={name} className="fixed inset-0 z-[60] flex flex-col bg-shop-page text-shop-ink">
      <div className="min-h-0 flex-1 overflow-y-auto pb-[124px]">
        {/* Top bar */}
        <div className="box-border flex h-16 items-center justify-between px-3 pt-3">
          <button type="button" aria-label="Back" onClick={onBack} className={roundButton}>
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Share product" onClick={() => void shareProduct(name, detail.slug)} className={roundButton}>
              <Share2 className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button type="button" aria-label={`Open cart with ${itemCount} items`} onClick={() => navigate("/cart")} className={roundButton}>
              <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
              {itemCount > 0 && (
                <span className="absolute right-0 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-[9px] bg-shop-brown px-1 text-[10px] font-bold leading-none text-shop-cream">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* The product */}
        <div className="flex items-center gap-4 px-5 pt-1.5">
          <button
            type="button"
            aria-label="View larger image"
            onClick={() => setZoomed(true)}
            className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[26px] bg-[#EFEAE4] shadow-[0_10px_22px_-14px_rgba(51,38,28,0.45)]"
          >
            {image && <img src={CloudinaryPresets.categoryTile(image)} alt={name} className="block h-full w-full object-cover" />}
            <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white/90 text-shop-ink">
              <ZoomIn className="h-[13px] w-[13px]" strokeWidth={2} />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-[22px] font-extrabold leading-[27px] tracking-[-0.015em]">{name}</h1>
            {label && <p className="mt-[3px] text-[13px] leading-[18px] text-shop-muted">{label}</p>}
            <p className="mt-0.5 text-[20px] font-extrabold leading-7 tracking-[-0.01em]">{unitPrice == null ? "—" : formatPrice(unitPrice * quantity)}</p>
            {!canAdd && <p className="mt-0.5 text-[12.5px] font-bold text-[#9A4A3A]">This combination is unavailable</p>}
          </div>
        </div>

        {/* Description: two lines, with "more" at the end of the second */}
        {description && (
          <div className="px-5 pt-3.5">
            <div className="relative">
              <p className={cn("m-0 text-[13.5px] leading-5 text-[#5A4E44]", folded && "max-h-10 overflow-hidden")}>
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

        {/* Type and Size */}
        {view.variants.length > 0 && (
          <div className="px-5 pt-5">
            <VariantPicker
              detail={view}
              selected={selected}
              onChange={(next) => {
                setPicked(next);
                setOwnChoice(null);
              }}
            />
          </div>
        )}

        {/* Quantity */}
        <div className="flex items-center justify-between px-5 pt-4">
          <span className={smallCaps}>Quantity</span>
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

        {existing && (
          <div className="mx-5 mt-4">
            <AlreadySubscribedCard item={existing} />
          </div>
        )}

        {/* Subscribe, for something she can subscribe to */}
        {canSubscribe && (
          <section ref={subscribeRef} aria-label="Subscribe" className="mx-5 mt-4 scroll-mb-[124px] rounded-[24px] border border-[#E5E0DC] bg-white p-[15px]">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DDE3DA] text-[#46564A]">
                <RefreshCw className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[16px] font-extrabold leading-[22px]">
                  Subscribe
                  {payUnit !== null && (
                    <span className="whitespace-nowrap rounded-full bg-[#DDE3DA] px-[9px] py-[3px] text-[12px] font-extrabold leading-[18px] text-[#34443A]">
                      and pay {formatPrice(payUnit * quantity)}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[12.5px] font-medium leading-[17px] text-shop-muted">
                  Never run out or come back to reorder.{" "}
                  <button type="button" onClick={() => setLearnMore(true)} className="-mx-0.5 -my-2 inline px-0.5 py-2 font-bold text-shop-brown underline underline-offset-[3px]">
                    Learn more
                  </button>
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label="Subscribe to this item"
                onClick={() => {
                  revealOnNextRender.current = !on;
                  setOn(!on);
                  setOwnChoice(null);
                }}
                className="relative h-11 w-12 shrink-0"
              >
                <span className={cn("absolute left-0 top-[7px] h-[30px] w-12 rounded-[15px] transition-colors duration-200", on ? "bg-shop-brown" : "bg-[#D5CCC1]")} />
                <span
                  className={cn(
                    "absolute top-[9px] h-[26px] w-[26px] rounded-full bg-white shadow-[0_2px_4px_rgba(51,38,28,0.3)] transition-[left] duration-200",
                    on ? "left-5" : "left-0.5",
                  )}
                />
              </button>
            </div>

            {/* How often, and the first renewal, while Subscribe is on */}
            {on && (
              <div className="mt-3.5 border-t border-[#EEE8E1] pt-3.5">
                <p className={cn(smallCaps, "mb-2.5")}>Renewal frequency</p>
                <SubscribeChoiceFields value={choice} onChange={setOwnChoice} showFirstRenewal={false} />
              </div>
            )}
          </section>
        )}
        <div className="h-6" />
      </div>

      {/* Add to cart, pinned */}
      <div className="absolute inset-x-0 bottom-0 box-border min-h-[100px] border-t border-shop-line bg-shop-cream/[0.96] px-5 pb-8 pt-3 backdrop-blur-[14px]">
        <button
          type="button"
          disabled={!canAdd}
          onClick={add}
          className="flex h-14 w-full items-center justify-between rounded-[28px] bg-shop-cta pl-6 pr-2 text-[15px] font-extrabold text-shop-cream hover:bg-shop-cta-hover disabled:opacity-50"
        >
          <span>{!canAdd ? "Unavailable" : subscribing ? "Add to cart & subscribe" : "Add to cart"}</span>
          <span className="flex items-center gap-2.5">
            <span className="tabular-nums">{totalKobo === null ? "" : formatPrice(totalKobo)}</span>
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-shop-cream text-shop-cta">
              <ArrowRight className="h-[17px] w-[17px]" strokeWidth={2.4} />
            </span>
          </span>
        </button>
      </div>

      <HowSubscribeWorks open={learnMore} onClose={() => setLearnMore(false)} />

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
            <img src={CloudinaryPresets.detail(image)} alt={name} onClick={(event) => event.stopPropagation()} className="max-h-[80vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl" />
          ) : (
            <div onClick={(event) => event.stopPropagation()} className="h-[80vw] max-h-[480px] w-[92vw] max-w-[480px] rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary/30 shadow-2xl" />
          )}
        </div>
      )}
    </div>
  );
}
