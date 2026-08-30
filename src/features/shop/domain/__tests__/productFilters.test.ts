import { calculateDiscountedPrice } from '@/core/utils/currency';
import { filterProducts, sortProducts } from '@/features/shop/domain/productFilters';
import { generateProduct } from '@/features/shop/data/productGenerator';

describe('productFilters', () => {
  const products = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(generateProduct);

  it('filters by search', () => {
    const result = filterProducts(products, { search: products[0]!.brand });
    expect(result.length).toBeGreaterThan(0);
  });

  it('filters by category', () => {
    const cat = products[0]!.category;
    const result = filterProducts(products, { category: cat });
    expect(result.every(p => p.category === cat)).toBe(true);
  });

  it('sorts by selling price ascending without mutating source', () => {
    const original = [...products];
    const sorted = sortProducts(products, 'price_asc');
    expect(products).toEqual(original);
    for (let i = 1; i < sorted.length; i++) {
      const prev = calculateDiscountedPrice(sorted[i - 1]!.price, sorted[i - 1]!.discount);
      const next = calculateDiscountedPrice(sorted[i]!.price, sorted[i]!.discount);
      expect(next).toBeGreaterThanOrEqual(prev);
    }
  });

  it('sorts by selling price descending', () => {
    const sorted = sortProducts(products, 'price_desc');
    for (let i = 1; i < sorted.length; i++) {
      const prev = calculateDiscountedPrice(sorted[i - 1]!.price, sorted[i - 1]!.discount);
      const next = calculateDiscountedPrice(sorted[i]!.price, sorted[i]!.discount);
      expect(next).toBeLessThanOrEqual(prev);
    }
  });

  it('sorts by rating descending', () => {
    const sorted = sortProducts(products, 'rating');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.rating).toBeLessThanOrEqual(sorted[i - 1]!.rating);
    }
  });

  it('sorts by popularity descending', () => {
    const sorted = sortProducts(products, 'popularity');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.popularity).toBeLessThanOrEqual(sorted[i - 1]!.popularity);
    }
  });

  it('sorts by newest first', () => {
    const sorted = sortProducts(products, 'newest');
    for (let i = 1; i < sorted.length; i++) {
      expect(new Date(sorted[i]!.createdAt).getTime()).toBeLessThanOrEqual(
        new Date(sorted[i - 1]!.createdAt).getTime(),
      );
    }
  });
});
