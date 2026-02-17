import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { BundleTier, BundleItem, Stage, bundleCategoryDescriptions } from "@/data/bundleData";

interface GiftBundleDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: BundleTier | null;
  stage: Stage | null;
  contents: BundleItem[];
  onContinue: () => void;
}

export function GiftBundleDetailDrawer({
  open,
  onOpenChange,
  tier,
  stage,
  contents,
  onContinue,
}: GiftBundleDetailDrawerProps) {
  if (!tier || !stage) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[70vh] overflow-hidden">
        <div className="flex flex-col h-full">
          <DrawerHeader className="text-center shrink-0">
            <DrawerTitle>{tier.name}</DrawerTitle>
            <DrawerDescription>{stage.name} · {stage.ageRange}</DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4 space-y-4">
            {contents.map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📦</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.category}</p>
                  <p className="text-sm text-muted-foreground">
                    {bundleCategoryDescriptions[item.category] || item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 pb-8 shrink-0">
            <Button
              variant="shop"
              className="w-full h-12"
              onClick={onContinue}
            >
              Continue
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}