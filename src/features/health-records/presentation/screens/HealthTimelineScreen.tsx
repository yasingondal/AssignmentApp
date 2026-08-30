import { useCallback, useMemo, useState, memo } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Text, SearchInput, EmptyState, ErrorState, ScreenContainer, Button, ScreenHeader, ListShimmer, Card, Badge,
} from '@/design-system/components';
import { useDebouncedValue } from '@/core/utils/debounce';
import { healthRecordRepository } from '@/features/health-records/data/healthRecordRepository';
import { groupByYearThenMonth } from '@/core/utils/dateGrouping';
import type { HealthRecord, HealthRecordFilters, RecordType } from '@/features/health-records/domain/types';
import { RECORD_TYPE_LABELS, RECORD_TYPES } from '@/features/health-records/domain/types';
import {
  HEALTH_TAG_POOL,
  RECORD_TYPE_COLORS,
  RECORD_TYPE_ICONS,
} from '@/features/health-records/domain/constants';
import {
  MONTH_FILTER_OPTIONS,
  TIMELINE_FILTER_YEARS,
} from '@/features/health-records/domain/recordFilters';
import type { HealthStackParamList } from '@/app/navigation/types';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useTheme } from '@/design-system/theme/ThemeContext';
import { FilterChipBar } from '@/shared/components/FilterChipBar';
import { HealthRecordItem } from '@/features/health-records/presentation/components/HealthRecordItem';
import { FilterPanel, ActiveFiltersBar } from '@/shared/components/FilterPanel';
import { useCollapsibleFilters } from '@/shared/hooks/useCollapsibleFilters';
import { useDeferredFilterState, useFilterApplyCompletion } from '@/shared/hooks/useDeferredFilterState';

const PAGE_SIZE = 50;

const TYPE_SHORT_LABELS: Record<RecordType, string> = {
  lab_report: 'Lab',
  prescription: 'Rx',
  consultation: 'Visit',
  vaccination: 'Vax',
  allergy: 'Allergy',
};

type TimelineRow =
  | { kind: 'year'; id: string; year: number; count: number }
  | { kind: 'month'; id: string; title: string; count: number }
  | { kind: 'record'; id: string; record: HealthRecord; index: number };

type HealthPanelFilters = {
  typeFilter?: RecordType;
  selectedTags: string[];
  selectedYear?: number;
  selectedMonth?: number;
};

const EMPTY_PANEL_FILTERS: HealthPanelFilters = {
  typeFilter: undefined,
  selectedTags: [],
  selectedYear: undefined,
  selectedMonth: undefined,
};

function countTagFilters(state: HealthPanelFilters): number {
  return state.selectedTags.length;
}

function countMonthYearFilters(state: HealthPanelFilters): number {
  return (state.selectedYear != null ? 1 : 0) + (state.selectedMonth != null ? 1 : 0);
}

function buildActiveChips(state: HealthPanelFilters) {
  const chips: { id: string; label: string }[] = [];
  if (state.selectedYear != null && state.selectedMonth != null) {
    const monthLabel = MONTH_FILTER_OPTIONS.find(m => m.month === state.selectedMonth)?.label;
    chips.push({ id: 'monthYear', label: `${monthLabel} ${state.selectedYear}` });
  } else if (state.selectedYear != null) {
    chips.push({ id: 'year', label: String(state.selectedYear) });
  } else if (state.selectedMonth != null) {
    const monthLabel = MONTH_FILTER_OPTIONS.find(m => m.month === state.selectedMonth)?.label;
    chips.push({ id: 'month', label: monthLabel ?? 'Month' });
  }
  state.selectedTags.forEach(t => chips.push({ id: `tag:${t}`, label: t }));
  return chips;
}

const YearSectionHeader = memo(function YearSectionHeader({ year, count }: { year: number; count: number }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.yearWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]}>
      <View>
        <Text variant="caption" color="muted">Year</Text>
        <Text variant="h2" style={{ color: theme.colors.primary }}>{year}</Text>
      </View>
      <View style={[styles.sectionCount, { backgroundColor: theme.colors.accentMuted }]}>
        <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '700' }}>
          {count} record{count === 1 ? '' : 's'}
        </Text>
      </View>
    </View>
  );
});

const MonthSectionHeader = memo(function MonthSectionHeader({ title, count }: { title: string; count: number }) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionWrap}>
      <View style={[styles.sectionLine, { backgroundColor: theme.colors.accent }]} />
      <Text variant="label" style={[styles.sectionTitle, { color: theme.colors.primary, flex: 1 }]}>
        {title}
      </Text>
      <View style={[styles.sectionCount, { backgroundColor: theme.colors.surfaceMuted }]}>
        <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '700' }}>
          {count}
        </Text>
      </View>
    </View>
  );
});

function SummaryStat({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceMuted }]}>
      <Text variant="h3" style={{ color: theme.colors.primary }}>{value}</Text>
      <Text variant="caption" color="muted" numberOfLines={1}>{label}</Text>
    </View>
  );
}

export function HealthTimelineScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HealthStackParamList>>();
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const {
    showFilters: showTagFilters,
    toggleFilters: toggleTagFilters,
    applyFilters: closeTagPanel,
    setShowFilters: setShowTagFilters,
  } = useCollapsibleFilters();
  const {
    showFilters: showMonthYearFilters,
    toggleFilters: toggleMonthYearFilters,
    applyFilters: closeMonthYearPanel,
    setShowFilters: setShowMonthYearFilters,
  } = useCollapsibleFilters();
  const {
    draft,
    applied,
    isApplying,
    syncDraftFromApplied,
    updateDraft,
    applyDraft,
    applyPatch,
    finishApplying,
  } = useDeferredFilterState(EMPTY_PANEL_FILTERS);
  const debouncedSearch = useDebouncedValue(search, 300);
  const networkStatus = useNetworkStatus();

  const filters: HealthRecordFilters = useMemo(
    () => ({
      search: debouncedSearch,
      type: applied.typeFilter,
      tags: applied.selectedTags.length ? applied.selectedTags : undefined,
      year: applied.selectedYear,
      month: applied.selectedMonth,
    }),
    [debouncedSearch, applied],
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching, isError, error, refetch } =
    useInfiniteQuery({
      queryKey: ['health-records', filters],
      queryFn: ({ pageParam }) =>
        healthRecordRepository.getRecords(filters, pageParam, PAGE_SIZE),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
      placeholderData: keepPreviousData,
    });

  useFilterApplyCompletion(isApplying, isFetching, isLoading, finishApplying);

  const records = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data]);
  const totalMatching = data?.pages[0]?.total ?? records.length;
  const groupedByYear = useMemo(() => groupByYearThenMonth(records), [records]);
  const monthCount = useMemo(
    () => groupedByYear.reduce((sum, yearGroup) => sum + yearGroup.months.length, 0),
    [groupedByYear],
  );
  const appliedTagCount = countTagFilters(applied);
  const draftTagCount = countTagFilters(draft);
  const appliedMonthYearCount = countMonthYearFilters(applied);
  const draftMonthYearCount = countMonthYearFilters(draft);
  const activeChips = useMemo(() => buildActiveChips(applied), [applied]);
  const showListShimmer = isApplying;
  const anyPanelOpen = showTagFilters || showMonthYearFilters;

  const typeCounts = useMemo(() => {
    const counts: Record<RecordType, number> = {
      lab_report: 0,
      prescription: 0,
      consultation: 0,
      vaccination: 0,
      allergy: 0,
    };
    for (const record of records) {
      counts[record.type] += 1;
    }
    return counts;
  }, [records]);

  const tagCount = useMemo(
    () => new Set(records.flatMap(r => r.tags)).size,
    [records],
  );

  const handleTypeFilter = useCallback((id: string) => {
    const nextType = id === 'all' ? undefined : (id as RecordType);
    applyPatch({ typeFilter: nextType === applied.typeFilter ? undefined : nextType });
  }, [applyPatch, applied.typeFilter]);

  const rows = useMemo(() => {
    const result: TimelineRow[] = [];
    for (const yearGroup of groupedByYear) {
      const yearRecordCount = yearGroup.months.reduce((sum, month) => sum + month.items.length, 0);
      result.push({
        kind: 'year',
        id: `year-${yearGroup.year}`,
        year: yearGroup.year,
        count: yearRecordCount,
      });
      for (const monthGroup of yearGroup.months) {
        result.push({
          kind: 'month',
          id: `month-${yearGroup.year}-${monthGroup.month}`,
          title: `${monthGroup.monthLabel} ${monthGroup.year}`,
          count: monthGroup.items.length,
        });
        monthGroup.items.forEach((record, index) => {
          result.push({
            kind: 'record',
            id: record.id,
            record,
            index,
          });
        });
      }
    }
    return result;
  }, [groupedByYear]);

  const handleRecordPress = useCallback(
    (recordId: string) => navigation.navigate('HealthRecordDetail', { recordId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: TimelineRow }) => {
      if (item.kind === 'year') {
        return <YearSectionHeader year={item.year} count={item.count} />;
      }
      if (item.kind === 'month') {
        return <MonthSectionHeader title={item.title} count={item.count} />;
      }
      return (
        <HealthRecordItem
          record={item.record}
          index={item.index}
          onPress={handleRecordPress}
        />
      );
    },
    [handleRecordPress],
  );

  const listHeader = useMemo(
    () => (
      <Card style={[styles.summaryCard, { borderColor: theme.colors.borderLight, marginBottom: 12 }]}>
        <View style={[styles.summaryAccent, { backgroundColor: theme.colors.accent }]} />
        <View style={styles.summaryInner}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryCopy}>
              <Text variant="label">Timeline overview</Text>
              <Text variant="bodySmall" color="secondary">
                Grouped by year and month
              </Text>
            </View>
            {hasNextPage ? <Badge label={`${records.length}/${totalMatching}`} variant="outline" /> : null}
          </View>

          <View style={styles.statsRow}>
            <SummaryStat label="Total" value={String(totalMatching)} />
            <SummaryStat label="Shown" value={String(records.length)} />
            <SummaryStat label="Years" value={String(groupedByYear.length)} />
            <SummaryStat label="Months" value={String(monthCount)} />
          </View>

          <View>
            <View style={styles.typeHeaderRow}>
              <Text variant="caption" color="muted">Record types in view</Text>
              <Text variant="caption" color="muted">{tagCount} tags</Text>
            </View>
            <View style={styles.typeStats}>
              {RECORD_TYPES.map(type => {
                const active = applied.typeFilter === type;
                const color = RECORD_TYPE_COLORS[type];
                return (
                  <Pressable
                    key={type}
                    onPress={() => handleTypeFilter(type)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${RECORD_TYPE_LABELS[type]}, ${typeCounts[type]} records`}
                    style={[
                      styles.typeStatChip,
                      {
                        backgroundColor: active ? color + '18' : theme.colors.surfaceMuted,
                        borderColor: active ? color : theme.colors.borderLight,
                      },
                    ]}
                  >
                    <Text style={styles.typeStatIcon}>{RECORD_TYPE_ICONS[type]}</Text>
                    <Text variant="h3" style={[styles.typeStatCount, { color: active ? color : theme.colors.primary }]}>
                      {typeCounts[type]}
                    </Text>
                    <Text
                      variant="caption"
                      numberOfLines={1}
                      style={{ color: active ? color : theme.colors.textMuted, fontWeight: active ? '700' : '500' }}
                    >
                      {TYPE_SHORT_LABELS[type]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Card>
    ),
    [
      theme,
      records.length,
      totalMatching,
      groupedByYear.length,
      monthCount,
      tagCount,
      hasNextPage,
      typeCounts,
      applied.typeFilter,
      handleTypeFilter,
    ],
  );

  const handleToggleMonthYear = () => {
    if (!showMonthYearFilters) {
      syncDraftFromApplied();
      setShowTagFilters(false);
    }
    toggleMonthYearFilters();
  };

  const handleToggleTagFilters = () => {
    if (!showTagFilters) {
      syncDraftFromApplied();
      setShowMonthYearFilters(false);
    }
    toggleTagFilters();
  };

  const handleApplyMonthYear = () => {
    Keyboard.dismiss();
    applyDraft();
    closeMonthYearPanel();
  };

  const handleApplyTagFilters = () => {
    Keyboard.dismiss();
    applyDraft();
    closeTagPanel();
  };

  const toggleDraftTag = (tag: string) => {
    updateDraft(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  };

  const removeActiveFilter = (id: string) => {
    if (id.startsWith('tag:')) {
      const tag = id.slice(4);
      applyPatch({
        selectedTags: applied.selectedTags.filter(t => t !== tag),
      });
      return;
    }
    if (id === 'type') applyPatch({ typeFilter: undefined });
    if (id === 'monthYear') applyPatch({ selectedYear: undefined, selectedMonth: undefined });
    if (id === 'year') applyPatch({ selectedYear: undefined, selectedMonth: undefined });
    if (id === 'month') applyPatch({ selectedMonth: undefined });
  };

  const initialLoading = isLoading && data === undefined;

  const renderBody = () => {
    if (initialLoading) {
      return <ListShimmer />;
    }

    if (isError) {
      return (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={refetch}
        />
      );
    }

    return (
      <View style={styles.body}>
        <View style={styles.header}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search records, providers, tags..."
            accessibilityLabel="Search health records"
            onSubmitEditing={() => Keyboard.dismiss()}
          />

          <Text variant="label">Record type</Text>
          <FilterChipBar
            chips={[
              { id: 'all', label: 'All types' },
              ...RECORD_TYPES.map(t => ({ id: t, label: RECORD_TYPE_LABELS[t] })),
            ]}
            isSelected={id => (id === 'all' ? !applied.typeFilter : applied.typeFilter === id)}
            onToggle={handleTypeFilter}
            accessibilityLabel="Filter by record type"
          />

          <View style={styles.filterButtons}>
            <Button
              title={`Year / Month${appliedMonthYearCount ? ` (${appliedMonthYearCount})` : ''}`}
              variant={showMonthYearFilters ? 'gold' : 'outline'}
              size="sm"
              onPress={handleToggleMonthYear}
              style={styles.filterButton}
            />
            <Button
              title={`Filters${appliedTagCount ? ` (${appliedTagCount})` : ''}`}
              variant={showTagFilters ? 'gold' : 'outline'}
              size="sm"
              onPress={handleToggleTagFilters}
              style={styles.filterButton}
            />
          </View>

          <FilterPanel
            visible={showMonthYearFilters}
            onApply={handleApplyMonthYear}
            onClear={() => {
              applyPatch({ selectedYear: undefined, selectedMonth: undefined });
              closeMonthYearPanel();
            }}
            activeCount={draftMonthYearCount}
          >
            <Text variant="label">Year</Text>
            <FilterChipBar
              chips={[
                { id: 'all', label: 'All years' },
                ...TIMELINE_FILTER_YEARS.map(year => ({ id: String(year), label: String(year) })),
              ]}
              isSelected={id =>
                id === 'all' ? draft.selectedYear == null : draft.selectedYear === Number(id)
              }
              onToggle={id =>
                updateDraft(prev => {
                  if (id === 'all') {
                    return { ...prev, selectedYear: undefined, selectedMonth: undefined };
                  }
                  const year = Number(id);
                  const clearing = prev.selectedYear === year;
                  return {
                    ...prev,
                    selectedYear: clearing ? undefined : year,
                    selectedMonth: clearing ? undefined : prev.selectedMonth,
                  };
                })
              }
              accessibilityLabel="Filter by year"
            />
            <Text variant="label">Month</Text>
            <FilterChipBar
              chips={[
                { id: 'all', label: 'All months' },
                ...MONTH_FILTER_OPTIONS.map(m => ({ id: String(m.month), label: m.label })),
              ]}
              isSelected={id =>
                id === 'all' ? draft.selectedMonth == null : draft.selectedMonth === Number(id)
              }
              onToggle={id =>
                updateDraft(prev => {
                  if (id === 'all') {
                    return { ...prev, selectedMonth: undefined };
                  }
                  const month = Number(id);
                  return {
                    ...prev,
                    selectedMonth: prev.selectedMonth === month ? undefined : month,
                  };
                })
              }
              accessibilityLabel="Filter by month"
            />
          </FilterPanel>

          <FilterPanel
            visible={showTagFilters}
            onApply={handleApplyTagFilters}
            onClear={() => {
              applyPatch({ selectedTags: [] });
              closeTagPanel();
            }}
            activeCount={draftTagCount}
          >
            <Text variant="label">Tags</Text>
            <FilterChipBar
              chips={HEALTH_TAG_POOL.map(t => ({ id: t, label: t }))}
              isSelected={id => draft.selectedTags.includes(id)}
              onToggle={toggleDraftTag}
            />
          </FilterPanel>

          {!anyPanelOpen && <ActiveFiltersBar chips={activeChips} onRemove={removeActiveFilter} />}
        </View>

        {showListShimmer ? (
          <ListShimmer />
        ) : (
          <FlashList
            data={rows}
            renderItem={renderItem}
            estimatedItemSize={180}
            getItemType={item => item.kind}
            keyExtractor={item => item.id}
            ListHeaderComponent={listHeader}
            onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
            onEndReachedThreshold={0.3}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={<EmptyState title="No records found" message="Try adjusting filters" />}
            ListFooterComponent={isFetchingNextPage ? <ListShimmer count={2} /> : null}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    );
  };

  return (
    <ScreenContainer offline={networkStatus === 'offline'}>
      <ScreenHeader
        title="Patient Timeline"
        subtitle={
          initialLoading
            ? 'Your personal health history'
            : applied.typeFilter
              ? `${totalMatching} ${RECORD_TYPE_LABELS[applied.typeFilter].toLowerCase()} records`
              : applied.selectedYear != null && applied.selectedMonth != null
                ? `${totalMatching} records · ${MONTH_FILTER_OPTIONS.find(m => m.month === applied.selectedMonth)?.label} ${applied.selectedYear}`
                : applied.selectedYear != null
                  ? `${totalMatching} records · ${applied.selectedYear}`
                  : `${totalMatching} records · grouped by month/year`
        }
      />
      {renderBody()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  header: { padding: 16, gap: 10 },
  filterButtons: { flexDirection: 'row', gap: 8 },
  filterButton: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  summaryCard: { padding: 0, overflow: 'hidden' },
  summaryAccent: { height: 4, width: '100%' },
  summaryInner: { padding: 14, gap: 14 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  summaryCopy: { flex: 1, gap: 2, minWidth: 0 },
  statsRow: { flexDirection: 'row', gap: 8 },
  typeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeStats: { flexDirection: 'row', gap: 6 },
  typeStatChip: {
    flex: 1,
    minWidth: 0,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
  },
  typeStatIcon: { fontSize: 14, lineHeight: 18 },
  typeStatCount: { fontSize: 16, lineHeight: 20, fontWeight: '800' },
  statBox: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 2,
  },
  sectionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    marginBottom: 12,
  },
  yearWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionLine: { width: 4, height: 20, borderRadius: 2 },
  sectionTitle: { fontWeight: '800', letterSpacing: 0.4, fontSize: 14 },
  sectionCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
