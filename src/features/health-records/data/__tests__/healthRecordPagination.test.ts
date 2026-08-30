import { getHealthRecordsPage } from '@/features/health-records/data/healthRecordPagination';

describe('healthRecordPagination', () => {
  it('returns first page without materializing all records', () => {
    const start = Date.now();
    const result = getHealthRecordsPage({}, 1, 50);
    const elapsed = Date.now() - start;

    expect(result.data).toHaveLength(50);
    expect(result.hasMore).toBe(true);
    expect(elapsed).toBeLessThan(2000);
  });

  it('filters by record type', () => {
    const result = getHealthRecordsPage({ type: 'lab_report' }, 1, 20);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every(record => record.type === 'lab_report')).toBe(true);
  });

  it('returns records starting from 2026 in descending date order', () => {
    const page = getHealthRecordsPage({}, 1, 50);
    expect(page.data[0]!.date.startsWith('2026')).toBe(true);
    for (let i = 1; i < page.data.length; i++) {
      expect(page.data[i]!.date <= page.data[i - 1]!.date).toBe(true);
    }
  });
});
