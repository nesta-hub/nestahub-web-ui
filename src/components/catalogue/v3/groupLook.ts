import type { CSSProperties } from "react";
import { Baby, BookOpen, Heart, LayoutGrid, Milk, Shirt, SprayCan, Thermometer, Waves } from "lucide-react";
import { FootIcon, type IconComponent } from "./icons";
import babyCare from "@/assets/shop/groups/baby-care.webp";
import feeding from "@/assets/shop/groups/feeding.webp";
import healthWellness from "@/assets/shop/groups/health-wellness.webp";
import sanitary from "@/assets/shop/groups/sanitary-and-laundry.webp";
import nursery from "@/assets/shop/groups/nursery.webp";
import mumCare from "@/assets/shop/groups/mum-care.webp";
import backToSchool from "@/assets/shop/groups/back-to-school.webp";
import swimming from "@/assets/shop/groups/swimming-fits-for-toddlers.webp";
import clothing from "@/assets/shop/groups/clothing.webp";

/**
 * How a category group looks in the shop: its icon, short label, colours and photo. This is
 * presentation only, so it lives here keyed by the group's slug rather than in the database.
 * A group with no entry (a new one staff add) still renders, with the neutral look below.
 */
export interface GroupLook {
  /** The pill label when the group's full name is long ("Health", "Swimming"). */
  shortLabel?: string;
  icon: IconComponent;
  /** The feature panel's gradient, light to deeper. */
  panel: [string, string];
  /** A category tile's fill and its outline. */
  tile: { fill: string; border: string };
  photo?: string;
  /** Crop for the photo inside its circle. */
  photoCrop?: CSSProperties;
  /** Behind the photo, where it does not fill the circle. */
  photoBackground?: string;
}

const NEUTRAL: GroupLook = {
  icon: LayoutGrid,
  panel: ["#ECE7DE", "#DDD3C3"],
  tile: { fill: "#F6F4F0", border: "#EBE5DC" },
};

const PHOTO_BG = "#F8EFE7";

export const GROUP_LOOKS: Record<string, GroupLook> = {
  "baby-care": {
    icon: FootIcon,
    panel: ["#F2E8E0", "#E8D5C6"],
    tile: { fill: "#F9F4F1", border: "#F2E7DE" },
    photo: babyCare,
    photoCrop: { transform: "scale(1.08)", transformOrigin: "48% 40%" },
    photoBackground: PHOTO_BG,
  },
  feeding: {
    icon: Milk,
    panel: ["#E8EDE6", "#D5DFD1"],
    tile: { fill: "#F4F7F4", border: "#E7ECE4" },
    photo: feeding,
    photoCrop: { transform: "scale(1.05)", transformOrigin: "50% 45%" },
    photoBackground: PHOTO_BG,
  },
  "health-wellness": {
    shortLabel: "Health",
    icon: Thermometer,
    panel: ["#E7ECF2", "#D3DCE7"],
    tile: { fill: "#F4F6F9", border: "#E5EBF1" },
    photo: healthWellness,
    photoCrop: { transform: "scale(1.05)", transformOrigin: "50% 45%" },
    photoBackground: PHOTO_BG,
  },
  "sanitary-and-laundry": {
    shortLabel: "Sanitary",
    icon: SprayCan,
    panel: ["#ECE7DE", "#DDD3C3"],
    tile: { fill: "#F6F4F0", border: "#EBE5DC" },
    photo: sanitary,
    photoCrop: { transform: "scale(1.05)", transformOrigin: "52% 45%" },
    photoBackground: PHOTO_BG,
  },
  nursery: {
    icon: Baby,
    panel: ["#F1E6E4", "#E6D2CD"],
    tile: { fill: "#F9F4F2", border: "#F0E5E2" },
    photo: nursery,
    photoCrop: { transform: "scale(1.04)", transformOrigin: "56% 50%" },
    photoBackground: PHOTO_BG,
  },
  "mum-care": {
    icon: Heart,
    panel: ["#F4E5DB", "#EBCFBE"],
    tile: { fill: "#FAF3EF", border: "#F3E3D9" },
    photo: mumCare,
    photoCrop: { transform: "translateY(7%)" },
    photoBackground: "#E5D6CB",
  },
  "back-to-school": {
    shortLabel: "Learning",
    icon: BookOpen,
    panel: ["#F3ECD8", "#E9DDB9"],
    tile: { fill: "#FAF6EE", border: "#F2EBD6" },
    photo: backToSchool,
    photoCrop: { transform: "scale(1.05)", transformOrigin: "52% 42%" },
    photoBackground: PHOTO_BG,
  },
  "swimming-fits-for-toddlers": {
    shortLabel: "Swimming",
    icon: Waves,
    panel: ["#E2EBEA", "#CBDBD9"],
    tile: { fill: "#F2F6F6", border: "#E1EAE9" },
    photo: swimming,
    photoCrop: { transform: "scale(1.05)", transformOrigin: "52% 42%" },
    photoBackground: PHOTO_BG,
  },
  clothing: {
    icon: Shirt,
    panel: ["#E8EDEA", "#D6DFD9"],
    tile: { fill: "#F5F7F6", border: "#E7ECE9" },
    photo: clothing,
    photoCrop: { transform: "scale(1.05)", transformOrigin: "52% 45%" },
    photoBackground: PHOTO_BG,
  },
};

export interface ResolvedGroupLook extends GroupLook {
  slug: string;
  /** The group's name, trimmed (some are saved with trailing spaces). */
  title: string;
  /** What a pill says: the short label, else the title. */
  label: string;
}

/** A group's look, with its trimmed name and label. Unknown groups get the neutral look. */
export function lookFor(group: { slug: string; name: string }): ResolvedGroupLook {
  const known = GROUP_LOOKS[group.slug];
  const look = known ?? NEUTRAL;
  const title = group.name.trim();
  return { ...look, slug: group.slug, title, label: look.shortLabel ?? title };
}
