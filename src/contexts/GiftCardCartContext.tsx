import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import type { ConfiguredGiftCard } from '@/pages/GiftCardDetailsV2';

const GIFT_CARD_CART_KEY = 'nesta_gift_card_cart';
const CART_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

interface StoredCart {
  cards: ConfiguredGiftCard[];
  savedAt: number;
}

function loadCart(): ConfiguredGiftCard[] {
  try {
    const raw = localStorage.getItem(GIFT_CARD_CART_KEY);
    if (!raw) return [];
    const { cards, savedAt }: StoredCart = JSON.parse(raw);
    if (Date.now() - savedAt > CART_TTL_MS) {
      localStorage.removeItem(GIFT_CARD_CART_KEY);
      return [];
    }
    return cards;
  } catch {
    return [];
  }
}

function saveCart(cards: ConfiguredGiftCard[]) {
  if (cards.length === 0) {
    localStorage.removeItem(GIFT_CARD_CART_KEY);
  } else {
    localStorage.setItem(GIFT_CARD_CART_KEY, JSON.stringify({ cards, savedAt: Date.now() } satisfies StoredCart));
  }
}

interface GiftCardCartContextType {
  cards: ConfiguredGiftCard[];
  addCards: (cards: ConfiguredGiftCard[]) => void;
  removeCard: (id: string) => void;
  clearCart: () => void;
  totalAmount: number;
}

const GiftCardCartContext = createContext<GiftCardCartContextType | undefined>(undefined);

export function GiftCardCartProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<ConfiguredGiftCard[]>(() => loadCart());

  useEffect(() => {
    saveCart(cards);
  }, [cards]);

  const addCards = useCallback((incoming: ConfiguredGiftCard[]) => {
    setCards(incoming);
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    localStorage.removeItem(GIFT_CARD_CART_KEY);
    setCards([]);
  }, []);

  const totalAmount = useMemo(() => cards.reduce((s, c) => s + c.amount, 0), [cards]);

  const value = useMemo(
    () => ({ cards, addCards, removeCard, clearCart, totalAmount }),
    [cards, addCards, removeCard, clearCart, totalAmount],
  );

  return <GiftCardCartContext.Provider value={value}>{children}</GiftCardCartContext.Provider>;
}

export function useGiftCardCart() {
  const ctx = useContext(GiftCardCartContext);
  if (!ctx) throw new Error('useGiftCardCart must be used within GiftCardCartProvider');
  return ctx;
}
