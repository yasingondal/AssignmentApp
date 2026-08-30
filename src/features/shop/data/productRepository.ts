import { apiClient } from '@/core/api/apiClient';
import type { PaginatedResponse } from '@/core/api/types';
import { cache } from '@/core/storage/cache';
import { networkService } from '@/core/network/networkService';
import { getProductsPage } from '@/features/shop/data/productPagination';
import { getProductById } from '@/features/shop/data/productGenerator';
import type { Product, ProductFilters, SortOption } from '@/features/shop/domain/types';

class ProductRepository {
  async getProducts(
    filters: ProductFilters,
    sort: SortOption,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResponse<Product>> {
    const cacheKey = `products:${JSON.stringify(filters)}:${sort}:${page}:${pageSize}`;

    if (!networkService.isOnline()) {
      const cached = await cache.getFreshOrStale<PaginatedResponse<Product>>(cacheKey);
      if (cached) {
        return cached;
      }
      return this.getProductsLocal(filters, sort, page, pageSize);
    }

    try {
      const result = await apiClient.get<PaginatedResponse<Product>>(
        `/products?page=${page}&pageSize=${pageSize}&filters=${encodeURIComponent(JSON.stringify(filters))}&sort=${sort}`,
      );
      await cache.set(cacheKey, result);
      return result;
    } catch {
      const cached = await cache.getFreshOrStale<PaginatedResponse<Product>>(cacheKey);
      if (cached) {
        return cached;
      }
      return this.getProductsLocal(filters, sort, page, pageSize);
    }
  }

  getProductsLocal(
    filters: ProductFilters,
    sort: SortOption,
    page: number,
    pageSize: number,
  ): PaginatedResponse<Product> {
    return getProductsPage(filters, sort, page, pageSize);
  }

  async getProductById(id: string): Promise<Product | null> {
    const cacheKey = `product:${id}`;

    if (!networkService.isOnline()) {
      const cached = await cache.getFreshOrStale<Product>(cacheKey);
      if (cached) {
        return cached;
      }
      return getProductById(id) ?? null;
    }

    try {
      const product = await apiClient.get<Product>(`/products/${id}`);
      await cache.set(cacheKey, product);
      return product;
    } catch {
      const cached = await cache.getFreshOrStale<Product>(cacheKey);
      if (cached) {
        return cached;
      }
      return getProductById(id) ?? null;
    }
  }
}

export const productRepository = new ProductRepository();
