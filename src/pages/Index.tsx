import { Layout } from "@/components/layout";
import { MobileScrollHeader } from "@/components/layout/MobileScrollHeader";
import { ShopEntry } from "@/components/shop";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <Layout showNav={!isMobile}>
      {isMobile && <MobileScrollHeader />}
      <ShopEntry />
    </Layout>
  );
};

export default Index;
