import type { WalletTransaction } from '@/lib/api';

export function formatKobo(kobo: number): string {
  const naira = kobo / 100;
  return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

export function transactionLabel(tx: WalletTransaction): string {
  switch (tx.source) {
    case 'cashback': return `Cashback${tx.orderNumber ? ` — ${tx.orderNumber}` : ''}`;
    case 'referral': return 'Referral reward';
    case 'checkout_redemption': return `Used at checkout${tx.orderNumber ? ` — ${tx.orderNumber}` : ''}`;
    case 'gift_card_redemption': return 'Gift card redeemed';
    case 'admin_adjustment': return tx.description || 'Admin adjustment';
    default: return tx.description || tx.source;
  }
}

export function transactionSign(tx: WalletTransaction): string {
  return tx.type === 'credit' ? '+' : '−';
}

export function transactionColor(tx: WalletTransaction): string {
  return tx.type === 'credit' ? 'text-emerald-700' : 'text-muted-foreground';
}

export function referralLink(code: string): string {
  return `${window.location.origin}?ref=${code}`;
}

export function getReferralCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)nesta_ref=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setReferralCookie(code: string): void {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `nesta_ref=${encodeURIComponent(code)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function clearReferralCookie(): void {
  document.cookie = 'nesta_ref=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
}
