import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GiftBoxComposite } from "./GiftBoxComposite";

interface GiftBundleDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundleId: string | null;
  onContinue: () => void;
}

export function GiftBundleDetailDrawer({
  open,
  onOpenChange,
  bundleId,
  onContinue,
}: GiftBundleDetailDrawerProps) {
  const { data: bundleData } = useQuery({
    queryKey: ['bundle', bundleId],
    queryFn: () => bundleId ? api.getBundle(bundleId) : Promise.reject('No bundle ID'),
    enabled: !!bundleId && open,
  });

  if (!bundleData) return null;

  const categories = bundleData.categories || [];
  const boxItems = categories.flatMap((c) =>
    c.products.map((p) => ({
      name: `${p.variant.product.brand} ${p.variant.product.name}`,
      imageUrl: p.variant.imageUrl,
    }))
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh] overflow-hidden">
        <div className="flex flex-col h-full">
          <DrawerHeader className="text-center shrink-0">
            <DrawerTitle>{bundleData.name}</DrawerTitle>
            <DrawerDescription>
              {bundleData.giftCategory.name} · {bundleData.size.name}
            </DrawerDescription>
          </DrawerHeader>

          {/* "What's inside" preview (The Nesta Petit) */}
          <div className="shrink-0 h-48 mx-6 rounded-2xl overflow-hidden">
            <GiftBoxComposite categorySlug={bundleData.giftCategory.slug} items={boxItems} />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
            {categories.map((category, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📦</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{category.category.name}</p>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 pb-8 shrink-0">
            <Button variant="shop" className="w-full h-12" onClick={onContinue}>
              Continue
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
