import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  Gift,
  Share2,
  Sparkles,
  Users,
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
import { rewards } from "@/components/referrals/referralData";
import { useReferralAccount, useConvertPoints, useRequestGift } from "@/hooks/useReferralAccount";
import { cn } from "@/lib/utils";

const fmt = new Intl.NumberFormat("en-NG");

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface DesktopReferralsViewProps {
  onBack: () => void;
}

export function DesktopReferralsView({ onBack }: DesktopReferralsViewProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useReferralAccount();
  const convertMutation = useConvertPoints();
  const giftMutation = useRequestGift();

  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  const code = data?.referralCode ?? "";
  const points = data?.points ?? 0;
  const totalReferrals = data?.totalReferrals ?? 0;
  const completedReferrals = data?.completedReferrals ?? 0;
  const referralUrl = code ? `nestahub.ng?ref=${code}` : "";

  const sortedHistory = useMemo(
    () => [...(data?.history ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [data?.history]
  );

  const copyCode = async () => {
    if (!code) return;
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
      await giftMutation.mutateAsync({ code, rewardId: reward.id, rewardName: reward.name, pointsRequired: reward.naira });
      setRequestSent(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    }
  };

  const closeGift = () => {
    setGiftOpen(false);
    setTimeout(() => { setSelectedReward(null); setRequestSent(false); }, 250);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Top nav */}
      <div className="border-b bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="container flex items-center h-14 gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Account
          </button>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="text-base font-bold text-foreground">My Referrals</h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left — code, points, redeem */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-20 space-y-4">
              {/* Points hero */}
              <div className="rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-primary/10">
                <div className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-[0.18em] font-semibold mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    Referral points
                  </div>
                  {isLoading ? (
                    <div className="h-12 w-32 rounded bg-muted/50 animate-pulse" />
                  ) : (
                    <p className="text-[40px] leading-none font-bold text-foreground tabular-nums">
                      {fmt.format(points)}{" "}
                      <span className="text-xl">pts</span>
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs mt-3 leading-relaxed">
                    1 point = ₦1. Convert anytime or redeem for a gift.
                  </p>
                </div>
                <div className="border-t border-primary/10 grid grid-cols-2 divide-x divide-primary/10">
                  <div className="px-5 py-3.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      Referrals
                    </p>
                    <p className="text-sm font-bold text-foreground tabular-nums">{totalReferrals}</p>
                  </div>
                  <div className="px-5 py-3.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      Confirmed
                    </p>
                    <p className="text-sm font-bold text-foreground tabular-nums">
                      {completedReferrals}
                    </p>
                  </div>
                </div>
              </div>

              {/* Code & link card */}
              {code && (
                <div className="rounded-2xl border border-foreground/[0.06] bg-card p-5 space-y-4 shadow-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                      Your referral code
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-2xl font-bold text-foreground tracking-wider truncate">
                        {code}
                      </p>
                      <Button variant="outline" size="sm" onClick={copyCode} className="gap-1.5 shrink-0">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                  {referralUrl && (
                    <div className="border-t border-border pt-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                        Your referral link
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="font-mono text-xs font-medium text-muted-foreground truncate">
                          {referralUrl}
                        </p>
                        <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5 shrink-0">
                          {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {linkCopied ? "Copied" : "Copy"}
                        </Button>
                      </div>
                    </div>
                  )}
                  <Button variant="shop" className="w-full gap-2" onClick={share}>
                    <Share2 className="w-4 h-4" /> Share invite
                  </Button>
                </div>
              )}

              {/* Redeem actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setConvertOpen(true)}
                  className="text-left rounded-2xl border border-foreground/[0.06] bg-card p-4 flex flex-col gap-2 hover:shadow-md transition-all shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <WalletIcon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    Convert to wallet
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug">Spend like cash.</p>
                </button>
                <button
                  onClick={() => setGiftOpen(true)}
                  className="text-left rounded-2xl border border-foreground/[0.06] bg-card p-4 flex flex-col gap-2 hover:shadow-md transition-all shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-emerald-700" />
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-tight">Redeem a gift</p>
                  <p className="text-xs text-muted-foreground leading-snug">Totes, bottles, more.</p>
                </button>
              </div>
            </div>
          </aside>

          {/* Right — activity */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-card rounded-3xl border border-foreground/[0.06] overflow-hidden shadow-sm">
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-base font-bold text-foreground">Points activity</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Every point earned and redeemed
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {sortedHistory.length} entr{sortedHistory.length !== 1 ? "ies" : "y"}
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : sortedHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-muted-foreground/60" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">No activity yet</p>
                  <p className="text-xs text-muted-foreground max-w-[30ch]">
                    Share your code to start earning. You'll see every confirmed referral here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {sortedHistory.map((entry) => {
                    const isEarned = entry.type === "earned";
                    return (
                      <li
                        key={entry.id}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-secondary/20 transition-colors"
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                            isEarned
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-secondary text-muted-foreground"
                          )}
                        >
                          {isEarned ? (
                            <Sparkles className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{entry.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(entry.createdAt)}
                          </p>
                        </div>
                        <p
                          className={cn(
                            "text-sm font-bold tabular-nums shrink-0",
                            isEarned ? "text-emerald-700" : "text-foreground"
                          )}
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

            {/* Explore referral page link */}
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate("/account/referrals")}
                className="text-sm font-medium text-primary hover:underline"
              >
                View full referral activity →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Convert drawer */}
      <Drawer open={convertOpen} onOpenChange={setConvertOpen}>
        <DrawerContent className="max-h-[92vh]">
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader className="text-left">
              <DrawerTitle className="text-xl">Convert points to wallet</DrawerTitle>
              <DrawerDescription>
                1 point = ₦1. You have {fmt.format(points)} pts available.
              </DrawerDescription>
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
              <Button onClick={doConvert} disabled={!canConvert || convertMutation.isPending} variant="shop">
                {convertMutation.isPending ? "Converting..." : `Convert ${numericAmount > 0 ? formatPrice(numericAmount) : ""}`}
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

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
                        className={cn(
                          "text-left rounded-2xl border bg-card p-2 transition-all",
                          active
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:bg-accent/40"
                        )}
                      >
                        <div className="aspect-square bg-secondary/50 rounded-xl overflow-hidden">
                          <img
                            src={r.image}
                            alt={r.name}
                            className="w-full h-full object-contain p-2"
                            loading="lazy"
                          />
                        </div>
                        <p className="mt-2 px-1 text-sm font-semibold text-foreground leading-tight">
                          {r.name}
                        </p>
                        <p className="px-1 text-xs text-muted-foreground">
                          {fmt.format(r.naira)} pts
                        </p>
                      </button>
                    );
                  })}
                </div>
                <DrawerFooter>
                  <Button
                    onClick={() => selectedReward && requestGift(selectedReward)}
                    disabled={!selectedReward || giftMutation.isPending}
                    variant="shop"
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
                  <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Check className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-foreground">Request received</h3>
                    <p className="text-sm text-muted-foreground">
                      We've logged your gift request. Our team will reach out shortly on WhatsApp to
                      confirm delivery.
                    </p>
                  </div>
                </div>
                <DrawerFooter>
                  <Button onClick={closeGift} variant="shop">
                    Done
                  </Button>
                </DrawerFooter>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
