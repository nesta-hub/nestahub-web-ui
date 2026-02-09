import { Package, ShoppingBag, Gift, LucideIcon } from "lucide-react";

export interface ShopDrawerOption {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export const shopDrawerOptions: ShopDrawerOption[] = [
  {
    href: "/bundles",
    icon: Package,
    title: "Curated Bundles",
    description: "Expert-picked essentials",
  },
  {
    href: "/explore",
    icon: ShoppingBag,
    title: "Explore Products",
    description: "Build your own bundle",
  },
  {
    href: "/gift-cards",
    icon: Gift,
    title: "Gift Cards",
    description: "Give the gift of care",
  },
];
