import { ArrowLeft } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DesktopProductDetailContent } from "@/components/catalogue/v2/DesktopProductDetailContent";

/** A product, opened over the shop in a side sheet. Open whenever `productKey` is set. */
export function ProductSheet({ productKey, onClose }: { productKey: string | null; onClose: () => void }) {
  return (
    <Sheet open={!!productKey} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col overflow-hidden p-0 sm:max-w-3xl">
        {productKey && (
          <div className="flex h-full flex-col">
            <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-background/95 px-6 py-5 backdrop-blur-md">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
              </button>
            </div>
            <div className="flex-1 overflow-y-auto animate-fade-in">
              <DesktopProductDetailContent productKey={productKey} fitContent={false} showShareButton={false} onAdded={onClose} />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
