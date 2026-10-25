import { useState } from "react";
import { CloudinaryPresets, cutoutCloudinaryUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface Props {
  /** The category's photo, as stored. */
  src: string;
  /** Where it sits in the tile (position and size). */
  className: string;
}

/**
 * A category's picture on a tile, as a cutout when there can be one.
 *
 * The photo shows at once, as it always has. Alongside it the cutout (the same picture with
 * its background removed) is fetched, and when it arrives the two cross-fade, so the box
 * around the product melts away. The first time Cloudinary sees an image it takes a moment
 * to remove the background; later it is instant. If the cutout can't be had (the add-on is
 * off, the allowance is used up, the picture isn't on Cloudinary) the photo simply stays.
 */
export function TileImage({ src, className }: Props) {
  const cutout = cutoutCloudinaryUrl(src);
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
