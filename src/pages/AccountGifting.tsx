import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { ArrowLeft, Copy, Check, Gift, Package, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/data/bundleData";
import {
  INITIAL_GIFTING_HISTORY,
  STATUS_LABEL,
  STATUS_NOTE,
  DELIVERY_LABEL,
  type GiftingHistoryEntry,
  type GiftingStatus,
} from "@/components/gifting/mockGiftingHistory";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATUS_STYLE: Record<GiftingStatus, string> = {
  "pending-payment": "bg-amber-50 text-amber-700 border border-amber-200",
  processing: "bg-blue-50 text-blue-700 border border-blue-200",
  delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  scheduled: "bg-purple-50 text-purple-700 border border-purple-200",
  cancelled: "bg-red-50 text-red-600 border border-red-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}

function GiftEntryCard({ entry }: { entry: GiftingHistoryEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={cn(
        "overflow-hidden border border-foreground/[0.06] shadow-sm transition-all",
        expanded && "ring-1 ring-[hsl(28,32%,36%)]/20"
      )}
    >
      {/* Main row */}
      <button
        className="w-full flex items-start gap-4 p-4 text-left hover:bg-secondary/20 transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Icon */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
            entry.kind === "gift-card"
              ? "bg-[hsl(28,40%,92%)]"
              : "bg-[hsl(85,20%,90%)]"
          )}
        >
          {entry.kind === "gift-card" ? (
            <Gift className="w-5 h-5 text-[hsl(28,32%,40%)]" />
          ) : (
            <Package className="w-5 h-5 text-[hsl(85,22%,40%)]" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground leading-snug">{entry.title}</p>
            <p className="text-sm font-bold text-foreground tabular-nums shrink-0">
              {formatPrice(entry.amount)}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.08em]", STATUS_STYLE[entry.status])}>
              {STATUS_LABEL[entry.status]}
            </span>
            <span className="text-[11px] text-muted-foreground">{formatDate(entry.date)}</span>
            <span className="text-[11px] text-muted-foreground">{DELIVERY_LABEL[entry.deliveryMode]}</span>
          </div>
        </div>

        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-4 animate-fade-in">
          {/* Status note */}
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2.5 leading-relaxed">
            {STATUS_NOTE[entry.status]}
          </p>

          {/* Details grid */}
          <div className="space-y-1.5">
            <DetailRow label="Order ID" value={entry.id} />
            {entry.recipientName && <DetailRow label="Recipient" value={entry.recipientName} />}
            {entry.recipientContact && <DetailRow label="Contact" value={entry.recipientContact} />}
            {entry.theme && <DetailRow label="Theme" value={entry.theme.replace(/-/g, " ")} />}
            {entry.message && (
              <DetailRow
                label="Message"
                value={<span className="italic">"{entry.message}"</span>}
              />
            )}
          </div>

          {/* Items list for bundles */}
          {entry.items && entry.items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Items included</p>
              <ul className="space-y-1">
                {entry.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.name}</span>
                    <span className="font-medium text-foreground/70">×{item.qty}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Shareable link */}
          {entry.shareableLink && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
              <p className="text-xs text-muted-foreground truncate">{entry.shareableLink}</p>
              <div className="flex items-center gap-2 shrink-0">
                <CopyButton text={entry.shareableLink} />
              </div>
            </div>
          )}

          {/* Action */}
          {entry.status === "pending-payment" && (
            <Button variant="shop" className="w-full h-10 text-sm font-semibold" size="sm">
              Complete Payment
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

const AccountGifting = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const entries = INITIAL_GIFTING_HISTORY;

  const giftCards = entries.filter((e) => e.kind === "gift-card");
  const bundles = entries.filter((e) => e.kind === "gift-bundle");

  return (
    <Layout showNav={isMobile}>
      <div className="min-h-screen pb-20">
        {/* Header */}
        <div className="px-4 md:px-8 pt-5 pb-4 flex items-center gap-3 border-b border-border">
          <button
            onClick={() => navigate("/account")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground leading-tight">
              My Gifting History
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              All gifts you've sent via Nesta Hub
            </p>
          </div>
        </div>

        <div className="px-4 md:px-8 md:max-w-2xl md:mx-auto">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Gift className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-1">No gifts sent yet</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-[26ch]">
                Send your first gift card or curated bundle to someone special.
              </p>
              <Button variant="shop" onClick={() => navigate("/gifting")}>
                Explore Gifting
              </Button>
            </div>
          ) : (
            <div className="pt-6 space-y-8">
              {/* Gift Cards section */}
              {giftCards.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-4 h-4 text-[hsl(28,32%,45%)]" />
                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-[0.12em]">
                      Gift Cards
                    </h2>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {giftCards.length} sent
                    </span>
                  </div>
                  <div className="space-y-3">
                    {giftCards.map((e) => (
                      <GiftEntryCard key={e.id} entry={e} />
                    ))}
                  </div>
                </section>
              )}

              {/* Bundles section */}
              {bundles.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-[hsl(85,22%,45%)]" />
                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-[0.12em]">
                      Gift Bundles
                    </h2>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {bundles.length} sent
                    </span>
                  </div>
                  <div className="space-y-3">
                    {bundles.map((e) => (
                      <GiftEntryCard key={e.id} entry={e} />
                    ))}
                  </div>
                </section>
              )}

              {/* Send another CTA */}
              <button
                onClick={() => navigate("/gifting")}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-[hsl(28,20%,95%)] border border-[hsl(28,20%,86%)] text-sm font-semibold text-[hsl(28,32%,36%)] hover:bg-[hsl(28,20%,92%)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Send another gift
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AccountGifting;
