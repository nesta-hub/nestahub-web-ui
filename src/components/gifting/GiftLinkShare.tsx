import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface GiftLinkShareProps {
  /** The recipient-facing gift card URL. */
  link: string;
  /** Personalises the prefilled message. */
  recipientName?: string;
  /** Compact variant for dense lists (order history). */
  size?: "sm" | "default";
  className?: string;
}

/**
 * Copy and share actions for one gift card link.
 *
 * Two buttons, matching the Lovable `GiftLinksBlock` design: a filled "Copy
 * link" and an outlined "Share", equal width.
 *
 * The Share button prefers the native share sheet, which on mobile already
 * lists WhatsApp and SMS — satisfying §6b without inventing bespoke buttons.
 * Desktop Chrome and Firefox have no sheet, so rather than silently copying
 * (which is what the design's fallback does, and reads as a broken button) it
 * opens a small menu with the same destinations.
 *
 * No contact picker is needed anywhere here: `wa.me` with no number opens
 * WhatsApp's own chooser, which already has the address book.
 */
export function GiftLinkShare({
  link,
  recipientName,
  size = "default",
  className,
}: GiftLinkShareProps) {
  const [copied, setCopied] = useState(false);

  const message = recipientName
    ? `Hi ${recipientName}, I sent you a Nesta Hub gift card! Open it here: ${link}`
    : `I sent you a Nesta Hub gift card! Open it here: ${link}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked outside a secure context. The link is rendered in
      // full next to this control, so it stays selectable by hand.
    }
  };

  const shareWhatsApp = () =>
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );

  const shareSms = () => {
    // `?&body=` is the form both iOS and Android accept.
    window.location.href = `sms:?&body=${encodeURIComponent(message)}`;
  };

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  const shareNative = async () => {
    try {
      await navigator.share({ title: "Your gift card", text: message, url: link });
    } catch {
      // Dismissed. Not an error.
    }
  };

  const h = size === "sm" ? "h-9 text-xs" : "h-11";
  const icon = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className={cn("flex gap-3", className)}>
      <Button variant="default" className={cn("flex-1", h)} onClick={copyLink}>
        {copied ? (
          <Check className={cn(icon, "mr-2")} />
        ) : (
          <Copy className={cn(icon, "mr-2")} />
        )}
        {copied ? "Copied" : "Copy link"}
      </Button>

      {canNativeShare ? (
        <Button variant="outline" className={cn("flex-1", h)} onClick={shareNative}>
          <Share2 className={cn(icon, "mr-2")} />
          Share
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className={cn("flex-1", h)}>
              <Share2 className={cn(icon, "mr-2")} />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={shareWhatsApp}>
              Send on WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareSms}>Send by SMS</DropdownMenuItem>
            <DropdownMenuItem onClick={copyLink}>Copy link</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
