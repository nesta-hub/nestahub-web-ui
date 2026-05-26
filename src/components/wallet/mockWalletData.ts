export type WalletTransactionType = "credit" | "debit";

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  label: string;
  amount: number;
  date: string; // ISO
  balanceAfter: number;
}

export const INITIAL_BALANCE = 1250;

// Seeded sample history — credits only so the "Used" tab shows the empty state
export const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "tx-4",
    type: "credit",
    label: "Cashback from order #NH-2041",
    amount: 425,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    balanceAfter: 1250,
  },
  {
    id: "tx-3",
    type: "credit",
    label: "Cashback from order #NH-2032",
    amount: 350,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    balanceAfter: 825,
  },
  {
    id: "tx-2",
    type: "credit",
    label: "Welcome bonus",
    amount: 200,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    balanceAfter: 475,
  },
  {
    id: "tx-1",
    type: "credit",
    label: "Cashback from order #NH-2010",
    amount: 275,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 32).toISOString(),
    balanceAfter: 275,
  },
];
