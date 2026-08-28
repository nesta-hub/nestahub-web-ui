import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, ReceiptText } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { SignInForm } from '@/components/auth/SignInForm';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletData } from '@/hooks/useWalletData';
import { formatKobo, transactionLabel } from '@/utils/wallet';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopWalletView } from '@/components/account/DesktopWalletView';

type Filter = 'all' | 'earned' | 'used';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'earned', label: 'Earned' },
  { id: 'used', label: 'Used' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const Wallet = () => {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<Filter>('all');
  const typeFilter = filter === 'earned' ? 'credit' : filter === 'used' ? 'debit' : undefined;
  const { summary, summaryLoading, transactions, transactionsLoading, page, totalPages, goToPage } =
    useWalletData(session?.access_token, typeFilter);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <SignInForm
          title="Sign in to view your wallet"
          description="Your cashback and referral rewards are waiting"
          containerClassName="flex-1 flex flex-col items-center justify-center px-6 py-16"
        />
      </Layout>
    );
  }

  if (!isMobile) {
    return (
      <Layout showNav={false}>
        <DesktopWalletView onBack={() => navigate('/account')} />
      </Layout>
    );
  }

  // Use pre-computed totals from summary; transactions may be filtered by type
  const totalEarned = summary?.totalEarned ?? 0;
  const totalUsed = summary?.totalRedeemed ?? 0;
  const filteredTransactions = transactions;

  return (
    <Layout showNav={false}>
      <div className="min-h-[calc(100vh-4rem)] pb-10 bg-[#FAF8F5]">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center hover:bg-secondary/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">My Wallet</h1>
        </div>

        {/* Balance hero */}
        <div className="px-4 mt-4">
          <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-primary/10 shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-3">
                <WalletIcon className="w-3.5 h-3.5" />
                Available balance
              </div>
              {summaryLoading ? (
                <div className="h-10 w-40 rounded bg-muted animate-pulse" />
              ) : (
                <p className="font-display text-[40px] leading-none font-bold text-foreground tabular-nums">
                  {formatKobo(summary?.balance ?? 0)}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed whitespace-nowrap">
                Apply at checkout to pay for any order on Nesta Hub.
              </p>
            </div>
            <div className="border-t border-primary/10 grid grid-cols-2 divide-x divide-primary/10">
              <div className="px-5 py-3.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Total earned</p>
                <p className="text-sm font-bold text-foreground tabular-nums">{formatKobo(totalEarned)}</p>
              </div>
              <div className="px-5 py-3.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Total used</p>
                <p className="text-sm font-bold text-foreground tabular-nums">{formatKobo(totalUsed)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="px-4 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Transaction History</h2>
            <span className="text-xs text-muted-foreground">
              {filteredTransactions.length} item{filteredTransactions.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 mb-4">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {transactionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            (() => {
              const copy =
                filter === 'used'
                  ? { title: 'No credit used yet', subtitle: "Once you apply wallet credit at checkout, it'll show up here." }
                  : filter === 'earned'
                  ? { title: 'No earnings yet', subtitle: 'Get rewarded every time you shop, you earn credits on every completed orders.' }
                  : { title: 'No transactions yet', subtitle: 'Get rewarded every time you shop, you earn credits on every completed orders.' };
              return (
                <div className="rounded-3xl bg-secondary/50 px-8 py-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <ReceiptText className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{copy.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">{copy.subtitle}</p>
                </div>
              );
            })()
          ) : (
            <>
              <div className="rounded-2xl bg-card border border-foreground/[0.06] divide-y divide-border overflow-hidden shadow-[0_1px_3px_hsl(var(--foreground)/0.04)]">
                {filteredTransactions.map((tx) => {
                  const isCredit = tx.type === 'credit';
                  return (
                    <div key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-muted-foreground'}`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {transactionLabel(tx)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(tx.createdAt)} · Bal {formatKobo(tx.balanceAfter)}
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold tabular-nums shrink-0 ${isCredit ? 'text-emerald-700' : 'text-foreground'}`}>
                        {isCredit ? '+' : '−'}
                        {formatKobo(tx.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
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

    </Layout>
  );
};

export default Wallet;
