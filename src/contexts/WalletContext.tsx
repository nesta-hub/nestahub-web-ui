import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  INITIAL_BALANCE,
  INITIAL_TRANSACTIONS,
  WalletTransaction,
} from "@/components/wallet/mockWalletData";

interface WalletState {
  balance: number;
  transactions: WalletTransaction[];
}

interface WalletContextValue extends WalletState {
  applyToOrder: (amount: number, orderRef?: string) => void;
  creditWallet: (amount: number, label: string) => void;
}

const STORAGE_KEY = "nesta-wallet-v2";

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

function loadInitial(): WalletState {
  if (typeof window === "undefined") {
    return { balance: INITIAL_BALANCE, transactions: INITIAL_TRANSACTIONS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WalletState;
      if (typeof parsed.balance === "number" && Array.isArray(parsed.transactions)) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return { balance: INITIAL_BALANCE, transactions: INITIAL_TRANSACTIONS };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const applyToOrder = (amount: number, orderRef?: string) => {
    if (amount <= 0) return;
    setState((prev) => {
      const debit = Math.min(amount, prev.balance);
      const newBalance = prev.balance - debit;
      const tx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        type: "debit",
        label: orderRef
          ? `Wallet credit applied to ${orderRef}`
          : "Wallet credit applied",
        amount: debit,
        date: new Date().toISOString(),
        balanceAfter: newBalance,
      };
      return { balance: newBalance, transactions: [tx, ...prev.transactions] };
    });
  };

  const creditWallet = (amount: number, label: string) => {
    if (amount <= 0) return;
    setState((prev) => {
      const newBalance = prev.balance + amount;
      const tx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        type: "credit",
        label,
        amount,
        date: new Date().toISOString(),
        balanceAfter: newBalance,
      };
      return { balance: newBalance, transactions: [tx, ...prev.transactions] };
    });
  };

  return (
    <WalletContext.Provider value={{ ...state, applyToOrder, creditWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
