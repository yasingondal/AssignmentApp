import { getProductCatalog, getProductsPage } from '@/features/shop/data/productPagination';
import { calculateDiscountedPrice } from '@/core/utils/currency';

describe('productPagination', () => {
  it('returns different first-page order for each sort option', () => {
    const popularity = getProductsPage({}, 'popularity', 1, 20);
    const priceAsc = getProductsPage({}, 'price_asc', 1, 20);
    const priceDesc = getProductsPage({}, 'price_desc', 1, 20);
    const rating = getProductsPage({}, 'rating', 1, 20);
    const newest = getProductsPage({}, 'newest', 1, 20);

    expect(popularity.data).toHaveLength(20);
    expect(priceAsc.data[0]!.id).not.toBe(priceDesc.data[0]!.id);
    expect(popularity.data.map(p => p.id).join()).not.toBe(rating.data.map(p => p.id).join());
    expect(newest.data.map(p => p.id).join()).not.toBe(popularity.data.map(p => p.id).join());
  });

  it('sorts first page by selling price when price_asc is selected', () => {
    const page = getProductsPage({}, 'price_asc', 1, 20);
    for (let i = 1; i < page.data.length; i++) {
      const prev = calculateDiscountedPrice(page.data[i - 1]!.price, page.data[i - 1]!.discount);
      const next = calculateDiscountedPrice(page.data[i]!.price, page.data[i]!.discount);
      expect(next).toBeGreaterThanOrEqual(prev);
    }
  });

  it('sorts rating from high to low with mixed scores on the first page', () => {
    const page = getProductsPage({}, 'rating', 1, 20);
    for (let i = 1; i < page.data.length; i++) {
      expect(page.data[i]!.rating).toBeLessThanOrEqual(page.data[i - 1]!.rating);
    }
    expect(page.data[0]!.rating).toBe(5);
    expect(page.data[page.data.length - 1]!.rating).toBeLessThan(page.data[0]!.rating);
    expect(new Set(page.data.map(product => product.rating)).size).toBeGreaterThan(5);
  });

  it('uses the same catalog for filters and sorting', () => {
    const catalog = getProductCatalog();
    const ids = new Set(catalog.map(product => product.id));
    const sorted = getProductsPage({}, 'price_desc', 1, 20);
    const category = sorted.data[0]!.category;
    const filtered = getProductsPage({ category }, 'rating', 1, 20);

    expect(sorted.data.every(product => ids.has(product.id))).toBe(true);
    expect(filtered.data.every(product => ids.has(product.id) && product.category === category)).toBe(true);
  });

  it('reuses catalog so later sort pages are fast', () => {
    getProductsPage({}, 'popularity', 1, 20);
    getProductsPage({}, 'price_asc', 1, 20);
    getProductsPage({}, 'rating', 1, 20);
    getProductsPage({}, 'newest', 1, 20);
    const start = Date.now();
    getProductsPage({}, 'price_asc', 1, 20);
    getProductsPage({}, 'rating', 1, 20);
    getProductsPage({}, 'newest', 1, 20);
    expect(Date.now() - start).toBeLessThan(50);
  });
});
