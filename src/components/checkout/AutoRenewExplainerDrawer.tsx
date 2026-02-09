import { RefreshCw, Wallet, SkipForward, MessageCircle } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

const features = [
  {
    icon: RefreshCw,
    title: "Automatic Deliveries",
    description: "We deliver on your schedule",
  },
  {
    icon: Wallet,
    title: "5% Savings",
    description: "Save on every renewal order",
  },
  {
    icon: SkipForward,
    title: "Skip or Cancel",
    description: "Pause anytime via WhatsApp",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Management",
    description: "Manage everything easily",
  },
];

interface AutoRenewExplainerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutoRenewExplainerDrawer({
  open,
  onOpenChange,
}: AutoRenewExplainerDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle>How Auto-Renew Works</DrawerTitle>
          <DrawerDescription>Never run out again</DrawerDescription>
        </DrawerHeader>

        <div className="px-6 pb-8 space-y-4">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{feature.title}</p>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
