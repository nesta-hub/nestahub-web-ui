import { Layout, HomeHeader } from "@/components/layout";
import { ShopEntry } from "@/components/shop";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <Layout showNav={!isMobile}>
      {isMobile && <HomeHeader />}
      <ShopEntry />
    </Layout>
  );
};

export default Index;
