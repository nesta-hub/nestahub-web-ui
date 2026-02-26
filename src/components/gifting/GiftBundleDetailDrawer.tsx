import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface GiftBundleDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundleId: string | null;
  ageGroupSlug: string | null;
  onContinue: () => void;
}

// Category emoji mapping (from nesting-essentials)
const categoryEmoji: Record<string, string> = {
  'Diapers': '🩲',
  'Wipes': '🧻',
  'Vaseline': '🧈',
  'Lotion': '🧴',
  'Baby Wash': '🫧',
  'Baby Oil': '💧',
};

export function GiftBundleDetailDrawer({
  open,
  onOpenChange,
  bundleId,
  ageGroupSlug,
  onContinue,
}: GiftBundleDetailDrawerProps) {
  // Fetch bundle details from API
  const { data: bundleData } = useQuery({
    queryKey: ['bundle', bundleId],
    queryFn: () => bundleId ? api.getBundle(bundleId) : Promise.reject('No bundle ID'),
    enabled: !!bundleId && open,
  });

  if (!bundleData || !ageGroupSlug) return null;

  // Get categories from the first bundleAgeGroup
  const categories = bundleData.bundleAgeGroups?.[0]?.categories || [];
  const ageGroupData = bundleData.bundleAgeGroups?.[0];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[70vh] overflow-hidden">
        <div className="flex flex-col h-full">
          <DrawerHeader className="text-center shrink-0">
            <DrawerTitle>{bundleData.name}</DrawerTitle>
            <DrawerDescription>
              {ageGroupData?.ageGroup.name} · {ageGroupData?.ageGroup.ageRangeStart}-{ageGroupData?.ageGroup.ageRangeEnd} months
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4 space-y-4">
            {categories.map((category, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">
                    📦
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{category.category.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
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