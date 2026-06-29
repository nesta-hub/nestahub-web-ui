import { Suspense, lazy } from "react";

// Lazily load the WebGL box so the three.js bundle (~900kB) only ships on the
// gifting screens that actually render it.
const GiftBox3D = lazy(() => import("./GiftBox3D"));

export interface GiftBox3DLazyProps {
  categorySlug?: string;
  sizeSlug?: string;
  items?: { name: string; imageUrl?: string }[];
}

export function GiftBox3DLazy(props: GiftBox3DLazyProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
          Loading preview…
        </div>
      }
    >
      <GiftBox3D {...props} />
    </Suspense>
  );
}

export default GiftBox3DLazy;
