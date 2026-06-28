import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { giftCategoryMeta } from "@/data/giftCatalogue";
import { useGiftBundle, usePackagingOptions } from "@/hooks/useGifting";
import { BundleDetailView } from "@/components/gifting/bundles/BundleDetailView";
import { PackagingStep } from "@/components/gifting/bundles/PackagingStep";
import { BundleSummaryDrawer } from "@/components/gifting/bundles/BundleSummaryDrawer";
import { DesktopGiftBundleDetail } from "@/components/gifting/desktop/DesktopGiftBundleDetail";
import { useAuth } from "@/contexts/AuthContext";
import { SignInForm } from "@/components/auth/SignInForm";
import { CheckoutPaymentView } from "@/components/checkout/CheckoutPaymentView";

type Step = "details" | "packaging" | "recipient";

const GiftBundleDetail = () => {
  const { packageId = "" } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { session } = useAuth();

  const { data: bundle, isLoading } = useGiftBundle(packageId);
  const { data: packagingOptions = [] } = usePackagingOptions();

  const pkg = bundle?.pkg;

  const [step, setStep] = useState<Step>("details");
  const [packagingId, setPackagingId] = useState<string>("");
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Recipient details (held in state; mapped to the supported giftRecipient* DTO fields).
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [giftMessage, setGiftMessage] = useState("");

  const [showSignIn, setShowSignIn] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [serverTotal, setServerTotal] = useState(0);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [createOrderError, setCreateOrderError] = useState<string | null>(null);

  // Default the packaging selection once options load.
  useEffect(() => {
    if (!packagingId && packagingOptions.length > 0) {
      setPackagingId(packagingOptions[0].id);
    }
  }, [packagingId, packagingOptions]);

  // Persist the bundle selection so navigating back from checkout (or returning
  // later) restores the chosen packaging + step instead of resetting.
  const SELECTION_KEY = `gift_bundle_selection_${packageId}`;

  useEffect(() => {
    const saved = localStorage.getItem(SELECTION_KEY);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      if (data.packagingId) setPackagingId(data.packagingId);
      if (data.step === "packaging" || data.step === "details") setStep(data.step);
    } catch {
      localStorage.removeItem(SELECTION_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SELECTION_KEY]);

  useEffect(() => {
    if (!packagingId) return;
    localStorage.setItem(SELECTION_KEY, JSON.stringify({ packagingId, step }));
  }, [SELECTION_KEY, packagingId, step]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [step]);

  if (!isMobile) {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (!pkg) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 text-center">
          <div>
            <p className="text-foreground font-semibold">Bundle not found.</p>
            <button
              onClick={() => navigate("/gifting/bundles")}
              className="mt-3 text-sm text-primary font-medium"
            >
              Back to Gift Bundles
            </button>
          </div>
        </div>
      );
    }
    return (
      <DesktopGiftBundleDetail
        pkg={pkg}
        packagingOptions={packagingOptions}
        bundleId={bundle!.bundleId}
      />
    );
  }

  if (isLoading) {
    return (
      <Layout showNav={false}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!pkg) {
    return (
      <Layout showNav={false}>
        <div className="min-h-screen flex items-center justify-center px-6 text-center">
          <div>
            <p className="text-foreground font-semibold">Bundle not found.</p>
            <button
              onClick={() => navigate("/gifting/bundles")}
              className="mt-3 text-sm text-primary font-medium"
            >
              Back to Gift Bundles
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const selectedPackaging =
    packagingOptions.find((p) => p.id === packagingId) ?? packagingOptions[0] ?? null;

  const recipientValid =
    fullName.trim().length > 0 &&
    phoneNumber.replace(/\D/g, "").length === 11;

  // Summary-drawer "Proceed": hand off to the shared checkout, which collects
  // delivery + contact and places the order (auth handled there too).
  const handleProceed = () => {
    if (!bundle) return;
    setSummaryOpen(false);
    const params = new URLSearchParams({ source: "gift-bundle", bundleId: bundle.bundleId });
    if (packagingId) params.set("packagingId", packagingId);
    navigate(`/checkout?${params.toString()}`);
  };

  // Sign-in view
  if (showSignIn) {
    return (
      <Layout showNav={false}>
        <div className="min-h-screen flex flex-col">
          <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
            <button type="button" onClick={() => setShowSignIn(false)}>
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-semibold text-lg">Sign In</h1>
          </div>
          <SignInForm containerClassName="px-6 pt-4" />
        </div>
      </Layout>
    );
  }

  // Payment view
  if (showPayment) {
    return (
      <CheckoutPaymentView
        orderId={orderId}
        totalAmount={serverTotal}
        token={session?.access_token || ""}
        onPaymentConfirmed={() => {
          setShowPayment(false);
          setShowSuccess(true);
        }}
        onBack={() => setShowPayment(false)}
      />
    );
  }

  // Success view
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Order Received!</h1>
          <p className="text-muted-foreground mb-6">
            Order ID: <span className="font-semibold text-foreground">{orderId}</span>
          </p>
          <Card className="p-4 bg-muted/50 max-w-sm">
            <p className="text-sm text-muted-foreground">
              We've received your gift order. Once your payment is confirmed, we'll begin
              hand-assembling {pkg.name}.
            </p>
          </Card>
        </div>
        <div className="p-4 border-t bg-background shrink-0 space-y-2">
          <Button
            variant="outline"
            className="w-full h-12 text-base font-semibold"
            onClick={() => navigate("/orders")}
          >
            View Order Status
          </Button>
          <Button
            variant="shop"
            className="w-full h-12 text-base font-semibold"
            onClick={() => navigate("/gifting")}
          >
            Back to Gifting
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Layout showNav={false}>
      {step === "details" && (
        <BundleDetailView
          pkg={pkg}
          onBack={() => navigate("/gifting/bundles")}
          onContinue={() => setStep("packaging")}
        />
      )}
      {step === "packaging" && (
        <PackagingStep
          pkg={pkg}
          options={packagingOptions}
          selectedId={packagingId}
          onSelect={setPackagingId}
          onBack={() => setStep("details")}
          onContinue={() => setSummaryOpen(true)}
        />
      )}
      {step === "recipient" && (
        <div className="min-h-screen pb-28 animate-fade-in">
          <div className="px-4 pt-4 pb-2 flex items-center gap-3">
            <button
              onClick={() => setStep("packaging")}
              aria-label="Back"
              className="w-10 h-10 rounded-full bg-card/90 backdrop-blur flex items-center justify-center shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
                Your Details
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Who's sending, and who it's for
              </p>
            </div>
          </div>

          <div className="px-4 mt-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Your details</h3>
            <Input
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              type="tel"
              placeholder="Your phone (11 digits)"
              value={phoneNumber}
              onChange={(e) =>
                setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              maxLength={11}
            />
          </div>

          <div className="px-4 mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Recipient (optional)
            </h3>
            <Input
              placeholder="Recipient's name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
            <Input
              type="tel"
              placeholder="Recipient's phone"
              value={recipientPhone}
              onChange={(e) =>
                setRecipientPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              maxLength={11}
            />
            <Input
              placeholder="Gift message (optional)"
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value.slice(0, 150))}
              maxLength={150}
            />
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-30">
            <Button
              variant="shop"
              className="w-full h-12 text-base font-semibold rounded-full"
              disabled={!recipientValid}
              onClick={() => setSummaryOpen(true)}
            >
              Review gift · {giftCategoryMeta[pkg.category].label}
            </Button>
          </div>
        </div>
      )}

      <BundleSummaryDrawer
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        pkg={pkg}
        packaging={selectedPackaging}
        onProceed={handleProceed}
        isSubmitting={isCreatingOrder}
        error={createOrderError}
      />
    </Layout>
  );
};

export default GiftBundleDetail;
