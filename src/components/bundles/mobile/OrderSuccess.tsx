import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderSuccessProps {
  orderId: string;
  onClose: () => void;
}

export function OrderSuccess({ orderId, onClose }: OrderSuccessProps) {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Order Received!</h2>
        
        <p className="text-muted-foreground mb-4">
          Your order <span className="font-mono font-medium">{orderId}</span> has been received.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 w-full max-w-xs">
          <p className="text-sm text-muted-foreground">
            Payment will be confirmed shortly. You'll receive a confirmation via WhatsApp once verified.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-background shrink-0">
        <Button 
          variant="shop"
          className="w-full h-12 text-base font-semibold"
          onClick={onClose}
        >
          Done
        </Button>
      </div>
    </>
  );
}
