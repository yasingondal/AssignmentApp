import { create } from 'zustand';
import { storage } from '@/core/storage/storage';
import { calculateCartTotals, type CartLineItem } from '@/core/utils/currency';
import type { CartProductSnapshot } from '@/features/shop/domain/types';

const CART_KEY = 'cart';

interface CartState {
  items: CartProductSnapshot[];
  hasHydrated: boolean;
  addItem: (product: Omit<CartProductSnapshot, 'quantity'>, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotals: () => ReturnType<typeof calculateCartTotals>;
  getItemCount: () => number;
  hydrate: () => Promise<void>;
}

function isValidCartItem(value: unknown): value is CartProductSnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Partial<CartProductSnapshot>;
  return (
    typeof item.productId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.image === 'string' &&
    typeof item.unitPrice === 'number' &&
    typeof item.discountPercent === 'number' &&
    typeof item.quantity === 'number' &&
    typeof item.stock === 'number' &&
    item.quantity > 0
  );
}

function sanitizeItems(raw: unknown): CartProductSnapshot[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(isValidCartItem).map(item => ({
    productId: item.productId,
    name: item.name,
    image: item.image,
    brand: item.brand,
    category: item.category,
    unitPrice: item.unitPrice,
    discountPercent: item.discountPercent,
    quantity: Math.min(item.quantity, Math.max(1, item.stock)),
    stock: item.stock,
  }));
}

function readPersistedItems(saved: unknown): CartProductSnapshot[] {
  const direct = sanitizeItems(saved);
  if (direct.length > 0) {
    return direct;
  }

  // Migrate previous Zustand persist shape: { state: { items: [...] }, version }
  if (saved && typeof saved === 'object' && 'state' in saved) {
    const nested = (saved as { state?: { items?: unknown } }).state?.items;
    return sanitizeItems(nested);
  }

  return [];
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  hasHydrated: false,

  addItem: async (product, quantity = 1) => {
    const existing = get().items.find(i => i.productId === product.productId);
    const nextItems = existing
      ? get().items.map(i =>
          i.productId === product.productId
            ? { ...i, ...product, quantity: Math.min(i.quantity + quantity, product.stock) }
            : i,
        )
      : [...get().items, { ...product, quantity: Math.min(quantity, product.stock) }];
    set({ items: nextItems });
    await storage.set(CART_KEY, nextItems);
  },

  removeItem: async (productId) => {
    const nextItems = get().items.filter(i => i.productId !== productId);
    set({ items: nextItems });
    await storage.set(CART_KEY, nextItems);
  },

  updateQuantity: async (productId, quantity) => {
    const nextItems = get().items
      .map(i => {
        if (i.productId !== productId) {
          return i;
        }
        const qty = Math.max(0, Math.min(quantity, i.stock));
        return qty === 0 ? null : { ...i, quantity: qty };
      })
      .filter((i): i is CartProductSnapshot => i !== null);
    set({ items: nextItems });
    await storage.set(CART_KEY, nextItems);
  },

  clearCart: async () => {
    set({ items: [] });
    await storage.set(CART_KEY, []);
  },

  getTotals: () => {
    const lineItems: CartLineItem[] = get().items.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountPercent: i.discountPercent,
    }));
    return calculateCartTotals(lineItems);
  },

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  hydrate: async () => {
    const saved = await storage.get<unknown>(CART_KEY);
    const items = readPersistedItems(saved);
    if (items.length > 0 && !Array.isArray(saved)) {
      await storage.set(CART_KEY, items);
    }
    set({ items, hasHydrated: true });
  },
}));
