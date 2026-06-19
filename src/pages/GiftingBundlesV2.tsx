import { Layout } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";
import desktopPlaceholder from "@/assets/desktop-placeholder.jpg";
import { BundlesPage } from "@/components/gifting/bundles/BundlesPage";

const GiftingBundlesV2 = () => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <Layout showNav={false}>
        <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center">
          <img src={desktopPlaceholder} alt="Baby care essentials" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <div className="relative z-10 text-center px-4">
            <h1 className="text-4xl font-bold text-foreground mb-4">Desktop Experience Coming Soon</h1>
            <p className="text-muted-foreground max-w-md mx-auto text-lg font-medium">Browse on a mobile device or a tablet to shop.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNav={false}>
      <BundlesPage />
    </Layout>
  );
};

export default GiftingBundlesV2;
