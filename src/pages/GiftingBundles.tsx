import { Layout } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import desktopPlaceholder from "@/assets/desktop-placeholder.jpg";
import { GiftBundlesTab } from "@/components/gifting/GiftBundlesTab";

const GiftingBundles = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

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
      <div className="min-h-screen pb-24">
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button onClick={() => navigate("/gifting")} className="p-1.5 -ml-1.5 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Gift Bundles</h1>
            <p className="text-xs text-muted-foreground">Curated baby care packages</p>
          </div>
        </div>
        <GiftBundlesTab />
      </div>
    </Layout>
  );
};

export default GiftingBundles;
