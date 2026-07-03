import { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from "react";
import { addDays } from "date-fns";

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
  subscriptionPrice?: number; // Custom subscription price from variant (in kobo)
  recommendedFrequencyWeeks?: number; // Recommended frequency from variant
  subscriptionId?: string; // ID of subscription being reordered (for preventing duplicates)
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
  updateQuantity: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  setSubscriptionStartDate: (date: Date) => void;
  setItemAutoRenew: (variantId: string, isAutoRenew: boolean, frequencyWeeks?: number) => void;
  setAllItemsAutoRenew: (isAutoRenew: boolean, frequencyWeeks?: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getItemKey(variantId: string): string {
  return variantId;
}

const CART_STORAGE_KEY = 'nesta_cart_items';
const SUBSCRIPTION_DATE_STORAGE_KEY = 'nesta_subscription_start_date';

// Helper to safely parse JSON from localStorage
function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

// Helper to safely save JSON to localStorage
function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage
  const [items, setItems] = useState<CartItem[]>(() =>
    loadFromLocalStorage<CartItem[]>(CART_STORAGE_KEY, [])
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [subscriptionStartDate, setSubscriptionStartDateState] = useState<Date>(() => {
    const savedDate = loadFromLocalStorage<string | null>(SUBSCRIPTION_DATE_STORAGE_KEY, null);
    return savedDate ? new Date(savedDate) : addDays(new Date(), 1);
  });

  // Sync cart items to localStorage whenever they change
  useEffect(() => {
    saveToLocalStorage(CART_STORAGE_KEY, items);
  }, [items]);

  // Sync subscription start date to localStorage whenever it changes
  useEffect(() => {
    saveToLocalStorage(SUBSCRIPTION_DATE_STORAGE_KEY, subscriptionStartDate.toISOString());
  }, [subscriptionStartDate]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      // Use subscription price if item is subscribed and has custom subscription price
      const itemPrice = item.isAutoRenew && item.subscriptionPrice
        ? item.subscriptionPrice
        : item.unitPrice;
      return sum + itemPrice * item.quantity;
    }, 0);
  }, [items]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, quantity: number) => {
    setItems(prev => {
      const key = getItemKey(item.variantId);
      const existingIndex = prev.findIndex(i => getItemKey(i.variantId) === key);

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

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    setItems(prev =>
      prev.map(item =>
        getItemKey(item.variantId) === getItemKey(variantId)
          ? { ...item, quantity }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback((variantId: string) => {
    setItems(prev =>
      prev.filter(item => getItemKey(item.variantId) !== getItemKey(variantId))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const setSubscriptionStartDate = useCallback((date: Date) => {
    setSubscriptionStartDateState(date);
  }, []);

  const setItemAutoRenew = useCallback((
    variantId: string,
    isAutoRenew: boolean,
    frequencyWeeks?: number
  ) => {
    setItems(prev =>
      prev.map(item =>
        getItemKey(item.variantId) === getItemKey(variantId)
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
