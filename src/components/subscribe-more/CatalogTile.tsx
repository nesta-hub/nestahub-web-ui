import type { ReactNode } from "react";
import { Package } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "@/lib/api";
import type { CatalogProduct } from "./helpers";

interface Props {
  product: CatalogProduct;
  /** Opens the product's page. Not used for one she already subscribes to: that one goes to her subscription. */
  onOpen: () => void;
}

const tile = "block w-full text-left text-shop-ink no-underline";

/**
 * One product in a category's row: a square picture, its name and the least she would pay. One she already subscribes
 * to carries a "Subscribed" tag and takes her to her subscription instead of its page.
 */
export function CatalogTile({ product, onOpen }: Props) {
  const body: ReactNode = (
    <>
      <span className="relative block h-[148px] w-[148px] overflow-hidden rounded-[22px] bg-[#EFEAE4] shadow-[0_10px_24px_-16px_rgba(51,38,28,0.4)]">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="block h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[#BDB1A4]">
            <Package className="h-[34px] w-[34px]" strokeWidth={1.5} aria-hidden="true" />
          </span>
        )}
        {product.subscribed && (
          <span className="absolute bottom-2 left-2 rounded-full bg-[#DDE3DA] px-[9px] py-[3px] text-[11px] font-extrabold leading-[15px] text-[#34443A]">Subscribed</span>
        )}
      </span>
      <span className="mt-2 line-clamp-2 block text-[13.5px] font-extrabold leading-[18px] text-shop-ink">{product.name}</span>
      <span className="mt-px block text-[12.5px] leading-[17px] text-shop-muted">
        {product.pricesDiffer ? "From " : ""}
        {formatPrice(product.fromKobo)}
      </span>
    </>
  );

  return (
    <li className="w-[148px] shrink-0 list-none snap-start">
      {product.subscribed ? (
        <Link to="/subscriptions" className={tile}>
          {body}
        </Link>
      ) : (
        <button type="button" onClick={onOpen} className={tile}>
          {body}
        </button>
      )}
    </li>
  );
}
