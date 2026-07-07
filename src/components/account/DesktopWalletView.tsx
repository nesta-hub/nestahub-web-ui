import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ReceiptText,
  Wallet as WalletIcon,
  TrendingUp,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletData } from "@/hooks/useWalletData";
import { formatKobo, transactionLabel } from "@/utils/wallet";
import { RedeemGiftCardDialog } from "@/components/wallet/RedeemGiftCardDialog";

type Filter = "all" | "earned" | "used";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All transactions" },
  { id: "earned", label: "Earned" },
  { id: "used", label: "Used" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface DesktopWalletViewProps {
  onBack: () => void;
}

export function DesktopWalletView({ onBack }: DesktopWalletViewProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");
  const [redeemOpen, setRedeemOpen] = useState(false);
  const typeFilter = filter === "earned" ? "credit" : filter === "used" ? "debit" : undefined;

  const { summary, summaryLoading, transactions, transactionsLoading, page, totalPages, goToPage } =
    useWalletData(session?.access_token, typeFilter);

  const balance = summary?.balance ?? 0;
  const totalEarned = summary?.totalEarned ?? 0;
  const totalUsed = summary?.totalRedeemed ?? 0;

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
          <h1 className="text-base font-bold text-foreground">My Wallet</h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left — balance + stats */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-20 space-y-4">
              {/* Balance card */}
              <div className="rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-primary/10">
                <div className="p-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide mb-3">
                    <WalletIcon className="w-3.5 h-3.5" />
                    Available balance
                  </div>
                  {summaryLoading ? (
                    <div className="h-10 w-40 rounded bg-muted/50 animate-pulse" />
                  ) : (
                    <p className="text-4xl font-bold text-foreground leading-none">
                      {formatKobo(balance)}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs mt-3 leading-relaxed">
                    Apply at checkout to pay for any order on Nesta Hub.
                  </p>
                </div>
                <div className="border-t border-primary/10 grid grid-cols-2 divide-x divide-primary/10">
                  <div className="px-5 py-3.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      Total earned
                    </p>
                    <p className="text-sm font-bold text-foreground">{formatKobo(totalEarned)}</p>
                  </div>
                  <div className="px-5 py-3.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      Total used
                    </p>
                    <p className="text-sm font-bold text-foreground">{formatKobo(totalUsed)}</p>
                  </div>
                </div>
              </div>

              {/* Redeem gift card */}
              <button
                type="button"
                onClick={() => setRedeemOpen(true)}
                className="w-full flex items-center gap-3 rounded-2xl border border-foreground/[0.06] bg-card p-4 shadow-sm text-left hover:bg-muted/40 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Redeem a gift card</p>
                  <p className="text-xs text-muted-foreground">Add its balance to your wallet</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>

              {/* How to earn */}
              <div className="rounded-2xl border border-foreground/[0.06] bg-card p-5 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-foreground">How to earn credits</h3>
                {[
                  { icon: ShieldCheck, text: "Complete orders and get reward credit back" },
                  { icon: TrendingUp, text: "Refer a friend and earn ₦500 when they order" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[hsl(28,20%,92%)] flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-[hsl(28,32%,45%)]" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
                <button
                  onClick={() => navigate("/account/referrals")}
                  className="text-xs font-semibold text-[hsl(28,32%,36%)] hover:underline"
                >
                  View referral program →
                </button>
              </div>
            </div>
          </aside>

          {/* Right — transactions */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-card rounded-3xl border border-foreground/[0.06] overflow-hidden shadow-sm">
              {/* Filter tabs */}
              <div className="flex items-center gap-1 p-4 border-b border-border">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                      filter === f.id
                        ? "bg-[hsl(28,32%,36%)] text-white shadow-sm"
                        : "text-muted-foreground hover:bg-secondary/60"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
                {!transactionsLoading && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {transactionsLoading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <ReceiptText className="w-6 h-6 text-muted-foreground/60" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {filter === "used"
                      ? "No credit used yet"
                      : filter === "earned"
                      ? "No earnings yet"
                      : "No transactions yet"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-[26ch]">
                    {filter === "used"
                      ? "Once you apply wallet credit at checkout, it'll show up here."
                      : "Complete orders to earn wallet credits."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border">
                    {transactions.map((tx) => {
                      const isCredit = tx.type === "credit";
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                                isCredit
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-secondary text-muted-foreground"
                              )}
                            >
                              {isCredit ? (
                                <ArrowDownLeft className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {transactionLabel(tx)}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(tx.createdAt)}
                                </p>
                                <span className="text-muted-foreground/40">·</span>
                                <p className="text-xs text-muted-foreground">
                                  Balance after: {formatKobo(tx.balanceAfter)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <p
                            className={cn(
                              "text-sm font-bold tabular-nums shrink-0",
                              isCredit ? "text-emerald-700" : "text-foreground"
                            )}
                          >
                            {isCredit ? "+" : "−"}
                            {formatKobo(tx.amount)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(page - 1)}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Page {page} of {totalPages}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <RedeemGiftCardDialog open={redeemOpen} onOpenChange={setRedeemOpen} />
    </div>
  );
}
