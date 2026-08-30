export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  return {
    data,
    total: items.length,
    page,
    pageSize,
    hasMore: start + pageSize < items.length,
  };
}
