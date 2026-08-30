import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCartStore } from '@/features/shop/data/cartStore';

describe('cartStore persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useCartStore.setState({ items: [], hasHydrated: false });
  });

  it('persists cart items locally and restores them on hydrate', async () => {
    await useCartStore.getState().addItem({
      productId: 'prod-1',
      name: 'Ashwagandha',
      image: 'https://example.com/a.jpg',
      brand: 'Amrutam',
      category: 'Herbal Supplements',
      unitPrice: 499,
      discountPercent: 10,
      stock: 5,
    }, 2);

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().getItemCount()).toBe(2);

    useCartStore.setState({ items: [], hasHydrated: false });
    await useCartStore.getState().hydrate();

    const restored = useCartStore.getState().items;
    expect(restored).toHaveLength(1);
    expect(restored[0]).toMatchObject({
      productId: 'prod-1',
      name: 'Ashwagandha',
      quantity: 2,
      unitPrice: 499,
    });
    expect(useCartStore.getState().hasHydrated).toBe(true);
  });

  it('persists quantity updates and removals', async () => {
    await useCartStore.getState().addItem({
      productId: 'prod-2',
      name: 'Triphala',
      image: 'https://example.com/b.jpg',
      unitPrice: 299,
      discountPercent: 0,
      stock: 10,
    });
    await useCartStore.getState().updateQuantity('prod-2', 4);

    useCartStore.setState({ items: [], hasHydrated: false });
    await useCartStore.getState().hydrate();
    expect(useCartStore.getState().items[0]?.quantity).toBe(4);

    await useCartStore.getState().removeItem('prod-2');
    useCartStore.setState({ items: [{ productId: 'stale' } as never], hasHydrated: false });
    await useCartStore.getState().hydrate();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
