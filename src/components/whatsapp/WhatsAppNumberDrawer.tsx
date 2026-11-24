import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type WhatsAppNumberInput } from "@/contexts/AuthContext";
import { useSubscribeEnabled } from "@/hooks/useSubscribeEnabled";
import { formatNigerianLocal } from "@/lib/whatsappNumber";
import { validateWhatsAppChoice } from "./WhatsAppNumberField";

/**
 * Asks every signed-in customer which number is on WhatsApp, once, from a bottom drawer.
 *
 * Her phone is never assumed to be on WhatsApp, so until she answers (or replies STOP) this
 * asks. Closing it without an answer puts it off for a week. It keeps out of the way of
 * anything to do with paying, and shows nothing at all unless the subscription experience
 * is on. Mount it once, inside the router and the auth provider.
 */

const SNOOZE_KEY = "nesta_whatsapp_prompt_snoozed_until";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_AFTER_MS = 1500;

/** Pages (and anything below them) where a drawer would get in the way of paying. */
const QUIET_PATHS = ["/checkout", "/orders", "/cart", "/auth/callback", "/gifting/checkout"];
/** The payment, edit, open and resume steps of a subscription (prefixes, not whole pages). */
const QUIET_PREFIXES = ["/subscriptions/pay", "/subscriptions/edit", "/subscriptions/open", "/subscriptions/resume"];

function isQuietPath(pathname: string): boolean {
  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  return QUIET_PATHS.some((p) => path === p || path.startsWith(`${p}/`)) || QUIET_PREFIXES.some((p) => path.startsWith(p));
}

function readSnoozedUntil(): number {
  try {
    const until = Number(localStorage.getItem(SNOOZE_KEY));
    return Number.isFinite(until) ? until : 0;
  } catch {
    return 0; // storage can throw (private windows, blocked site data)
  }
}

export function WhatsAppNumberPrompt() {
  const { user, loading, updateWhatsAppNumber } = useAuth();
  const flag = useSubscribeEnabled();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  // The flag reads false for a moment each time its minute-old answer is renewed. A drawer
  // she is already typing in must not vanish then.
  const enabled = flag || open;
  const [differentNumber, setDifferentNumber] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const answered = useRef(false);
  // Remembers a snooze for this visit when storage will not.
  const snoozedUntil = useRef(0);

  const phoneOnFile = formatNigerianLocal(user?.phone);
  const unanswered = !!user && !user.whatsappConfirmedAt && !user.whatsappOptedOutAt;
  const wanted = enabled && !loading && unanswered && !isQuietPath(pathname);

  useEffect(() => {
    if (!wanted) {
      setOpen(false);
      return;
    }
    const timer = setTimeout(() => {
      if (Date.now() < Math.max(snoozedUntil.current, readSnoozedUntil())) return;
      answered.current = false;
      setDifferentNumber(false);
      setTyped("");
      setError(null);
      setOpen(true);
    }, SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [wanted]);

  if (!enabled) return null;

  const snooze = () => {
    snoozedUntil.current = Date.now() + SNOOZE_MS;
    try {
      localStorage.setItem(SNOOZE_KEY, String(snoozedUntil.current));
    } catch {
      // The in-memory snooze still holds for this visit.
    }
  };

  // Tapping outside, swiping down or pressing Escape.
  const handleOpenChange = (next: boolean) => {
    if (next) return;
    if (!answered.current) snooze();
    setOpen(false);
  };

  const save = async (input: WhatsAppNumberInput) => {
    setSaving(true);
    setError(null);
    try {
      await updateWhatsAppNumber(input);
      answered.current = true;
      setOpen(false);
      toast.success("Thanks, we'll use WhatsApp for your updates.");
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "We couldn't save that. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveTyped = (e: FormEvent) => {
    e.preventDefault();
    const problem = validateWhatsAppChoice({ sameAsPhone: false, whatsappNumber: typed });
    if (problem) {
      setError(problem);
      return;
    }
    void save({ whatsappNumber: typed.trim() });
  };

  const asking = differentNumber || !phoneOnFile;

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-xl font-bold">Get your updates on WhatsApp</DrawerTitle>
          <DrawerDescription>
            {asking
              ? "Add your WhatsApp number. We'll use it to send your order and subscription updates."
              : `Is ${phoneOnFile} your WhatsApp number? We'll use it to send your order and subscription updates.`}
          </DrawerDescription>
        </DrawerHeader>
        {asking ? (
          <form onSubmit={saveTyped}>
            <div className="space-y-1.5 px-4">
              <Label htmlFor="whatsapp-prompt-number">WhatsApp number</Label>
              <Input
                id="whatsapp-prompt-number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                autoFocus={differentNumber}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="0801 234 5678"
                className="h-12"
                aria-invalid={error ? true : undefined}
              />
              {error && (
                <p role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
            <DrawerFooter className="pb-8">
              <Button type="submit" variant="shop" className="h-12 w-full" disabled={saving}>
                Save number
              </Button>
            </DrawerFooter>
          </form>
        ) : (
          <>
            {error && (
              <p role="alert" className="px-4 text-xs text-destructive">
                {error}
              </p>
            )}
            <DrawerFooter className="pb-8">
              <Button variant="shop" className="h-12 w-full" disabled={saving} onClick={() => void save({ useProfilePhone: true })}>
                Yes, that's my WhatsApp number
              </Button>
              <Button
                variant="outline"
                className="h-12 w-full"
                disabled={saving}
                onClick={() => {
                  setError(null);
                  setDifferentNumber(true);
                }}
              >
                Use a different number
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
