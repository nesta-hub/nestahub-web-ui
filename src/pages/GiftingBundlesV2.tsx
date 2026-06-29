import { Layout } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { BundlesPage } from "@/components/gifting/bundles/BundlesPage";
import { DesktopGiftBundlesPage } from "@/components/gifting/desktop/DesktopGiftBundlesPage";

const GiftingBundlesV2 = () => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <DesktopGiftBundlesPage />;
  }

  return (
    <Layout showNav={false}>
      <BundlesPage />
    </Layout>
  );
};

export default GiftingBundlesV2;
