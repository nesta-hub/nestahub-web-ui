import { Plus } from "lucide-react";
import type { ProductCard } from "@/lib/api";
import { CloudinaryPresets } from "@/lib/cloudinary";
import { priceLabel } from "./listingHelpers";

/** A product on the listing page: photo, brand, name and price. Opens the product when tapped. */
export function ListingCard({ product, onOpen }: { product: ProductCard; onOpen: () => void }) {
  return (
    <article className="group relative rounded-[22px] border border-[#ECE5DB] bg-white p-3 transition-[transform,box-shadow] duration-[280ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:-translate-y-[5px] hover:shadow-[0_24px_40px_-26px_rgba(51,38,28,0.4)] motion-reduce:transition-none">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <span className="block aspect-square overflow-hidden rounded-[14px] bg-shop-surface">
          {product.imageUrl ? (
            <img
              src={CloudinaryPresets.catalogueCard(product.imageUrl)}
              alt=""
              loading="lazy"
              className="block h-full w-full object-cover transition-transform duration-[450ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-105 motion-reduce:transition-none"
            />
          ) : null}
        </span>
        <span className="mt-3 block truncate text-[11.5px] font-bold uppercase leading-[14px] tracking-[0.1em] text-shop-muted">{product.brand}</span>
        <span className="mt-1 line-clamp-2 block min-h-[44px] text-base font-bold leading-[22px] text-shop-ink">{product.name}</span>
        <span className="mt-1.5 block pr-12 text-[17px] font-extrabold leading-[22px] text-shop-brown">{priceLabel(product)}</span>
      </button>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${product.name}`}
        className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-shop-brown text-shop-cream transition duration-200 hover:scale-[1.06] hover:bg-shop-brown-dark active:scale-95"
      >
        <Plus className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
      </button>
    </article>
  );
}
