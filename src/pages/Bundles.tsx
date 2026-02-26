import { useIsMobile } from "@/hooks/use-mobile";
import { Layout } from "@/components/layout";
import { StageSelector } from "@/components/bundles";
import { MobileBundlePage } from "@/components/bundles/mobile";

const Bundles = () => {
  const isMobile = useIsMobile();

  return (
    <div>
      {/* Mobile: Single-page experience with slide-in drawer */}
      {isMobile ? (
        <MobileBundlePage />
      ) : (
        /* Desktop: Original multi-page experience */
        <Layout>
          <div className="container py-8">
            <StageSelector />
          </div>
        </Layout>
      )}
    </div>
  );
};

export default Bundles;
