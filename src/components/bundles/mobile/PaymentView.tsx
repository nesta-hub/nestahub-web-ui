import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/bundleData";
import { FloatingBackButton } from "./FloatingBackButton";

interface PaymentViewProps {
  orderId: string;
  totalPrice: number;
  onPaymentMade: () => void;
  onBack: () => void;
}

export function PaymentView({ orderId, totalPrice, onPaymentMade, onBack }: PaymentViewProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const bankDetails = {
    bank: 'Moniepoint MFB',
    accountNumber: '4005050638',
    accountName: 'Nesta Hub',
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
        <FloatingBackButton onClick={onBack} />
        <div>
          <h1 className="font-semibold text-lg">Complete Payment</h1>
          <p className="text-sm text-muted-foreground">Transfer to the account below</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Order ID */}
        <div className="bg-primary/5 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Order ID</p>
          <p className="text-lg font-bold font-mono">{orderId}</p>
          <p className="text-xs text-muted-foreground mt-1">Include this Order ID in the transfer narration</p>
        </div>

        {/* Amount */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Amount to Transfer</p>
          <p className="text-3xl font-bold text-primary">{formatPrice(totalPrice)}</p>
        </div>

        {/* Bank details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Bank</p>
              <p className="text-base font-medium">{bankDetails.bank}</p>
            </div>
          </div>

          <div 
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer"
            onClick={() => copyToClipboard(bankDetails.accountNumber, 'account')}
          >
            <div>
              <p className="text-xs text-muted-foreground">Account Number</p>
              <p className="text-base font-medium font-mono">{bankDetails.accountNumber}</p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {copied === 'account' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Account Name</p>
              <p className="text-base font-medium">{bankDetails.accountName}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-background shrink-0">
        <Button 
          variant="shop"
          className="w-full h-11 text-base font-semibold"
          onClick={onPaymentMade}
        >
          Payment Made
        </Button>
      </div>
    </>
  );
}
