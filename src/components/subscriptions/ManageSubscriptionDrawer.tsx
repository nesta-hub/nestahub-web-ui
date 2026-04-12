import { ChevronRight, RefreshCw, CalendarDays, XCircle, Hash } from "lucide-react";
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
  onChangeFrequency: () => void;
  onMoveDate: () => void;
  onChangeQuantity: () => void;
  onCancel: () => void;
}

export function ManageSubscriptionDrawer({
  open,
  onOpenChange,
  subscription,
  onChangeFrequency,
  onMoveDate,
  onChangeQuantity,
  onCancel,
}: ManageSubscriptionDrawerProps) {
  if (!subscription) return null;

  const actions: ManageAction[] = [
    {
      key: "move",
      icon: CalendarDays,
      label: "Move next order date",
      description: "Push your next order to a later date",
    },
    {
      key: "frequency",
      icon: RefreshCw,
      label: "Change frequency",
      description: "Adjust how often you order this item",
    },
    {
      key: "quantity",
      icon: Hash,
      label: "Change quantity",
      description: "Update how many you receive each time",
    },
    {
      key: "cancel",
      icon: XCircle,
      label: "Cancel Item Subscription",
      description: "Take this product off your subscription",
      destructive: true,
    },
  ];

  const handleAction = (key: string) => {
    onOpenChange(false);
    setTimeout(() => {
      switch (key) {
        case "frequency": onChangeFrequency(); break;
        case "move": onMoveDate(); break;
        case "quantity": onChangeQuantity(); break;
        case "cancel": onCancel(); break;
      }
    }, 200);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Manage {subscription.brand} {subscription.productName}</DrawerTitle>
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
