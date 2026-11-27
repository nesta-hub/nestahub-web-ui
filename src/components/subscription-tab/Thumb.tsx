import { useState } from "react";

/**
 * A product picture that gives way to its plain background if the picture cannot load, instead of showing the
 * browser's broken-image icon.
 */
export function Thumb({ src, className = "h-full w-full object-cover" }: { src: string | null | undefined; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return null;
  return <img src={src} alt="" className={className} onError={() => setBroken(true)} />;
}
