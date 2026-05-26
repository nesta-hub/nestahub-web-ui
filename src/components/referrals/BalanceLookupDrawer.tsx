import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function BalanceLookupDrawer({ open, onOpenChange }: Props) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);

  const reset = () => { setCode(""); setValidating(false); };
  const handleOpenChange = (v: boolean) => { onOpenChange(v); if (!v) reset(); };

  const submit = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setValidating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/referrals/lookup/${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        toast.error("Referral code not found. Please check and try again.");
        return;
      }
      onOpenChange(false);
      setTimeout(() => {
        navigate(`/referrals/activity?code=${encodeURIComponent(trimmed)}`);
        setCode("");
      }, 50);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setValidating(false);
    }
  };

  const body: ReactNode = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Referral code</label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="e.g. NESTA-AMA"
          className="text-base"
        />
      </div>
    </div>
  );

  const footerBtn = (
    <Button
      onClick={submit}
      disabled={!code.trim() || validating}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      {validating ? "Checking..." : "Track activities"}
      <ArrowRight className="w-4 h-4" />
    </Button>
  );

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Track referral activities</DialogTitle>
            <DialogDescription>Enter your referral code to see your points and history.</DialogDescription>
          </DialogHeader>
          {body}
          <DialogFooter>{footerBtn}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} repositionInputs={false}>
      <DrawerContent className="max-h-[92vh]">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl">Track referral activities</DrawerTitle>
            <DrawerDescription>Enter your referral code to see your points and history.</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4">{body}</div>

          <DrawerFooter>{footerBtn}</DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
