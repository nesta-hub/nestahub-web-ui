import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb } from "lucide-react";
import { StageCard } from "./StageCard";
import { stagesByAge, stagesByWeight } from "@/data/bundleData";
import { useIsMobile } from "@/hooks/use-mobile";

export function StageSelector() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleStageSelect = (stageId: string) => {
    navigate(`/bundles/${stageId}`);
  };

  if (isMobile) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Find Your Baby's Stage</h1>
          <p className="text-muted-foreground">
            Select your baby's developmental stage to see curated bundles
          </p>
        </div>

        <Tabs defaultValue="age" className="w-full">
          <TabsList className="grid w-full max-w-xs mx-auto grid-cols-2">
            <TabsTrigger value="age">By Age</TabsTrigger>
            <TabsTrigger value="weight">By Weight</TabsTrigger>
          </TabsList>

          <TabsContent value="age" className="mt-6">
            <div className="grid grid-cols-2 gap-4">
              {stagesByAge.map((stage) => (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  onClick={() => handleStageSelect(stage.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="weight" className="mt-6">
            <div className="grid grid-cols-2 gap-4">
              {stagesByWeight.map((stage) => (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  onClick={() => handleStageSelect(stage.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8 bg-gradient-to-b from-primary/5 to-transparent rounded-2xl">
        <span className="text-5xl">🍼</span>
        <h1 className="text-4xl font-bold text-foreground">
          Find the Perfect Bundle for Your Baby
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Curated essentials for every stage of development. Select your baby's age or weight to get started.
        </p>
      </div>

      <Tabs defaultValue="age" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid grid-cols-2 w-80">
            <TabsTrigger value="age" className="text-base">By Age</TabsTrigger>
            <TabsTrigger value="weight" className="text-base">By Weight</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="age" className="mt-0">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-6">
            {stagesByAge.map((stage) => (
              <StageCard
                key={stage.id}
                stage={stage}
                onClick={() => handleStageSelect(stage.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weight" className="mt-0">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-6">
            {stagesByWeight.map((stage) => (
              <StageCard
                key={stage.id}
                stage={stage}
                onClick={() => handleStageSelect(stage.id)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tip Banner */}
      <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-xl max-w-2xl mx-auto">
        <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Not sure which stage?</span>{" "}
          Start with your baby's age for the best recommendations.
        </p>
      </div>
    </div>
  );
}
