import { CheckCircle, Clock, Mail, MessageCircle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuccessStep {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

interface DesktopCheckoutSuccessViewProps {
  orderId: string;
  title?: string;
  message: string;
  onViewOrder: () => void;
  onReturnToShop: () => void;
  steps?: SuccessStep[];
}

const CARD_CLASS =
  "rounded-[20px] bg-white ring-1 ring-foreground/[0.06] shadow-[0_1px_0_hsl(28_25%_25%/0.04),0_12px_28px_-18px_hsl(28_25%_25%/0.35)]";

const defaultSteps: SuccessStep[] = [
  { icon: Clock, label: "Payment verifying", active: true },
  { icon: Mail, label: "Link sent to your email", active: false },
  { icon: MessageCircle, label: "You share with the recipient", active: false },
];

export function DesktopCheckoutSuccessView({
  orderId,
  title = "Order received",
  message,
  onViewOrder,
  onReturnToShop,
  steps = defaultSteps,
}: DesktopCheckoutSuccessViewProps) {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Top strip — no back action */}
      <div className="border-b border-foreground/[0.06] bg-background/70 backdrop-blur-xl sticky top-0 z-30">
        <div className="container relative flex items-center h-16">
          <h1 className="absolute left-1/2 -translate-x-1/2 font-display text-base font-bold text-foreground tracking-[-0.01em]">
            {title}
          </h1>
        </div>
      </div>

      <div className="relative bg-[radial-gradient(1200px_600px_at_20%_-10%,hsl(28,32%,90%/0.6),transparent_60%)]">
        <div className="container py-16">
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>

            <h2 className="font-display text-4xl font-bold text-foreground tracking-[-0.02em] mb-3">
              Order Received!
            </h2>
            <p className="text-sm text-muted-foreground mb-10">
              Order ID:{" "}
              <span className="font-semibold text-foreground">{orderId}</span>
            </p>

            <div className={cn(CARD_CLASS, "p-7 text-left")}>
              <span className="block uppercase tracking-[0.18em] text-[10px] text-muted-foreground mb-5">
                What happens next
              </span>

              {/* Horizontal stepper on md+, vertical below */}
              <div className="hidden md:grid grid-cols-3 gap-4 relative">
                <div className="absolute left-[16%] right-[16%] top-5 h-px bg-foreground/[0.08]" />
                {steps.map((s, i) => (
                  <div key={i} className="relative flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center bg-background ring-1",
                        s.active
                          ? "bg-amber-100 ring-amber-200"
                          : "bg-secondary ring-foreground/[0.06]"
                      )}
                    >
                      <s.icon
                        className={cn(
                          "w-4 h-4",
                          s.active ? "text-amber-600" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <p
                      className={cn(
                        "mt-3 text-xs leading-snug max-w-[14ch]",
                        s.active ? "font-semibold text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="md:hidden space-y-4">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                        s.active ? "bg-amber-100" : "bg-secondary"
                      )}
                    >
                      <s.icon
                        className={cn(
                          "w-4 h-4",
                          s.active ? "text-amber-600" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        s.active ? "font-semibold text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-foreground/[0.06] my-6" />

              <div className="rounded-xl bg-[hsl(28,25%,97%)] ring-1 ring-foreground/[0.05] px-4 py-3">
                <p className="text-sm text-foreground/80 leading-relaxed">{message}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center mt-8">
              <Button variant="outline" className="h-11 px-6" onClick={onViewOrder}>
                View Order Status
              </Button>
              <Button variant="shop" className="h-11 px-6" onClick={onReturnToShop}>
                Return to Shop
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
