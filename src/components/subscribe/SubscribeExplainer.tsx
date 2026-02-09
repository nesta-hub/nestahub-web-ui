import { Lightbulb, Check } from "lucide-react";

export function SubscribeExplainer() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">Never Run Out Again</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Enable Auto-Renew on items you use regularly and we'll deliver them on your schedule.
          </p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-amber-600" />
              Save 5% on every renewal
            </li>
            <li className="flex items-center gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-amber-600" />
              Skip or cancel anytime
            </li>
            <li className="flex items-center gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-amber-600" />
              Manage easily via WhatsApp
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
