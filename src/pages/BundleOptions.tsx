import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Info, Package } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { TierCard } from "@/components/bundles";
import { getStageById, bundleTiers } from "@/data/bundleData";
import { useIsMobile } from "@/hooks/use-mobile";

const BundleOptions = () => {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const stage = stageId ? getStageById(stageId) : undefined;

  if (!stage) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-muted-foreground">Stage not found</p>
        </div>
      </Layout>
    );
  }

  const handleTierSelect = (tierId: string) => {
    navigate(`/configure/${stageId}__${tierId}`);
  };

  if (isMobile) {
    return (
      <Layout>
        <div className="container py-6 space-y-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2"
            onClick={() => navigate("/bundles")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {stage.name} Bundles
            </h1>
            <p className="text-muted-foreground">
              {stage.ageRange || stage.weightRange} • {stage.description}
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Each bundle is carefully designed to cover your baby's needs for a typical one-month period.
            </p>
          </div>

          <div className="grid gap-4">
            {bundleTiers.map((tier) => (
              <TierCard
                key={tier.id}
                tier={tier}
                stageId={stageId || ""}
                onClick={() => handleTierSelect(tier.id)}
              />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Desktop layout
  return (
    <Layout>
      <div className="container py-8 max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/bundles">Bundles</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{stage.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Split Hero */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left - Image placeholder */}
          <div className="bg-muted/30 rounded-2xl aspect-[4/3] flex items-center justify-center">
            <div className="text-center space-y-4 p-8">
              <Package className="w-24 h-24 text-muted-foreground/50 mx-auto" />
              <p className="text-muted-foreground">Bundle illustration</p>
            </div>
          </div>

          {/* Right - Stage info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-5xl">{stage.emoji}</span>
              <h1 className="text-4xl font-bold text-foreground">
                {stage.name} Bundles
              </h1>
              <p className="text-xl text-muted-foreground">
                {stage.ageRange || stage.weightRange} • {stage.description}
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                Each bundle is carefully designed to cover your baby's needs for a{" "}
                <span className="font-medium text-foreground">typical one-month period</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Tier cards - 4 columns */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Choose Your Bundle</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bundleTiers.map((tier) => (
              <TierCard
                key={tier.id}
                tier={tier}
                stageId={stageId || ""}
                onClick={() => handleTierSelect(tier.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BundleOptions;
