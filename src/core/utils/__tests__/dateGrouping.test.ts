import {
  formatDate,
  groupByMonth,
  groupByYearThenMonth,
  isSlotExpired,
  parseDateParts,
} from '@/core/utils/dateGrouping';

describe('dateGrouping', () => {
  it('groups records by month/year newest first starting from 2026', () => {
    const items = [
      { id: '1', date: '2026-08-15' },
      { id: '2', date: '2026-08-20' },
      { id: '3', date: '2026-07-10' },
      { id: '4', date: '2025-12-01' },
    ];
    const grouped = groupByMonth(items);
    expect(grouped).toHaveLength(3);
    expect(grouped[0]).toMatchObject({ monthLabel: 'August', year: 2026 });
    expect(grouped[0]!.items.map(item => item.id)).toEqual(['2', '1']);
    expect(grouped[1]).toMatchObject({ monthLabel: 'July', year: 2026 });
    expect(grouped[2]).toMatchObject({ monthLabel: 'December', year: 2025 });
  });

  it('orders year groups descending from 2026', () => {
    const items = [
      { id: '1', date: '2026-08-15' },
      { id: '2', date: '2026-01-05' },
      { id: '3', date: '2025-11-10' },
      { id: '4', date: '2024-03-01' },
    ];
    const grouped = groupByYearThenMonth(items);
    expect(grouped.map(g => g.year)).toEqual([2026, 2025, 2024]);
    expect(grouped[0]!.months[0]!.monthLabel).toBe('August');
  });

  it('parses YYYY-MM-DD without timezone month shift', () => {
    expect(parseDateParts('2026-01-01')).toEqual({ year: 2026, month: 0, day: 1 });
    expect(parseDateParts('2025-12-31')).toEqual({ year: 2025, month: 11, day: 31 });
    expect(formatDate('2026-08-09')).toBe('9 Aug 2026');
  });

  it('detects expired slots', () => {
    expect(isSlotExpired('2020-01-01T10:00:00')).toBe(true);
    expect(isSlotExpired('2099-01-01T10:00:00')).toBe(false);
  });
});
