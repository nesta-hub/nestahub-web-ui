import { Copy, Check, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/api";

interface CheckoutPaymentViewProps {
  orderId: string;
  totalAmount: number;
  onPaymentConfirmed: () => void;
  onBack: () => void;
}

export function CheckoutPaymentView({
  orderId,
  totalAmount,
  onPaymentConfirmed,
  onBack,
}: CheckoutPaymentViewProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const bankDetails = {
    bank: "Moniepoint MFB",
    accountNumber: "4005050638",
    accountName: "Nesta Hub",
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
        <button type="button" onClick={onBack}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-semibold text-lg">Complete Payment</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Order ID */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Order ID</p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-lg font-bold text-foreground">{orderId}</p>
            <button
              type="button"
              onClick={() => handleCopy(orderId, 'orderId')}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              {copied === 'orderId' ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Include this Order ID in the transfer narration</p>
        </div>

        {/* Total Amount */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-3xl font-bold text-primary">{formatPrice(totalAmount)}</p>
              <button
                onClick={() => handleCopy(totalAmount.toString(), 'amount')}
                className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                title="Copy amount"
              >
                {copied === 'amount' ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-primary" />
                )}
              </button>
            </div>
          </div>
        </Card>

        {/* Bank Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Bank Transfer Details
          </h3>
          
          <Card className="p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Bank</p>
              <p className="text-sm font-medium">{bankDetails.bank}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Account Number</p>
                <p className="text-lg font-bold tracking-wide">{bankDetails.accountNumber}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(bankDetails.accountNumber, 'account')}
                className="shrink-0"
              >
                {copied === 'account' ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground">Account Name</p>
              <p className="text-sm font-medium">{bankDetails.accountName}</p>
            </div>
          </Card>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-background shrink-0 space-y-2">
        <Button
          variant="shop"
          className="w-full h-12 text-base font-semibold"
          onClick={onPaymentConfirmed}
        >
          Payment Made
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Click "Payment Made" once transfer is completed
        </p>
      </div>
    </div>
  );
}
