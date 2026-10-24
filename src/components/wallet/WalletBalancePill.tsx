import { useNavigate } from 'react-router-dom';
import { ChevronRight, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getWalletSummary } from '@/lib/api';
import { formatKobo } from '@/utils/wallet';
import { cn } from '@/lib/utils';

interface WalletBalancePillProps {
  className?: string;
  size?: 'sm' | 'md';
  iconOnly?: boolean;
  /** "outlined" is the redesigned shop's pill: a hairline outline, "Wallet" then the bold balance. */
  variant?: 'filled' | 'outlined';
}

export function WalletBalancePill({ className = '', size = 'md', iconOnly = false, variant = 'filled' }: WalletBalancePillProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const token = session?.access_token;

  const { data: summary } = useQuery({
    queryKey: ['wallet-summary', token],
    queryFn: () => getWalletSummary(token!),
    enabled: !!token,
    staleTime: 30_000,
  });

  if (!token) return null;
  const balance = summary?.balance ?? 0;

  if (variant === 'outlined') {
    return (
      <button
        type="button"
        onClick={() => navigate('/account/wallet')}
        aria-label={`Open wallet, balance ${formatKobo(balance)}`}
        className={cn(
          'inline-flex items-center gap-[7px] whitespace-nowrap rounded-full border border-shop-line-soft text-shop-muted transition-colors hover:border-shop-brown',
          size === 'sm' ? 'h-8 px-3 text-xs' : 'h-[38px] px-3.5 text-[12.5px]',
          className,
        )}
      >
        Wallet <strong className="font-extrabold text-shop-ink">{formatKobo(balance)}</strong>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/account/wallet')}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full bg-primary/10 hover:bg-primary/15 transition-colors font-bold text-primary',
        size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm',
        className,
      )}
      aria-label={`Wallet balance ${formatKobo(balance)}`}
    >
      {iconOnly ? (
        <>
          <Wallet className={cn(size === 'sm' ? 'h-4 w-4' : 'h-4.5 w-4.5')} strokeWidth={2} />
          <span>{formatKobo(balance)}</span>
        </>
      ) : (
        <>
          <span className={cn('rounded-full bg-primary', size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
          <span>Wallet: {formatKobo(balance)}</span>
          <ChevronRight className={cn('opacity-70', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} strokeWidth={2.5} />
        </>
      )}
    </button>
  );
}
