import { useState, type ReactNode } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowRight, Check, Copy, Mail, PartyPopper } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { registerReferrer } from "@/hooks/useReferralAccount";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupDrawer({ open, onOpenChange }: Props) {
  const isMobile = useIsMobile();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const valid =
    name.trim().length > 1 &&
    phone.trim().length >= 10 &&
    emailRegex.test(email.trim());

  const reset = () => {
    setName(""); setPhone(""); setEmail(""); setSource("");
    setCode(null); setCopied(false); setSubmitting(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const result = await registerReferrer({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        source: source.trim() || undefined,
      });
      setCode(result.referralCode);
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const referralUrl = code ? `nestahub.ng?ref=${code}` : "";

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const copyLink = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(`https://${referralUrl}`);
      setLinkCopied(true);
      toast.success("Link copied");
      setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const fields: ReactNode = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Your name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ama" className="text-base" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Email address</label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" inputMode="email" autoComplete="email" className="text-base" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">WhatsApp number</label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0801 234 5678" inputMode="tel" className="text-base" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">How did you hear about us? <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Instagram, a friend..." className="text-base" />
      </div>
    </div>
  );

  const submitBtn = (
    <Button
      onClick={submit}
      disabled={!valid || submitting}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      {submitting ? "Sending..." : "Get my code"}
      <ArrowRight className="w-4 h-4" />
    </Button>
  );

  const successView: ReactNode = (
    <div className="space-y-5 text-center px-1">
      <div className="mx-auto w-14 h-14 rounded-full bg-nesta-sage/15 text-nesta-sage flex items-center justify-center">
        <PartyPopper className="w-7 h-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-foreground">You're in!</h3>
        <p className="text-sm text-muted-foreground">Here's your personal referral code and link.</p>
      </div>

      <div className="mx-auto max-w-xs space-y-3">
        <div className="relative rounded-md border border-dashed border-nesta-brown/40 bg-nesta-cream px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Your code</p>
          <p className="font-display text-2xl font-bold text-nesta-brown tracking-wider mt-1">{code}</p>
          <Button variant="outline" size="sm" onClick={copy} className="mt-3 gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy code"}
          </Button>
        </div>

        <div className="relative rounded-md border border-dashed border-nesta-sage/50 bg-nesta-sage/5 px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Your link</p>
          <p className="font-mono text-sm font-medium text-nesta-sage break-all mt-1">{referralUrl}</p>
          <Button variant="outline" size="sm" onClick={copyLink} className="mt-3 gap-2">
            {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {linkCopied ? "Copied" : "Copy link"}
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 justify-center text-sm text-muted-foreground bg-muted/40 rounded-lg p-3 text-left">
        <Mail className="w-4 h-4 mt-0.5 shrink-0 text-nesta-sage" />
        <p>
          We've sent your code to <span className="font-medium text-foreground">{email}</span>. Check your inbox (and spam) for the details.
        </p>
      </div>
    </div>
  );

  const doneBtn = (
    <Button onClick={() => handleClose(false)} className="bg-primary text-primary-foreground hover:bg-primary/90">
      Done
    </Button>
  );

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          {!code ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Join the programme</DialogTitle>
                <DialogDescription>Takes under a minute. We'll send your code by email and WhatsApp.</DialogDescription>
              </DialogHeader>
              {fields}
              <DialogFooter>{submitBtn}</DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>Registration successful</DialogTitle>
                <DialogDescription>Your referral code is ready.</DialogDescription>
              </DialogHeader>
              {successView}
              <DialogFooter>{doneBtn}</DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleClose} repositionInputs={false}>
      <DrawerContent className="max-h-[92vh]">
        <div className="mx-auto w-full max-w-lg">
          {!code ? (
            <>
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-xl">Join the programme</DrawerTitle>
                <DrawerDescription>Takes under a minute. We'll send your code by email and WhatsApp.</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4">{fields}</div>
              <DrawerFooter>{submitBtn}</DrawerFooter>
            </>
          ) : (
            <>
              <DrawerHeader className="sr-only">
                <DrawerTitle>Registration successful</DrawerTitle>
                <DrawerDescription>Your referral code is ready.</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pt-2 pb-4">{successView}</div>
              <DrawerFooter>{doneBtn}</DrawerFooter>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
