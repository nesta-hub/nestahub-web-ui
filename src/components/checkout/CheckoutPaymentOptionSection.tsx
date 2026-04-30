import { Banknote, Landmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DeliverySummaryCard } from "./DeliverySummaryCard";

export type PaymentOption = "pay-now" | "pay-on-delivery";

interface CheckoutPaymentOptionSectionProps {
  selectedOption: PaymentOption | null;
  onSelectOption: (option: PaymentOption) => void;
  onChangeOption: () => void;
}

export function CheckoutPaymentOptionSection({
  selectedOption,
  onSelectOption,
  onChangeOption,
}: CheckoutPaymentOptionSectionProps) {
  if (selectedOption) {
    return (
      <div className="space-y-2">
        <h3 className="text-base font-medium text-muted-foreground">
          Payment Option
        </h3>
        <DeliverySummaryCard
          icon={
            selectedOption === "pay-now" ? (
              <Landmark className="w-4 h-4 text-primary" />
            ) : (
              <Banknote className="w-4 h-4 text-primary" />
            )
          }
          title={selectedOption === "pay-now" ? "Pay Now" : "Pay on Delivery"}
          subtitle={
            selectedOption === "pay-now"
              ? "Bank transfer on the next screen"
              : "Make payment on rider arrival"
          }
          onChangeClick={onChangeOption}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-muted-foreground">
        Choose Payment Option
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <Card
          className="p-4 cursor-pointer hover:border-primary transition-colors active:scale-[0.98]"
          onClick={() => onSelectOption("pay-now")}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Pay Now</p>
              <p className="text-xs text-muted-foreground">Bank transfer</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-4 cursor-pointer hover:border-primary transition-colors active:scale-[0.98]"
          onClick={() => onSelectOption("pay-on-delivery")}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Pay on Delivery</p>
              <p className="text-xs text-muted-foreground">Pay on Delivery</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
