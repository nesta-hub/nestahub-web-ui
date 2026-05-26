import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  Gift,
  Sparkles,
  Wallet as WalletIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { formatPrice } from "@/lib/api";
import { rewards } from "./referralData";
import { useReferralAccount, useConvertPoints, useRequestGift } from "@/hooks/useReferralAccount";
import type { ReferralAccountData } from "@/hooks/useReferralAccount";
import { useReferralLookup as useReferralLookupHook } from "@/hooks/useReferralLookup";
import type { ReferralLookupData } from "@/hooks/useReferralLookup";

const fmt = new Intl.NumberFormat("en-NG");

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  title?: string;
  hideConvert?: boolean;
  overrideCode?: string;
  persist?: boolean;
  showPageHeader?: boolean;
  variant?: "account" | "marketing";
}

export function ReferralActivityContent({
  title = "My Referrals",
  hideConvert = false,
  overrideCode,
  showPageHeader = true,
  variant = "account",
}: Props) {
  const navigate = useNavigate();

  // Account variant uses authenticated hook; marketing/public uses lookup by code
  const accountQuery = useReferralAccount();
  const lookupQuery = useReferralLookupHook(overrideCode);

  const data = overrideCode ? lookupQuery.data : accountQuery.data;
  const isLoading = overrideCode ? lookupQuery.isLoading : accountQuery.isLoading;

  const convertMutation = useConvertPoints();
  const giftMutation = useRequestGift();

  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  const code = (data as ReferralLookupData | undefined)?.code ?? (data as ReferralAccountData | undefined)?.referralCode ?? "";
  const points = data?.points ?? 0;
  const totalReferrals = data?.totalReferrals ?? 0;
  const completedReferrals = data?.completedReferrals ?? 0;

  const sortedHistory = useMemo(
    () => [...(data?.history ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [data?.history],
  );

  const referralUrl = code ? `nestahub.ng?ref=${code}` : "";

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const copyLink = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(`https://${referralUrl}`);
      setLinkCopied(true);
      toast.success("Link copied");
      setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const share = async () => {
    const text = `Use my Nestahub referral code ${code} when you sign up — nestahub.ng`;
    if (navigator.share) {
      try { await navigator.share({ title: "Nestahub Referral", text }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(text); toast.success("Share text copied"); } catch { /* ignore */ }
    }
  };

  const numericAmount = Math.max(0, Math.floor(Number(amount) || 0));
  const canConvert = numericAmount > 0 && numericAmount <= points;

  const doConvert = async () => {
    if (!canConvert) return;
    try {
      await convertMutation.mutateAsync(numericAmount);
      setAmount("");
      setConvertOpen(false);
      toast.success(`${formatPrice(numericAmount)} added to your wallet`);
    } catch (err: any) {
      toast.error(err.message || "Conversion failed");
    }
  };

  const requestGift = async (rewardId: string) => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward || !code) return;
    try {
      await giftMutation.mutateAsync({
        code,
        rewardId: reward.id,
        rewardName: reward.name,
        pointsRequired: reward.naira,
      });
      setRequestSent(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    }
  };

  const closeGift = () => {
    setGiftOpen(false);
    setTimeout(() => {
      setSelectedReward(null);
      setRequestSent(false);
    }, 250);
  };

  const isMarketing = variant === "marketing";

  if (isLoading) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        <div className="h-28 rounded-2xl bg-muted animate-pulse" />
        <div className="h-48 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <>
      {isMarketing ? (
        <div className="space-y-10 md:space-y-16 pb-12">
          {/* Compact code band */}
          <section className="relative overflow-hidden rounded-2xl bg-nesta-cream border border-border shadow-sm">
            <div className="relative px-5 py-4 md:px-6 md:py-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-nesta-sage font-medium">Your referral code</p>
                <p className="font-display text-xl md:text-2xl font-bold text-nesta-brown tracking-wider truncate mt-1">
                  {code}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={copyCode} className="shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="border-t border-border px-5 py-3 md:px-6 md:py-4 flex items-center justify-between gap-4 bg-nesta-sage/5">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-nesta-sage font-medium">Your referral link</p>
                <p className="font-mono text-sm md:text-base font-medium text-nesta-sage truncate mt-1">{referralUrl}</p>
              </div>
              <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0">
                {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {linkCopied ? "Copied" : "Copy"}
              </Button>
            </div>
          </section>

          {/* Stats row */}
          <section className="grid grid-cols-3 gap-3 md:gap-6">
            {[
              { label: "Points", value: fmt.format(points) },
              { label: "Referrals", value: String(totalReferrals) },
              { label: "Confirmed", value: String(completedReferrals) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-card p-4 md:p-6 rounded-sm shadow-[0_2px_0_hsl(var(--foreground)/0.03),0_22px_44px_-28px_hsl(var(--foreground)/0.28)] ring-1 ring-black/5"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-nesta-sage font-medium">{stat.label}</p>
                <p className="font-display text-2xl md:text-4xl font-bold text-foreground mt-2">{stat.value}</p>
              </div>
            ))}
          </section>

          {/* History — editorial */}
          <section className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-2">Activity</p>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Recent activity</h2>
              </div>
              <Button
                size="sm"
                onClick={() => setGiftOpen(true)}
                className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Gift className="w-4 h-4" />
                Redeem a gift
              </Button>
            </div>

            {sortedHistory.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-6 h-6 text-nesta-sage mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              </div>
            ) : (
              <ul>
                {sortedHistory.map((entry) => {
                  const isEarned = entry.type === "earned";
                  return (
                    <li
                      key={entry.id}
                      className="flex items-center gap-4 py-4 border-b border-nesta-brown/10 last:border-b-0"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isEarned ? "bg-nesta-sage/15 text-nesta-sage" : "bg-nesta-tan/20 text-nesta-brown"
                        }`}
                      >
                        {isEarned ? <Sparkles className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-foreground leading-tight">{entry.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(entry.createdAt)}</p>
                      </div>
                      <p
                        className={`font-display text-lg font-semibold tabular-nums ${
                          isEarned ? "text-nesta-sage" : "text-nesta-brown"
                        }`}
                      >
                        {isEarned ? "+" : "−"}
                        {fmt.format(entry.points)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <div className="min-h-[calc(100vh-4rem)] pb-12">
          {/* Header */}
          {showPageHeader && (
            <div className="px-4 pt-4 pb-2 flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary/50 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            </div>
          )}

          {/* Code card — compact, single line */}
          <div className="px-4 mt-4">
            <div className="rounded-2xl border border-nesta-brown/15 bg-nesta-cream p-4 shadow-sm space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Your referral code</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-display text-xl font-bold text-nesta-brown tracking-wider truncate">{code}</p>
                  <Button variant="outline" size="sm" onClick={copyCode} className="gap-1.5 shrink-0">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
              <div className="border-t border-nesta-brown/10 pt-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Your referral link</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-mono text-sm font-medium text-nesta-sage truncate">{referralUrl}</p>
                  <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5 shrink-0">
                    {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {linkCopied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Points hero with referral counts */}
          <div className="px-4 mt-4">
            <div className="rounded-2xl shadow-lg bg-gradient-to-br from-nesta-sage/15 via-nesta-sage/10 to-nesta-sage/5 border border-nesta-sage/15 p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5" />
                Referral points
              </div>
              <p className="text-3xl font-bold text-foreground mt-1.5">{fmt.format(points)} pts</p>
              <div className="mt-3 pt-3 border-t border-nesta-sage/15 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Referrals</p>
                  <p className="text-lg font-semibold text-foreground mt-0.5">{totalReferrals}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Confirmed</p>
                  <p className="text-lg font-semibold text-foreground mt-0.5">{completedReferrals}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Redeem actions — 2 columns */}
          <div className={`px-4 mt-4 grid gap-3 ${hideConvert ? "grid-cols-1" : "grid-cols-2"}`}>
            {!hideConvert && (
              <button
                onClick={() => setConvertOpen(true)}
                className="text-left rounded-2xl border border-border bg-card p-4 flex flex-col gap-2 hover:bg-accent/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <WalletIcon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground leading-tight">Convert to wallet</p>
                <p className="text-xs text-muted-foreground leading-snug">Spend points like cash.</p>
              </button>
            )}

            <button
              onClick={() => setGiftOpen(true)}
              className="text-left rounded-2xl border border-border bg-card p-4 flex flex-col gap-2 hover:bg-accent/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-nesta-sage/15 flex items-center justify-center">
                <Gift className="w-5 h-5 text-nesta-sage" />
              </div>
              <p className="text-sm font-semibold text-foreground leading-tight">Redeem a gift</p>
              <p className="text-xs text-muted-foreground leading-snug">Totes, bottles, hoodies.</p>
            </button>
          </div>

          {/* History */}
          <div className="px-4 mt-8">
            <h2 className="text-sm font-semibold text-foreground mb-3">Points history</h2>
            {sortedHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
                {sortedHistory.map((entry) => {
                  const isEarned = entry.type === "earned";
                  return (
                    <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          isEarned ? "bg-nesta-sage/15 text-nesta-sage" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isEarned ? <Sparkles className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground leading-tight truncate">{entry.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(entry.createdAt)}</p>
                      </div>
                      <p
                        className={`text-sm font-semibold tabular-nums ${
                          isEarned ? "text-nesta-sage" : "text-foreground"
                        }`}
                      >
                        {isEarned ? "+" : "−"}
                        {fmt.format(entry.points)} pts
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Convert drawer */}
      {!hideConvert && (
        <Drawer open={convertOpen} onOpenChange={setConvertOpen}>
          <DrawerContent className="max-h-[92vh]">
            <div className="mx-auto w-full max-w-lg">
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-xl">Convert points to wallet</DrawerTitle>
                <DrawerDescription>1 point = ₦1. You have {fmt.format(points)} pts available.</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4 space-y-3">
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="Amount to convert"
                  inputMode="numeric"
                  className="text-base"
                />
                <div className="flex flex-wrap gap-2">
                  {[1000, 5000, 10000, points].map((preset, i) => (
                    <button
                      key={`${preset}-${i}`}
                      type="button"
                      onClick={() => setAmount(String(Math.min(preset, points)))}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent/40 transition-colors"
                    >
                      {i === 3 ? "All" : `₦${fmt.format(preset)}`}
                    </button>
                  ))}
                </div>
                {numericAmount > points && (
                  <p className="text-xs text-destructive">Amount exceeds available points.</p>
                )}
              </div>
              <DrawerFooter>
                <Button
                  onClick={doConvert}
                  disabled={!canConvert || convertMutation.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {convertMutation.isPending ? "Converting..." : `Convert ${numericAmount > 0 ? formatPrice(numericAmount) : ""}`}
                </Button>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Gift drawer */}
      <Drawer open={giftOpen} onOpenChange={(v) => (v ? setGiftOpen(true) : closeGift())}>
        <DrawerContent className="max-h-[92vh]">
          <div className="mx-auto w-full max-w-lg">
            {!requestSent ? (
              <>
                <DrawerHeader className="text-left">
                  <DrawerTitle className="text-xl">Redeem a gift</DrawerTitle>
                  <DrawerDescription>
                    Tap a reward to send a request. Our team will reach out to confirm.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-4 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                  {rewards.map((r) => {
                    const active = selectedReward === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedReward(r.id)}
                        className={`text-left rounded-2xl border bg-card p-2 transition-all ${
                          active ? "border-primary ring-2 ring-primary/30" : "border-border hover:bg-accent/40"
                        }`}
                      >
                        <div className="aspect-square bg-nesta-cream rounded-xl overflow-hidden">
                          <img src={r.image} alt={r.name} className="w-full h-full object-contain p-2" loading="lazy" />
                        </div>
                        <p className="mt-2 px-1 text-sm font-semibold text-foreground leading-tight">{r.name}</p>
                        <p className="px-1 text-xs text-nesta-sage">{fmt.format(r.naira)} pts</p>
                      </button>
                    );
                  })}
                </div>
                <DrawerFooter>
                  <Button
                    onClick={() => selectedReward && requestGift(selectedReward)}
                    disabled={!selectedReward || giftMutation.isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {giftMutation.isPending ? "Submitting..." : "Request gift"}
                  </Button>
                </DrawerFooter>
              </>
            ) : (
              <>
                <DrawerHeader className="sr-only">
                  <DrawerTitle>Request received</DrawerTitle>
                  <DrawerDescription>Our team will reach out shortly.</DrawerDescription>
                </DrawerHeader>
                <div className="px-6 pt-4 pb-2 text-center space-y-4">
                  <div className="mx-auto w-14 h-14 rounded-full bg-nesta-sage/15 text-nesta-sage flex items-center justify-center">
                    <Check className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-foreground">Request received</h3>
                    <p className="text-sm text-muted-foreground">
                      We've logged your gift request. Our team will reach out shortly on WhatsApp to confirm delivery.
                    </p>
                  </div>
                </div>
                <DrawerFooter>
                  <Button onClick={closeGift} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Done
                  </Button>
                </DrawerFooter>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
