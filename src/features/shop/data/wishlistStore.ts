import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WishlistState {
  productIds: string[];
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],

      toggle: (productId) => {
        set(state => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter(id => id !== productId)
            : [...state.productIds, productId],
        }));
      },

      isWishlisted: (productId) => get().productIds.includes(productId),

      clear: () => set({ productIds: [] }),
    }),
    {
      name: '@amrutam:wishlist',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
