import { filterHealthRecords, getAllTags } from '@/features/health-records/domain/recordFilters';
import { generateHealthRecord } from '@/features/health-records/data/recordGenerator';

describe('filterHealthRecords', () => {
  const records = [1, 2, 3, 4, 5].map(generateHealthRecord);

  it('filters by search query', () => {
    const title = records[0]!.title;
    const result = filterHealthRecords(records, { search: title.slice(0, 4) });
    expect(result.length).toBeGreaterThan(0);
  });

  it('filters by record type', () => {
    const type = records[0]!.type;
    const result = filterHealthRecords(records, { type });
    expect(result.every(r => r.type === type)).toBe(true);
  });

  it('filters by tags', () => {
    const tag = records[0]!.tags[0]!;
    const result = filterHealthRecords(records, { tags: [tag] });
    expect(result.every(r => r.tags.includes(tag))).toBe(true);
  });

  it('filters by start date', () => {
    const result = filterHealthRecords(records, { startDate: '2020-01-01' });
    expect(result.every(r => r.date >= '2020-01-01')).toBe(true);
  });

  it('filters by year and month', () => {
    const sample = records[0]!;
    const year = Number(sample.date.slice(0, 4));
    const month = Number(sample.date.slice(5, 7)) - 1;
    const byYear = filterHealthRecords(records, { year });
    expect(byYear.every(r => r.date.startsWith(String(year)))).toBe(true);
    const byMonth = filterHealthRecords(records, { year, month });
    expect(byMonth.every(r => {
      const m = Number(r.date.slice(5, 7)) - 1;
      return r.date.startsWith(String(year)) && m === month;
    })).toBe(true);
  });

  it('extracts all unique tags', () => {
    const tags = getAllTags(records);
    expect(tags.length).toBeGreaterThan(0);
    expect(new Set(tags).size).toBe(tags.length);
  });
});
