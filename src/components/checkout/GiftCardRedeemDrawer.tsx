import { useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateGiftCard } from "@/lib/api";

interface GiftCardRedeemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderTotal: number;
  onApply: (code: string, balance: number, amountApplied: number) => Promise<void>;
}

export function GiftCardRedeemDrawer({
  open,
  onOpenChange,
  orderTotal,
  onApply,
}: GiftCardRedeemDrawerProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [applied, setApplied] = useState(false);

  const reset = () => {
    setCode("");
    setLoading(false);
    setError(false);
    setErrorMessage("");
    setApplied(false);
  };

  const handleApply = async () => {
    setError(false);
    setErrorMessage("");
    setApplied(false);
    setLoading(true);

    try {
      const validation = await validateGiftCard(code.trim().toUpperCase());
      setLoading(false);

      if (!validation.valid) {
        setError(true);
        // Set user-friendly error messages
        if (validation.reason === 'not_found') {
          setErrorMessage('Gift card not found');
        } else if (validation.reason === 'expired') {
          setErrorMessage('Gift card has expired');
        } else if (validation.reason === 'exhausted') {
          setErrorMessage('Gift card has no remaining balance');
        } else if (validation.reason === 'void') {
          setErrorMessage('Gift card has been voided');
        } else {
          setErrorMessage('Invalid gift card');
        }
      } else {
        setApplied(true);
        const amountApplied = Math.min(validation.currentBalance, orderTotal);
        // Brief flash then auto-close
        setTimeout(async () => {
          try {
            await onApply(code.trim().toUpperCase(), validation.currentBalance, amountApplied);
            onOpenChange(false);
            reset();
          } catch (applyErr) {
            // If the API call fails, show error
            setApplied(false);
            setError(true);
            setErrorMessage(applyErr instanceof Error ? applyErr.message : 'Failed to apply gift card. Please try again.');
          }
        }, 600);
      }
    } catch (err) {
      setLoading(false);
      setError(true);
      setErrorMessage('Failed to validate gift card. Please try again.');
    }
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DrawerContent className="min-h-[40vh]">
        <DrawerHeader>
          <DrawerTitle>Redeem Gift Card</DrawerTitle>
          <DrawerDescription>Enter your gift code below</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Input row */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter gift code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(false);
                setErrorMessage("");
                setApplied(false);
              }}
              className="uppercase tracking-wider"
              disabled={loading || applied}
            />
            <Button
              variant="shop"
              onClick={handleApply}
              disabled={loading || applied || code.trim().length === 0}
              className="shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
            </Button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
              <Loader2 className="w-4 h-4 animate-spin" />
              Validating...
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive animate-fade-in">
              <XCircle className="w-4 h-4" />
              {errorMessage || 'Invalid or expired gift code'}
            </div>
          )}

          {/* Applied flash */}
          {applied && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 animate-fade-in">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Applied!</span>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
