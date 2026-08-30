import type { PaginatedResponse } from '@/core/api/types';
import { filterHealthRecords } from '@/features/health-records/domain/recordFilters';
import type { HealthRecord, HealthRecordFilters } from '@/features/health-records/domain/types';
import { generateHealthRecord, getAllRecordIndices, clearHealthRecordCache } from '@/features/health-records/data/recordGenerator';

let sortedIndicesByDate: number[] | null = null;

export function clearHealthRecordSortCache(): void {
  sortedIndicesByDate = null;
  clearHealthRecordCache();
}

function getSortedIndicesByDate(): number[] {
  if (!sortedIndicesByDate) {
    sortedIndicesByDate = getAllRecordIndices().sort((a, b) => {
      const dateA = generateHealthRecord(a).date;
      const dateB = generateHealthRecord(b).date;
      // Newest first: 2026 → 2025 → …
      return dateB.localeCompare(dateA);
    });
  }
  return sortedIndicesByDate;
}

// Ensure regenerated dates (starting 2026) are used after generator updates.
clearHealthRecordSortCache();

/** Paginate health records without materializing the full filtered dataset in memory. */
export function getHealthRecordsPage(
  filters: HealthRecordFilters,
  page: number,
  pageSize: number,
): PaginatedResponse<HealthRecord> {
  const sorted = getSortedIndicesByDate();
  const skip = (page - 1) * pageSize;
  const data: HealthRecord[] = [];
  let matchCount = 0;

  for (const index of sorted) {
    const record = generateHealthRecord(index);
    if (filterHealthRecords([record], filters).length === 0) {
      continue;
    }

    if (matchCount >= skip && data.length < pageSize) {
      data.push(record);
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
