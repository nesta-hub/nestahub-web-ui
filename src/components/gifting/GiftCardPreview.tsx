import { cn } from "@/lib/utils";
import { GiftCardTheme } from "./GiftCardThemes";
import nestaLogo from "@/assets/nesta-logo.png";
import { formatPrice } from "@/lib/api";

interface GiftCardPreviewProps {
  theme: GiftCardTheme | null;
  recipientName: string;
  compact?: boolean;
  /** Amount in kobo (minor units); when set, renders on the card bottom-right. */
  amount?: number;
}

export function GiftCardPreview({ theme, recipientName, compact = false, amount }: GiftCardPreviewProps) {
  const displayName = recipientName.trim() || "Recipient";
  const hasName = recipientName.trim().length > 0;
  const hasAmount = typeof amount === "number" && amount > 0;

  const gradient = theme?.gradient ?? "from-secondary/60 to-secondary/30";
  const emoji = theme?.emoji ?? "🎁";
  const textColor = theme?.textColor ?? "text-foreground";
  const themeName = theme?.name ?? "Select a Theme";

  return (
    <div
      className={cn(
        "relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-card",
        "bg-gradient-to-br",
        gradient,
        "transition-all duration-500 ease-out"
      )}
    >
      {/* Decorative emoji */}
      <span className={cn("absolute top-4 right-5 opacity-30 select-none", compact ? "text-2xl" : "text-4xl")}>
        {emoji}
      </span>
      {!hasAmount && (
        <span className={cn("absolute bottom-4 right-5 opacity-20 select-none", compact ? "text-xl" : "text-3xl")}>
          {emoji}
        </span>
      )}

      {/* Nesta logo */}
      <div className="absolute top-4 left-5">
        <img src={nestaLogo} alt="Nesta Hub" className={cn("opacity-90", compact ? "h-5" : "h-8")} />
      </div>

      {/* Gift Card label */}
      <div className="absolute top-4 right-5">
        <span className={cn("text-[10px] font-semibold tracking-wider uppercase opacity-50", textColor)}>
          Gift Card
        </span>
      </div>

      {/* Theme name centered */}
      <div className="absolute inset-0 flex items-center justify-center px-8">
        <h2
          className={cn(
            "font-bold text-center leading-tight transition-opacity duration-300",
            compact ? "text-sm" : "text-xl",
            textColor,
            theme ? "opacity-90" : "opacity-30"
          )}
        >
          {themeName}
        </h2>
      </div>

      {/* Recipient name bottom-left */}
      <div className="absolute bottom-4 left-5">
        <p
          className={cn(
            "font-medium transition-opacity duration-300",
            compact ? "text-[10px]" : "text-xs",
            textColor,
            hasName ? "opacity-70" : "opacity-30"
          )}
        >
          For {displayName}
        </p>
      </div>

      {/* Amount bottom-right (kobo → naira) */}
      {hasAmount && (
        <div className="absolute bottom-4 right-5">
          <p
            className={cn(
              "font-semibold opacity-80 tabular-nums",
              compact ? "text-xs" : "text-sm",
              textColor
            )}
          >
            {formatPrice(amount!)}
          </p>
        </div>
      )}
    </div>
  );
}
