import { useState } from "react";
import { CloudinaryPresets, optimizeCloudinaryUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface Props {
  /** The category's photo, as stored. */
  src: string;
  /**
   * The same picture with no background (the category's "Image (No background)" in the admin), if
   * there is one. It is an ordinary stored image: nothing is cut out when a shopper loads the page.
   */
  cutoutSrc?: string;
  /** Where it sits in the tile (position and size). */
  className: string;
}

/**
 * A category's picture on a tile, as a cutout when the category has one.
 *
 * The photo shows at once, as it always has. When there is a cutout it is fetched alongside, and
 * when it arrives the two cross-fade, so the box around the product melts away. If the cutout
 * can't be had, or there isn't one, the photo simply stays.
 */
export function TileImage({ src, cutoutSrc, className }: Props) {
  // A modest size, through Cloudinary's ordinary resize (not a background removal), so an
  // uploaded 2MB PNG doesn't go to every shopper as it is.
  const cutout = cutoutSrc ? optimizeCloudinaryUrl(cutoutSrc, { width: 480, crop: "fit" }) : null;
  const [state, setState] = useState<"waiting" | "ready" | "failed">(cutout ? "waiting" : "failed");
  const ready = state === "ready";

  return (
    <>
      <img
        src={CloudinaryPresets.catalogueCard(src)}
        alt=""
        loading="lazy"
        className={cn(
          "absolute block rounded-[14px] object-contain mix-blend-multiply transition-[opacity,transform] duration-[450ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.07] motion-reduce:transition-none",
          ready && "opacity-0",
          className,
        )}
      />
      {cutout && state !== "failed" && (
        <img
          src={cutout}
          alt=""
          loading="lazy"
          onLoad={() => setState("ready")}
          onError={() => setState("failed")}
          className={cn(
            "absolute block object-contain opacity-0 drop-shadow-[0_12px_12px_rgba(51,38,28,0.2)] transition-[opacity,transform] duration-[450ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.07] motion-reduce:transition-none",
            ready && "opacity-100",
            className,
          )}
        />
      )}
    </>
  );
}
