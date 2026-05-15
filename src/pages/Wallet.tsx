import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SignInForm } from '@/components/auth/SignInForm';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletData } from '@/hooks/useWalletData';
import { formatKobo, transactionLabel } from '@/utils/wallet';

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

  return (
    <Layout showNav={false}>
      <div className="min-h-[calc(100vh-4rem)] pb-10">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary/50 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">My Wallet</h1>
        </div>

        {/* Balance hero */}
        <div className="px-4 mt-4">
          <div className="rounded-2xl shadow-lg bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-primary/10 p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <WalletIcon className="w-3.5 h-3.5" />
              Available balance
            </div>
            {summaryLoading ? (
              <div className="h-10 w-40 rounded bg-muted animate-pulse mt-2" />
            ) : (
              <p className="text-4xl font-bold text-foreground mt-2">
                {formatKobo(summary?.balance ?? 0)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Use your wallet credit at checkout to pay for any order.
            </p>
          </div>
        </div>

        {/* Transactions */}
        <div className="px-4 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Transaction History</h2>
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
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    active
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
          ) : transactions.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No transactions yet.
            </Card>
          ) : (
            <>
              <div className="divide-y divide-border">
                {transactions.map((tx) => {
                  const isCredit = tx.type === 'credit';
                  return (
                    <div key={tx.id} className="flex items-center justify-between gap-3 py-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-muted-foreground'
                          }`}
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
                            {formatDate(tx.createdAt)} · Balance {formatKobo(tx.balanceAfter)}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`text-sm font-semibold shrink-0 ${
                          isCredit ? 'text-emerald-700' : 'text-foreground'
                        }`}
                      >
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
