import type { PaginatedResponse } from '@/core/api/types';
import {
  hasProductFilters,
  productMatchesFilters,
  sortProducts,
} from '@/features/shop/domain/productFilters';
import type { Product, ProductFilters, SortOption } from '@/features/shop/domain/types';
import { generateProduct, getAllProductIndices } from '@/features/shop/data/productGenerator';

const SORT_OPTIONS: SortOption[] = ['popularity', 'price_asc', 'price_desc', 'rating', 'newest'];

let catalog: Product[] | null = null;
const sortedIndicesBySort = new Map<SortOption, number[]>();

function getCatalog(): Product[] {
  if (!catalog) {
    catalog = getAllProductIndices().map(generateProduct);
  }
  return catalog;
}

export function getProductCatalog(): Product[] {
  return getCatalog();
}

function getSortedIndices(sort: SortOption): number[] {
  const cached = sortedIndicesBySort.get(sort);
  if (cached) {
    return cached;
  }

  const products = getCatalog();
  const option = SORT_OPTIONS.includes(sort) ? sort : 'popularity';
  const sorted = sortProducts(products, option);
  const indices = sorted.map(product => Number(product.id.slice(5)) - 1);
  sortedIndicesBySort.set(option, indices);
  return indices;
}

export function getProductsPage(
  filters: ProductFilters,
  sort: SortOption,
  page: number,
  pageSize: number,
): PaginatedResponse<Product> {
  const products = getCatalog();
  const ordered = getSortedIndices(sort);
  const skip = (page - 1) * pageSize;

  if (!hasProductFilters(filters)) {
    return {
      data: ordered.slice(skip, skip + pageSize).map(index => products[index]!),
      total: products.length,
      page,
      pageSize,
      hasMore: skip + pageSize < products.length,
    };
  }

  const data: Product[] = [];
  let matchCount = 0;
  for (const index of ordered) {
    const product = products[index]!;
    if (!productMatchesFilters(product, filters)) {
      continue;
    }
    if (matchCount >= skip && data.length < pageSize) {
      data.push(product);
    }
    matchCount++;
  }

  return {
    data,
    total: matchCount,
    page,
    pageSize,
    hasMore: matchCount > skip + data.length,
  };
}
