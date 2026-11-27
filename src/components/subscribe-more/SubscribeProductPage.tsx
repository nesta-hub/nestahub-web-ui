import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus, RefreshCw, Share2, X, ZoomIn } from "lucide-react";
import { Link } from "react-router-dom";
import { SubscribeChoiceFields } from "@/components/subscribe-card/SubscribeChoiceFields";
import { startingChoice, type SubscribeChoice } from "@/components/subscribe-card/choice";
import { VariantPicker } from "@/components/subscription-tab/VariantPicker";
import { selectionOf, variantFor } from "@/components/subscription-tab/variantChoices";
import { useProductDetail } from "@/hooks/useCatalogue";
import { formatPrice, type ProductDetail } from "@/lib/api";
import { apiProductToCatalogue, defaultSelectedAttrs } from "@/lib/catalogueAdapter";
import { CloudinaryPresets } from "@/lib/cloudinary";
import { shareProduct } from "@/lib/shareProduct";
import type { CatalogItem, EnrolInput } from "@/lib/subscriptionBoxes";
import { cn } from "@/lib/utils";
import { HowSubscribeWorks } from "./HowSubscribeWorks";
import { MAX_QUANTITY, MIN_QUANTITY, type EnrolOutcome } from "./SubscribeSheet";
import { GENERIC_FAILURE, enrolInput, priceFor, subscribableView } from "./helpers";

/** A description this long is folded to two lines, with "…more". */
const LONG_DESCRIPTION = 90;

interface Props {
  /** Every size of this product she can subscribe to, from the list. */
  items: CatalogItem[];
  /** Back to the list, with nothing done. */
  onBack: () => void;
  onSubscribe: (item: CatalogItem, input: EnrolInput) => Promise<EnrolOutcome>;
}

const roundButton =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-shop-ink shadow-[0_8px_18px_-10px_rgba(51,38,28,0.35),0_1px_4px_rgba(51,38,28,0.06)]";
const stepButton = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DCD4CA] bg-white disabled:opacity-40";
const smallCaps = "text-[10.5px] font-semibold uppercase leading-[14px] tracking-[0.16em] text-shop-muted";

/** Where the page starts: the variant the shop would start on, or else the first one she does not already subscribe to. */
function startingSelection(view: ProductDetail, items: CatalogItem[]): Record<string, string> {
  const start = defaultSelectedAttrs(view, apiProductToCatalogue(view)) ?? {};
  const taken = (id: string | undefined) => items.some((item) => item.variantId === id && item.subscribed);
  if (!taken(variantFor(view, start)?.id)) return start;
  const free = view.variants.find((variant) => !taken(variant.id));
  return free ? selectionOf(free) : start;
}

/**
 * A product she can subscribe to, as a full page, opened from "Subscribe to something else": the picture, the name and
 * subscription price, the type and size, how many, how often and the day of her first order. Subscribe signs her up
 * without buying it first; there is no one-time purchase here.
 */
export function SubscribeProductPage({ items, onBack, onSubscribe }: Props) {
  const first = items[0];
  const { data: detail, isLoading } = useProductDetail(first.slug ?? first.productId);

  // What she has picked in each group (Type, Size), once she picks. Until then, where the page starts.
  const [picked, setPicked] = useState<Record<string, string> | null>(null);
  // Without the product's details (they did not load), the size is picked from the list's own labels.
  const [pickedId, setPickedId] = useState(() => (items.find((item) => !item.subscribed) ?? first).variantId);
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  // Her own choice of how often, once she makes one. Until then it follows how long what she picked lasts.
  const [ownChoice, setOwnChoice] = useState<SubscribeChoice | null>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [learnMore, setLearnMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The list hands over a fresh array each time, so the sizes are kept by their ids.
  const idsKey = items.map((item) => item.variantId).join("|");
  /** Only the sizes in her list, with the groups (Type, Size) the product has. */
  const view = useMemo(() => (detail ? subscribableView(detail, new Set(idsKey.split("|"))) : null), [detail, idsKey]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-shop-page">
        <p className="animate-pulse text-sm text-shop-muted">Loading product…</p>
      </div>
    );
  }

  const usable = view && view.variants.length > 0 ? view : null;
  const selected = picked ?? (usable ? startingSelection(usable, items) : {});
  const variant = usable ? variantFor(usable, selected) : undefined;
  const item = usable ? items.find((i) => i.variantId === variant?.id) : items.find((i) => i.variantId === pickedId);

  const name = detail?.name ?? first.productName;
  const label = variant ? variant.attributes.map((a) => a.displayValue || a.value).join(" · ") : (item?.variantLabel ?? "");
  const image = variant?.imageUrl || detail?.imageUrl || item?.imageUrl || first.imageUrl;
  const description = variant?.description || detail?.description || "";
  const folded = description.length > LONG_DESCRIPTION && !descriptionOpen;

  const { payKobo } = item ? priceFor(item) : { payKobo: 0 };
  const choice = ownChoice ?? startingChoice(item?.recommendedFrequencyWeeks, quantity);
  const totalKobo = item ? payKobo * quantity : null;
  const alreadyHave = !!item?.subscribed;

  const subscribe = async () => {
    if (!item || busy) return;
    // Stay on this size even if the answer changes what the page would start on.
    setPicked(selected);
    setBusy(true);
    setError(null);
    try {
      const outcome = await onSubscribe(item, enrolInput(item, quantity, choice));
      if (!outcome.ok) setError(outcome.message ?? GENERIC_FAILURE);
    } catch {
      setError(GENERIC_FAILURE);
    } finally {
      setBusy(false);
    }
  };

  const message = error ?? (alreadyHave ? "You already subscribe to this one." : null);

  return (
    <div role="dialog" aria-label={name} className="fixed inset-0 z-[60] flex flex-col bg-shop-page text-shop-ink">
      <div className={cn("min-h-0 flex-1 overflow-y-auto", message ? "pb-[150px]" : "pb-[124px]")}>
        {/* Top bar */}
        <div className="box-border flex h-16 items-center justify-between px-3 pt-3">
          <button type="button" aria-label="Back" onClick={onBack} className={roundButton}>
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
          </button>
          {(detail?.slug ?? first.slug) && (
            <button type="button" aria-label="Share product" onClick={() => void shareProduct(name, detail?.slug ?? first.slug ?? "")} className={roundButton}>
              <Share2 className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
            </button>
          )}
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
            <p className="mt-0.5 text-[20px] font-extrabold leading-7 tracking-[-0.01em]">{totalKobo === null ? "—" : formatPrice(totalKobo)}</p>
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

        {/* Type and Size, as on every product page */}
        {usable ? (
          <div className="px-5 pt-5">
            <VariantPicker
              detail={usable}
              selected={selected}
              onChange={(next) => {
                setPicked(next);
                setError(null);
              }}
            />
          </div>
        ) : (
          items.length > 1 && (
            <div className="px-5 pt-5">
              <p className={cn(smallCaps, "mb-2")}>Size</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Size">
                {items.map((i) => (
                  <button
                    key={i.variantId}
                    type="button"
                    aria-pressed={i.variantId === pickedId}
                    onClick={() => {
                      setPickedId(i.variantId);
                      setError(null);
                    }}
                    className={cn(
                      "h-10 whitespace-nowrap rounded-[20px] border px-4 text-[14px] font-medium",
                      i.variantId === pickedId ? "border-[#A08B76] bg-[#A08B76]/10 text-[#A08B76]" : "border-[#E5E0DC] text-shop-ink",
                    )}
                  >
                    {i.variantLabel ?? i.productName}
                  </button>
                ))}
              </div>
            </div>
          )
        )}

        {/* Quantity */}
        <div className="flex items-center justify-between px-5 pt-4">
          <span className={smallCaps}>Quantity</span>
          <span className="flex items-center gap-1.5">
            <button type="button" aria-label="Fewer" disabled={quantity <= MIN_QUANTITY} onClick={() => setQuantity((q) => Math.max(MIN_QUANTITY, q - 1))} className={stepButton}>
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

        {/* Subscribe */}
        <section aria-label="Subscribe" className="mx-5 mt-4 rounded-[24px] border border-[#E5E0DC] bg-white p-[15px]">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DDE3DA] text-[#46564A]">
              <RefreshCw className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[16px] font-extrabold leading-[22px]">Subscribe</p>
              <p className="mt-0.5 text-[12.5px] font-medium leading-[17px] text-shop-muted">
                Never run out or come back to reorder.{" "}
                <button
                  type="button"
                  onClick={() => setLearnMore(true)}
                  className="-mx-0.5 -my-2 inline px-0.5 py-2 font-bold text-shop-brown underline underline-offset-[3px]"
                >
                  Learn more
                </button>
              </p>
            </div>
          </div>

          {/* How often, and the day of the first order */}
          {item && (
            <div className="mt-3.5 border-t border-[#EEE8E1] pt-3.5">
              <p className={cn(smallCaps, "mb-2.5")}>Renewal frequency</p>
              <SubscribeChoiceFields value={choice} onChange={setOwnChoice} firstOrder />
            </div>
          )}
        </section>
        <div className="h-6" />
      </div>

      {/* Subscribe, pinned */}
      <div className="absolute inset-x-0 bottom-0 box-border min-h-[100px] border-t border-shop-line bg-shop-cream/[0.96] px-5 pb-8 pt-3 backdrop-blur-[14px]">
        {message && (
          <p role="alert" className="mb-2.5 text-center text-[13px] font-bold leading-[18px] text-[#9A4A3A]">
            {message}
            {alreadyHave && (
              <>
                {" "}
                <Link to="/subscriptions" className="underline underline-offset-2">
                  See your subscription
                </Link>
              </>
            )}
          </p>
        )}
        <button
          type="button"
          disabled={!item || busy || alreadyHave}
          onClick={() => void subscribe()}
          className="flex h-14 w-full items-center justify-between rounded-[28px] bg-shop-cta pl-6 pr-2 text-[15px] font-extrabold text-shop-cream hover:bg-shop-cta-hover disabled:opacity-50"
        >
          <span>{busy ? "One moment…" : "Subscribe"}</span>
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
