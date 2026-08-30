export interface GroupedByMonth<T> {
  year: number;
  month: number;
  monthLabel: string;
  items: T[];
}

export interface GroupedByYear<T> {
  year: number;
  months: GroupedByMonth<T>[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Parse YYYY-MM-DD without timezone shifting the calendar day. */
export function parseDateParts(date: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]) - 1,
      day: Number(match[3]),
    };
  }

  const fallback = new Date(date);
  return {
    year: fallback.getFullYear(),
    month: fallback.getMonth(),
    day: fallback.getDate(),
  };
}

function compareDateDesc(a: string, b: string): number {
  return b.localeCompare(a);
}

export function groupByMonthYear<T extends { date: string }>(
  items: T[],
): GroupedByMonth<T>[] {
  const map = new Map<string, GroupedByMonth<T>>();

  for (const item of items) {
    const { year, month } = parseDateParts(item.date);
    const key = `${year}-${month}`;

    if (!map.has(key)) {
      map.set(key, {
        year,
        month,
        monthLabel: MONTH_NAMES[month]!,
        items: [],
      });
    }
    map.get(key)!.items.push(item);
  }

  return Array.from(map.values())
    .map(group => ({
      ...group,
      items: [...group.items].sort((a, b) => compareDateDesc(a.date, b.date)),
    }))
    .sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });
}

/** Alias for timeline grouping */
export const groupByMonth = groupByMonthYear;

/** Nest month groups under years for timeline year → month headers. */
export function groupByYearThenMonth<T extends { date: string }>(
  items: T[],
): GroupedByYear<T>[] {
  const months = groupByMonthYear(items);
  const yearMap = new Map<number, GroupedByMonth<T>[]>();

  for (const monthGroup of months) {
    const list = yearMap.get(monthGroup.year) ?? [];
    list.push(monthGroup);
    yearMap.set(monthGroup.year, list);
  }

  return Array.from(yearMap.entries())
    .map(([year, monthGroups]) => ({ year, months: monthGroups }))
    .sort((a, b) => b.year - a.year);
}

export function formatDate(date: string): string {
  const { year, month, day } = parseDateParts(date);
  return `${day} ${MONTH_NAMES[month]!.slice(0, 3)} ${year}`;
}

export function isSlotExpired(slotDateTime: string): boolean {
  return new Date(slotDateTime).getTime() < Date.now();
}
