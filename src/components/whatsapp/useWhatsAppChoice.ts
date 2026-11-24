import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscribeEnabled } from "@/hooks/useSubscribeEnabled";
import {
  DEFAULT_WHATSAPP_CHOICE,
  resolveWhatsAppChoice,
  validateWhatsAppChoice,
  type WhatsAppChoice,
} from "./WhatsAppNumberField";

/**
 * The tick box's state for one phone form.
 *
 * `active` is false (and the form is exactly today's) unless the subscription experience is
 * on and she has not answered yet. A customer who has confirmed a number, or replied STOP,
 * is not asked again here: saving the form must not quietly turn messages back on.
 */
export function useWhatsAppChoice() {
  const { user } = useAuth();
  const enabled = useSubscribeEnabled();
  const [choice, setChoice] = useState<WhatsAppChoice>(DEFAULT_WHATSAPP_CHOICE);
  const active = enabled && !user?.whatsappConfirmedAt && !user?.whatsappOptedOutAt;
  const problem = active ? validateWhatsAppChoice(choice) : null;
  return {
    active,
    choice,
    setChoice,
    /** What is wrong with the choice; null while she has not typed anything to be wrong about. */
    error: choice.whatsappNumber.trim() ? problem : null,
    /** Her choice cannot be saved yet (unticked, with no good number). */
    blocked: problem !== null,
    /** The choice to save along with the phone, or null when the tick box was not shown. */
    toSave: active ? choice : null,
  };
}

/**
 * Save her WhatsApp choice once her phone is saved. It never throws: a failure here shows a
 * message and lets the form carry on, because her phone is already saved.
 */
export function useConfirmWhatsApp() {
  const { updateWhatsAppNumber } = useAuth();
  return useCallback(
    async (choice: WhatsAppChoice | null, phone: string) => {
      if (!choice) return;
      const input = resolveWhatsAppChoice(choice, phone);
      if (!input) return;
      try {
        await updateWhatsAppNumber(input);
      } catch (error) {
        toast.error(error instanceof Error && error.message ? error.message : "We couldn't save your WhatsApp number.");
      }
    },
    [updateWhatsAppNumber],
  );
}
