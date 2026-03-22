import { ChevronRight, Package, RefreshCw, CalendarDays, SkipForward, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import type { MockSubscription } from "@/components/account/mockAccountData";

interface ManageAction {
  key: string;
  icon: React.ElementType;
  label: string;
  description: string;
  destructive?: boolean;
  disabled?: boolean;
}

interface ManageSubscriptionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: MockSubscription | null;
  onChangeProduct: () => void;
  onChangeFrequency: () => void;
  onMoveDate: () => void;
  onSkipCycle: () => void;
  onCancel: () => void;
}

export function ManageSubscriptionDrawer({
  open,
  onOpenChange,
  subscription,
  onChangeProduct,
  onChangeFrequency,
  onMoveDate,
  onSkipCycle,
  onCancel,
}: ManageSubscriptionDrawerProps) {
  if (!subscription) return null;

  const actions: ManageAction[] = [
    {
      key: "product",
      icon: Package,
      label: "Change product",
      description: "Switch to a different product size or quantity",
    },
    {
      key: "frequency",
      icon: RefreshCw,
      label: "Change frequency",
      description: "Adjust how often you receive orders",
    },
    {
      key: "move",
      icon: CalendarDays,
      label: "Move order date",
      description: subscription.lastMoved
        ? "Already moved — resets after next order"
        : "Push your next order to a later date",
      disabled: subscription.lastMoved,
    },
    {
      key: "skip",
      icon: SkipForward,
      label: "Skip this order",
      description: subscription.lastSkipped
        ? "Already skipped — resume after next order"
        : "Skip this order, resume next cycle",
      disabled: subscription.lastSkipped,
    },
    {
      key: "cancel",
      icon: XCircle,
      label: "Cancel subscription",
      description: "End your subscription",
      destructive: true,
    },
  ];

  const handleAction = (key: string) => {
    onOpenChange(false);
    setTimeout(() => {
      switch (key) {
        case "product": onChangeProduct(); break;
        case "frequency": onChangeFrequency(); break;
        case "move": onMoveDate(); break;
        case "skip": onSkipCycle(); break;
        case "cancel": onCancel(); break;
      }
    }, 200);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Manage Subscription</DrawerTitle>
          <DrawerDescription>
            {subscription.brand} {subscription.productName}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6">
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.key}
                  onClick={() => handleAction(action.key)}
                  disabled={action.disabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    action.disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-muted/50 active:bg-muted",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      action.destructive ? "text-destructive" : "text-muted-foreground",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        action.destructive ? "text-destructive" : "text-foreground",
                      )}
                    >
                      {action.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
