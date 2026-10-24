import type { ComponentType } from "react";

export type IconComponent = ComponentType<{ className?: string; strokeWidth?: number | string }>;

/** The Body Care icon from the design: a small foot. Lucide has no matching one. */
export const FootIcon: IconComponent = ({ className, strokeWidth = 1.7 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="2.5" y="11" width="13" height="8" rx="3" transform="rotate(-12 9 15)" />
    <circle cx="17.5" cy="6.5" r="2.6" />
    <circle cx="11.5" cy="5.6" r="1.4" />
    <circle cx="20.6" cy="12.4" r="1.4" />
  </svg>
);
