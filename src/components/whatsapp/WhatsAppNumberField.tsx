import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubscribeEnabled } from "@/hooks/useSubscribeEnabled";
import type { WhatsAppNumberInput } from "@/contexts/AuthContext";
import { looksLikeNigerianMobile } from "@/lib/whatsappNumber";

/**
 * "This is my WhatsApp number", for wherever a phone number is asked.
 *
 * Ticked, it means the phone typed just above; unticked, she types another number. Her
 * phone is never assumed to be on WhatsApp: this tick is how we find out. Nothing shows
 * unless the subscription experience is on.
 */

export interface WhatsAppChoice {
  sameAsPhone: boolean;
  whatsappNumber: string;
}

export const DEFAULT_WHATSAPP_CHOICE: WhatsAppChoice = { sameAsPhone: true, whatsappNumber: "" };

const NOT_A_MOBILE = "Enter a Nigerian mobile number, like 0801 234 5678";

/** What to tell the server, or null when there is nothing worth sending. */
export function resolveWhatsAppChoice(choice: WhatsAppChoice, phone: string): WhatsAppNumberInput | null {
  if (choice.sameAsPhone) return looksLikeNigerianMobile(phone) ? { useProfilePhone: true } : null;
  const typed = choice.whatsappNumber.trim();
  return looksLikeNigerianMobile(typed) ? { whatsappNumber: typed } : null;
}

/**
 * What is wrong with the choice, in words for her, or null. Ticked is never a problem: her
 * phone is checked where it is typed, and one that is not a mobile is simply not sent.
 */
export function validateWhatsAppChoice(choice: WhatsAppChoice): string | null {
  if (choice.sameAsPhone) return null;
  return looksLikeNigerianMobile(choice.whatsappNumber) ? null : NOT_A_MOBILE;
}

interface WhatsAppNumberFieldProps {
  /** The phone typed in the field above. */
  phone: string;
  value: WhatsAppChoice;
  onChange: (value: WhatsAppChoice) => void;
  error?: string | null;
  className?: string;
}

export function WhatsAppNumberField({ phone, value, onChange, error, className }: WhatsAppNumberFieldProps) {
  const enabled = useSubscribeEnabled();
  const id = useId();
  if (!enabled) return null;

  // 10 digits is where a phone is complete enough to judge.
  const phoneNotMobile = value.sameAsPhone && phone.replace(/\D/g, "").length >= 10 && !looksLikeNigerianMobile(phone);

  return (
    <div className={className}>
      <div className="flex items-center gap-3 px-1">
        <Checkbox
          id={`${id}-same`}
          checked={value.sameAsPhone}
          onCheckedChange={(checked) => onChange({ ...value, sameAsPhone: checked === true })}
          className="h-5 w-5 rounded-md"
        />
        <Label htmlFor={`${id}-same`} className="text-sm font-normal leading-snug text-foreground">
          This is my WhatsApp number
        </Label>
      </div>
      {phoneNotMobile && (
        <p className="mt-1.5 px-1 text-xs text-muted-foreground">
          That doesn't look like a Nigerian mobile number. Untick this to add your WhatsApp number.
        </p>
      )}
      {!value.sameAsPhone && (
        <div className="mt-3 space-y-1.5">
          <Label htmlFor={`${id}-number`} className="px-1">
            WhatsApp number
          </Label>
          <Input
            id={`${id}-number`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={value.whatsappNumber}
            onChange={(e) => onChange({ ...value, whatsappNumber: e.target.value })}
            placeholder="0801 234 5678"
            className="h-12"
            aria-invalid={error ? true : undefined}
          />
          {error && (
            <p role="alert" className="px-1 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
