import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

// Color tokens matching the design system
const FILL = "hsl(30, 20%, 96%)"; // --background / cream
const STROKE = "hsl(28, 18%, 56%)"; // --primary / tan

export function DiapersIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-8 h-8", className)}
    >
      {/* Diaper body */}
      <path
        d="M12 20C12 18 14 16 18 16H46C50 16 52 18 52 20V24C52 24 50 28 48 32C46 36 46 44 46 48C46 50 44 52 42 52H22C20 52 18 50 18 48C18 44 18 36 16 32C14 28 12 24 12 24V20Z"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top fold */}
      <path
        d="M16 20C16 20 20 22 32 22C44 22 48 20 48 20"
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Left tab */}
      <circle cx="22" cy="28" r="3" fill={FILL} stroke={STROKE} strokeWidth="2" />
      {/* Right tab */}
      <circle cx="42" cy="28" r="3" fill={FILL} stroke={STROKE} strokeWidth="2" />
    </svg>
  );
}

export function WipesIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-8 h-8", className)}
    >
      {/* Container body */}
      <rect
        x="14"
        y="28"
        width="36"
        height="24"
        rx="4"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2.5"
      />
      {/* Lid */}
      <rect
        x="14"
        y="24"
        width="36"
        height="6"
        rx="2"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2.5"
      />
      {/* Tissue sticking out */}
      <path
        d="M28 24C28 24 26 18 28 14C30 10 32 8 34 10C36 12 38 16 36 20C34 24 36 24 36 24"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Label */}
      <rect
        x="22"
        y="36"
        width="20"
        height="10"
        rx="2"
        stroke={STROKE}
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

export function BodyLotionIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-8 h-8", className)}
    >
      {/* Bottle body */}
      <path
        d="M22 26V54C22 56 24 58 26 58H38C40 58 42 56 42 54V26"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Neck */}
      <rect
        x="26"
        y="18"
        width="12"
        height="8"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2.5"
      />
      {/* Pump head */}
      <rect
        x="28"
        y="12"
        width="8"
        height="6"
        rx="1"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2"
      />
      {/* Pump nozzle */}
      <path
        d="M36 14H44C46 14 46 16 44 16H40"
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Pump tube */}
      <line
        x1="32"
        y1="18"
        x2="32"
        y2="12"
        stroke={STROKE}
        strokeWidth="2"
      />
    </svg>
  );
}

export function BodyCreamIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-8 h-8", className)}
    >
      {/* Jar body */}
      <ellipse
        cx="32"
        cy="42"
        rx="18"
        ry="14"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2.5"
      />
      {/* Jar opening */}
      <ellipse
        cx="32"
        cy="30"
        rx="14"
        ry="6"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2.5"
      />
      {/* Lid */}
      <path
        d="M18 28C18 24 24 20 32 20C40 20 46 24 46 28"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Lid top */}
      <ellipse
        cx="32"
        cy="18"
        rx="10"
        ry="4"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2"
      />
    </svg>
  );
}

export function BabyWashIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-8 h-8", className)}
    >
      {/* Bottle body */}
      <path
        d="M20 24V54C20 56 22 58 24 58H40C42 58 44 56 44 54V24"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Neck */}
      <path
        d="M24 24V18C24 16 26 14 28 14H36C38 14 40 16 40 18V24"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2.5"
      />
      {/* Flip cap */}
      <path
        d="M28 14V10C28 8 30 6 32 6C34 6 36 8 36 10V14"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Bubbles */}
      <circle cx="28" cy="40" r="3" stroke={STROKE} strokeWidth="2" fill="none" />
      <circle cx="36" cy="46" r="2.5" stroke={STROKE} strokeWidth="1.5" fill="none" />
      <circle cx="32" cy="34" r="2" stroke={STROKE} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function BabyOilIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-8 h-8", className)}
    >
      {/* Bottle body - curved */}
      <path
        d="M24 28C20 32 18 40 18 48C18 54 22 58 28 58H36C42 58 46 54 46 48C46 40 44 32 40 28"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Neck */}
      <path
        d="M26 28V22C26 20 28 18 30 18H34C36 18 38 20 38 22V28"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2.5"
      />
      {/* Cap */}
      <rect
        x="28"
        y="12"
        width="8"
        height="6"
        rx="2"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="2"
      />
      {/* Droplet above */}
      <path
        d="M32 2C32 2 28 6 28 8C28 10 30 11 32 11C34 11 36 10 36 8C36 6 32 2 32 2Z"
        fill={FILL}
        stroke={STROKE}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Export a map for easy lookup by category ID
export const categoryIconMap: Record<string, React.FC<IconProps>> = {
  diapers: DiapersIcon,
  wipes: WipesIcon,
  "body-lotion": BodyLotionIcon,
  "body-cream": BodyCreamIcon,
  "baby-wash": BabyWashIcon,
  "baby-oil": BabyOilIcon,
};
