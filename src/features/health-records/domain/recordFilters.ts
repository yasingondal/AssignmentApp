import { parseDateParts } from '@/core/utils/dateGrouping';
import type { HealthRecord, HealthRecordFilters } from '@/features/health-records/domain/types';

/** Newest-first years available on the patient timeline. */
export const TIMELINE_FILTER_YEARS = [2026, 2025, 2024, 2023, 2022, 2021] as const;

export const MONTH_FILTER_OPTIONS: { month: number; label: string }[] = [
  { month: 0, label: 'Jan' },
  { month: 1, label: 'Feb' },
  { month: 2, label: 'Mar' },
  { month: 3, label: 'Apr' },
  { month: 4, label: 'May' },
  { month: 5, label: 'Jun' },
  { month: 6, label: 'Jul' },
  { month: 7, label: 'Aug' },
  { month: 8, label: 'Sep' },
  { month: 9, label: 'Oct' },
  { month: 10, label: 'Nov' },
  { month: 11, label: 'Dec' },
];

export function filterHealthRecords(
  records: HealthRecord[],
  filters: HealthRecordFilters,
): HealthRecord[] {
  let result = records;

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter(
      r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.provider?.toLowerCase().includes(q) ?? false) ||
        r.tags.some(t => t.toLowerCase().includes(q)),
    );
  }

  if (filters.type) {
    result = result.filter(r => r.type === filters.type);
  }

  if (filters.year != null) {
    result = result.filter(r => parseDateParts(r.date).year === filters.year);
  }

  if (filters.month != null) {
    result = result.filter(r => parseDateParts(r.date).month === filters.month);
  }

  if (filters.startDate) {
    result = result.filter(r => r.date >= filters.startDate!);
  }

  if (filters.endDate) {
    result = result.filter(r => r.date <= filters.endDate!);
  }

  if (filters.tags?.length) {
    result = result.filter(r => filters.tags!.some(t => r.tags.includes(t)));
  }

  return result;
}

export function getAllTags(records: HealthRecord[]): string[] {
  const tagSet = new Set<string>();
  for (const r of records) {
    for (const t of r.tags) {
      tagSet.add(t);
    }
  }
  return Array.from(tagSet).sort();
}
