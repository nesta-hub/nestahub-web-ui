import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ContactFormProps {
  fullName: string;
  phoneNumber: string;
  onFullNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

export function ContactForm({
  fullName,
  phoneNumber,
  onFullNameChange,
  onPhoneChange,
}: ContactFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-muted-foreground">
        Contact Information
      </h3>
      
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="checkout-fullName">Full Name</Label>
          <Input
            id="checkout-fullName"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="John Doe"
            className="h-12"
            autoComplete="name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="checkout-phone">Phone Number</Label>
          <Input
            id="checkout-phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="08012345678"
            className="h-12"
            autoComplete="tel"
          />
        </div>
      </div>
    </div>
  );
}
