import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from "react";
import { addDays } from "date-fns";

export const SUBSCRIPTION_DISCOUNT = 0.05; // 5%

export function calculateSubscriptionPrice(basePrice: number): number {
  return Math.round(basePrice * (1 - SUBSCRIPTION_DISCOUNT));
}

export interface CartItem {
  variantId: string; // Variant ID from API
  productId: string;
  productName: string;
  brand: string;
  slug: string;
  // Legacy fields for backwards compatibility
  typeId: string;
  typeName: string;
  sizeId?: string;
  sizeName?: string;
  // New API fields
  attributes?: Array<{ attributeName: string; value: string; displayValue: string }>;
  quantity: number;
  unitPrice: number;
  image?: string;
  // Subscription fields
  isAutoRenew?: boolean;
  frequencyWeeks?: number; // 2-8 weeks
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  isCartOpen: boolean;
  subscriptionStartDate: Date;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  updateQuantity: (productId: string, typeId: string, sizeId: string | undefined, quantity: number) => void;
  removeFromCart: (productId: string, typeId: string, sizeId: string | undefined) => void;
  clearCart: () => void;
  setSubscriptionStartDate: (date: Date) => void;
  setItemAutoRenew: (productId: string, typeId: string, sizeId: string | undefined, isAutoRenew: boolean, frequencyWeeks?: number) => void;
  setAllItemsAutoRenew: (isAutoRenew: boolean, frequencyWeeks?: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getItemKey(productId: string, typeId: string, sizeId: string | undefined): string {
  return `${productId}-${typeId}-${sizeId || 'no-size'}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [subscriptionStartDate, setSubscriptionStartDateState] = useState<Date>(() => addDays(new Date(), 1));

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [items]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, quantity: number) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.productId === item.productId && i.typeId === item.typeId && i.sizeId === item.sizeId
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [...prev, { ...item, quantity }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, typeId: string, sizeId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, typeId, sizeId);
      return;
    }

    setItems(prev =>
      prev.map(item =>
        item.productId === productId && item.typeId === typeId && item.sizeId === sizeId
          ? { ...item, quantity }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string, typeId: string, sizeId: string | undefined) => {
    setItems(prev =>
      prev.filter(
        item => !(item.productId === productId && item.typeId === typeId && item.sizeId === sizeId)
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const setSubscriptionStartDate = useCallback((date: Date) => {
    setSubscriptionStartDateState(date);
  }, []);

  const setItemAutoRenew = useCallback((
    productId: string,
    typeId: string,
    sizeId: string | undefined,
    isAutoRenew: boolean,
    frequencyWeeks?: number
  ) => {
    setItems(prev =>
      prev.map(item =>
        item.productId === productId && item.typeId === typeId && item.sizeId === sizeId
          ? { ...item, isAutoRenew, frequencyWeeks: isAutoRenew ? (frequencyWeeks ?? 4) : undefined }
          : item
      )
    );
  }, []);

  const setAllItemsAutoRenew = useCallback((isAutoRenew: boolean, frequencyWeeks?: number) => {
    setItems(prev =>
      prev.map(item => ({
        ...item,
        isAutoRenew,
        frequencyWeeks: isAutoRenew ? (frequencyWeeks ?? 4) : undefined,
      }))
    );
  }, []);

  const value = useMemo(() => ({
    items,
    itemCount,
    totalAmount,
    isCartOpen,
    subscriptionStartDate,
    openCart,
    closeCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setSubscriptionStartDate,
    setItemAutoRenew,
    setAllItemsAutoRenew,
  }), [items, itemCount, totalAmount, isCartOpen, subscriptionStartDate, openCart, closeCart, addToCart, updateQuantity, removeFromCart, clearCart, setSubscriptionStartDate, setItemAutoRenew, setAllItemsAutoRenew]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
