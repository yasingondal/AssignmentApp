import { calculateCartTotals, calculateDiscountedPrice, formatCurrency } from '@/core/utils/currency';

describe('currency utils', () => {
  it('calculates discounted price', () => {
    expect(calculateDiscountedPrice(1000, 20)).toBe(800);
    expect(calculateDiscountedPrice(1000, 0)).toBe(1000);
  });

  it('calculates cart totals', () => {
    const totals = calculateCartTotals([
      { productId: '1', quantity: 2, unitPrice: 100, discountPercent: 10 },
      { productId: '2', quantity: 1, unitPrice: 500, discountPercent: 0 },
    ]);
    expect(totals.subtotal).toBe(700);
    expect(totals.discount).toBe(20);
    expect(totals.total).toBe(680);
    expect(totals.itemCount).toBe(3);
  });

  it('formats currency', () => {
    expect(formatCurrency(1500)).toContain('1,500');
  });
});
