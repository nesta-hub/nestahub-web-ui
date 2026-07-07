import { type ReactNode } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Loader2, XCircle, CheckCircle2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRedeemGiftCard } from '@/hooks/useRedeemGiftCard';
import { formatKobo } from '@/utils/wallet';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function RedeemGiftCardDialog({ open, onOpenChange }: Props) {
  const isMobile = useIsMobile();
  const { code, setCode, result, submit, reset, clearError, isPending, error } =
    useRedeemGiftCard();

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) reset();
  };

  const title = result ? 'Gift card redeemed' : 'Redeem a gift card';
  const description = result
    ? 'The balance has been added to your wallet.'
    : 'Enter your gift card code to add its balance to your wallet.';

  const body: ReactNode = result ? (
    <div className="flex flex-col items-center text-center py-2">
      <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-7 h-7" />
      </div>
      <p className="text-3xl font-bold text-foreground">+{formatKobo(result.amount)}</p>
      <p className="text-sm text-muted-foreground mt-2">
        New wallet balance:{' '}
        <span className="font-semibold text-foreground">{formatKobo(result.balance)}</span>
      </p>
    </div>
  ) : (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Gift card code</label>
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (error) clearError();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="e.g. NESTA-ABCD-1234-EFGH"
          className="text-base"
          autoFocus={!isMobile}
          disabled={isPending}
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive animate-fade-in">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        This adds the full remaining balance to{' '}
        <span className="font-medium text-foreground">your</span> wallet.
      </p>
    </div>
  );

  const footer: ReactNode = result ? (
    <Button variant="shop" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto">
      Done
    </Button>
  ) : (
    <Button
      variant="shop"
      onClick={submit}
      disabled={!code.trim() || isPending}
      className="w-full sm:w-auto"
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Redeeming…
        </>
      ) : (
        <>
          <Gift className="w-4 h-4" /> Redeem to wallet
        </>
      )}
    </Button>
  );

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {body}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} repositionInputs={false}>
      <DrawerContent className="max-h-[92vh]">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl">{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2">{body}</div>
          <DrawerFooter>{footer}</DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
