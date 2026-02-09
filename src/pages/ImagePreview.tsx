import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Current images
import heroLifestyle from "@/assets/hero-lifestyle.png";
import cardBundles from "@/assets/card-bundles-new.png";
import cardExplore from "@/assets/card-explore-new.png";
import cardGift from "@/assets/card-gift-new.png";

// New preview images
import heroLifestyleNew from "@/assets/hero-lifestyle-new.png";
import cardBundlesPreview from "@/assets/card-bundles-preview.png";
import cardExplorePreview from "@/assets/card-explore-preview.png";
import cardGiftPreview from "@/assets/card-gift-preview.png";

type ImageKey = "hero" | "bundles" | "explore" | "giftCards";

interface ImageState {
  current: string;
  preview: string;
  approved: boolean;
}

const imageData: Record<ImageKey, ImageState> = {
  hero: { current: heroLifestyle, preview: heroLifestyleNew, approved: false },
  bundles: { current: cardBundles, preview: cardBundlesPreview, approved: false },
  explore: { current: cardExplore, preview: cardExplorePreview, approved: false },
  giftCards: { current: cardGift, preview: cardGiftPreview, approved: false },
};

const imageLabels: Record<ImageKey, string> = {
  hero: "Hero Image",
  bundles: "Bundles Card",
  explore: "Explore Card",
  giftCards: "Gift Cards Card",
};

export default function ImagePreview() {
  const [images, setImages] = useState<Record<ImageKey, ImageState>>(imageData);

  const handleApprove = (key: ImageKey) => {
    setImages((prev) => ({
      ...prev,
      [key]: { ...prev[key], approved: true },
    }));
  };

  const handleUnapprove = (key: ImageKey) => {
    setImages((prev) => ({
      ...prev,
      [key]: { ...prev[key], approved: false },
    }));
  };

  const getApprovedImages = () => {
    return Object.entries(images)
      .filter(([, state]) => state.approved)
      .map(([key]) => key as ImageKey);
  };

  const approvedImages = getApprovedImages();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Image Preview</h1>
            <p className="text-muted-foreground">Compare current images with new AI-generated versions</p>
          </div>
        </div>

        {/* Approved Summary */}
        {approvedImages.length > 0 && (
          <Card className="mb-8 border-accent bg-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-accent">
                ✓ {approvedImages.length} image{approvedImages.length > 1 ? "s" : ""} approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once you've approved all desired images, let me know and I'll update the codebase to use them.
              </p>
              <div className="flex flex-wrap gap-2">
                {approvedImages.map((key) => (
                  <span key={key} className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm">
                    {imageLabels[key]}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Grid */}
        <div className="grid gap-8">
          {(Object.keys(images) as ImageKey[]).map((key) => {
            const state = images[key];
            return (
              <Card key={key} className={state.approved ? "ring-2 ring-accent" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{imageLabels[key]}</CardTitle>
                    {state.approved && (
                      <span className="flex items-center gap-1 text-accent text-sm font-medium">
                        <Check className="w-4 h-4" /> Approved
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Current Image */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Current</p>
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={state.current}
                          alt={`Current ${imageLabels[key]}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Preview Image */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">New Preview</p>
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={state.preview}
                          alt={`Preview ${imageLabels[key]}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-4 justify-end">
                    {!state.approved ? (
                      <Button onClick={() => handleApprove(key)}>
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={() => handleUnapprove(key)}>
                        Undo Approval
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
