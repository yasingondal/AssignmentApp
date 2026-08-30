import { getProductsPage } from '@/features/shop/data/productPagination';
import { getProductById } from '@/features/shop/data/productGenerator';
import { ValidationError } from '@/core/errors/AppError';
import type { ProductFilters, SortOption } from '@/features/shop/domain/types';
import type { ApiRequestConfig } from '@/core/api/apiClient';

export async function handleShopApi(
  endpoint: string,
  _config: ApiRequestConfig,
): Promise<unknown> {
  const listMatch = endpoint.match(/^\/products\?/);
  const detailMatch = endpoint.match(/^\/products\/(prod-\d+)$/);

  if (listMatch) {
    const params = new URLSearchParams(endpoint.split('?')[1]);
    const page = parseInt(params.get('page') ?? '1', 10);
    const pageSize = parseInt(params.get('pageSize') ?? '20', 10);
    const filters = JSON.parse(params.get('filters') ?? '{}') as ProductFilters;
    const sort = (params.get('sort') ?? 'popularity') as SortOption;
    return getProductsPage(filters, sort, page, pageSize);
  }

  if (detailMatch) {
    const product = getProductById(detailMatch[1]!);
    if (!product) {
      throw new ValidationError('Product not found');
    }
    return product;
  }

  throw new ValidationError(`Unknown shop endpoint: ${endpoint}`);
}
