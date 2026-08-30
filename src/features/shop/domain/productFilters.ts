import { calculateDiscountedPrice } from '@/core/utils/currency';
import type { Product, ProductFilters, SortOption } from '@/features/shop/domain/types';

function sellingPrice(product: Product): number {
  return calculateDiscountedPrice(product.price, product.discount);
}

function compareId(a: { id: string }, b: { id: string }): number {
  return a.id.localeCompare(b.id);
}

export function hasProductFilters(filters: ProductFilters): boolean {
  return Boolean(
    filters.search?.trim() ||
    filters.category ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minRating !== undefined ||
    filters.brand ||
    filters.availabilityOnly ||
    (filters.tags && filters.tags.length > 0),
  );
}

export function productMatchesFilters(product: Product, filters: ProductFilters): boolean {
  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q) ||
      product.brand.toLowerCase().includes(q) ||
      product.tags.some(t => t.toLowerCase().includes(q));
    if (!matchesSearch) {
      return false;
    }
  }

  if (filters.category && product.category !== filters.category) {
    return false;
  }
  if (filters.minPrice !== undefined && product.price < filters.minPrice) {
    return false;
  }
  if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
    return false;
  }
  if (filters.minRating !== undefined && product.rating < filters.minRating) {
    return false;
  }
  if (filters.brand && product.brand !== filters.brand) {
    return false;
  }
  if (filters.availabilityOnly && !(product.availability && product.stock > 0)) {
    return false;
  }
  if (filters.tags?.length && !filters.tags.some(t => product.tags.includes(t))) {
    return false;
  }

  return true;
}

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  if (!hasProductFilters(filters)) {
    return products;
  }
  return products.filter(product => productMatchesFilters(product, filters));
}

export function sortProducts(products: Product[], sort: SortOption): Product[] {
  const copy = [...products];
  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => sellingPrice(a) - sellingPrice(b) || compareId(a, b));
    case 'price_desc':
      return copy.sort((a, b) => sellingPrice(b) - sellingPrice(a) || compareId(a, b));
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating || compareId(a, b));
    case 'popularity':
      return copy.sort((a, b) => b.popularity - a.popularity || compareId(a, b));
    case 'newest':
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || compareId(a, b),
      );
    default:
      return copy;
  }
}
