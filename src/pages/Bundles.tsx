import { useIsMobile } from "@/hooks/use-mobile";
import { Layout } from "@/components/layout";
import { StageSelector } from "@/components/bundles";
import { MobileBundlePage } from "@/components/bundles/mobile";

const Bundles = () => {
  const isMobile = useIsMobile();

  // Mobile: Single-page experience with slide-in drawer
  if (isMobile) {
    return <MobileBundlePage />;
  }

  // Desktop: Original multi-page experience
  return (
    <Layout>
      <div className="container py-8">
        <StageSelector />
      </div>
    </Layout>
  );
};

export default Bundles;
