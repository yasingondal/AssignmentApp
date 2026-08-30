import { useCallback, useMemo, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Text, SearchInput, EmptyState, ErrorState, ScreenContainer, Button, ScreenHeader, ListShimmer,
} from '@/design-system/components';
import { consultationRepository } from '@/features/consultation/data/consultationRepository';
import {
  LANGUAGES,
  SPECIALIZATIONS,
  type Doctor,
  type DoctorFilters,
  type Language,
  type Specialization,
} from '@/features/consultation/domain/types';
import type { ConsultationStackParamList } from '@/app/navigation/types';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useTheme } from '@/design-system/theme/ThemeContext';
import { useDebouncedValue } from '@/core/utils/debounce';
import { FilterChipBar } from '@/shared/components/FilterChipBar';
import { DoctorListItem } from '@/features/consultation/presentation/components/DoctorListItem';
import { FilterPanel, ActiveFiltersBar } from '@/shared/components/FilterPanel';
import { useCollapsibleFilters } from '@/shared/hooks/useCollapsibleFilters';
import { useDeferredFilterState, useFilterApplyCompletion } from '@/shared/hooks/useDeferredFilterState';
import { Keyboard, StyleSheet, Switch, View } from 'react-native';

const PAGE_SIZE = 20;

type DoctorPanelFilters = {
  specialization?: Specialization;
  language?: Language;
  minExperience?: number;
  minRating?: number;
  maxFee?: number;
  availabilityOnly: boolean;
};

const EMPTY_PANEL_FILTERS: DoctorPanelFilters = {
  specialization: undefined,
  language: undefined,
  minExperience: undefined,
  minRating: undefined,
  maxFee: undefined,
  availabilityOnly: false,
};

const EXPERIENCE_OPTIONS = [
  { id: '5', label: '5+ yrs', value: 5 },
  { id: '10', label: '10+ yrs', value: 10 },
  { id: '15', label: '15+ yrs', value: 15 },
];

const RATING_OPTIONS = [
  { id: '4', label: '4+ ★', value: 4 },
  { id: '4.5', label: '4.5+ ★', value: 4.5 },
];

const FEE_OPTIONS = [
  { id: '500', label: 'Under ₹500', value: 500 },
  { id: '1000', label: 'Under ₹1000', value: 1000 },
  { id: '2000', label: 'Under ₹2000', value: 2000 },
];

function countDoctorPanelFilters(state: DoctorPanelFilters): number {
  return [
    state.specialization,
    state.language,
    state.minExperience,
    state.minRating,
    state.maxFee,
    state.availabilityOnly,
  ].filter(Boolean).length;
}

function buildActiveChips(state: DoctorPanelFilters) {
  const chips: { id: string; label: string }[] = [];
  if (state.specialization) chips.push({ id: 'specialization', label: state.specialization });
  if (state.language) chips.push({ id: 'language', label: state.language });
  if (state.minExperience) chips.push({ id: 'experience', label: `${state.minExperience}+ yrs` });
  if (state.minRating) chips.push({ id: 'rating', label: `${state.minRating}+ ★` });
  if (state.maxFee) chips.push({ id: 'fee', label: `Under ₹${state.maxFee}` });
  if (state.availabilityOnly) chips.push({ id: 'available', label: 'Available' });
  return chips;
}

export function DoctorListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ConsultationStackParamList>>();
  const [search, setSearch] = useState('');
  const { showFilters, toggleFilters, applyFilters: closeFilterPanel } = useCollapsibleFilters();
  const {
    draft,
    applied,
    isApplying,
    syncDraftFromApplied,
    updateDraft,
    applyDraft,
    clearAndApply,
    applyPatch,
    finishApplying,
  } = useDeferredFilterState(EMPTY_PANEL_FILTERS);
  const debouncedSearch = useDebouncedValue(search, 300);
  const networkStatus = useNetworkStatus();

  const filters: DoctorFilters = useMemo(
    () => ({
      search: debouncedSearch,
      ...applied,
    }),
    [debouncedSearch, applied],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['doctors', filters],
    queryFn: ({ pageParam }) =>
      consultationRepository.getDoctors(filters, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });

  useFilterApplyCompletion(isApplying, isFetching, isLoading, finishApplying);

  const doctors = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data]);
  const appliedFilterCount = countDoctorPanelFilters(applied);
  const draftFilterCount = countDoctorPanelFilters(draft);
  const activeChips = useMemo(() => buildActiveChips(applied), [applied]);
  const showListShimmer = isApplying;

  const handleDoctorPress = useCallback(
    (doctorId: string) => navigation.navigate('DoctorDetail', { doctorId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Doctor; index: number }) => (
      <DoctorListItem doctor={item} onPress={handleDoctorPress} index={index} />
    ),
    [handleDoctorPress],
  );

  const handleToggleFilters = () => {
    if (!showFilters) {
      syncDraftFromApplied();
    }
    toggleFilters();
  };

  const handleApplyFilters = () => {
    Keyboard.dismiss();
    applyDraft();
    closeFilterPanel();
  };

  const removeActiveFilter = (id: string) => {
    switch (id) {
      case 'specialization': applyPatch({ specialization: undefined }); break;
      case 'language': applyPatch({ language: undefined }); break;
      case 'experience': applyPatch({ minExperience: undefined }); break;
      case 'rating': applyPatch({ minRating: undefined }); break;
      case 'fee': applyPatch({ maxFee: undefined }); break;
      case 'available': applyPatch({ availabilityOnly: false }); break;
      default: break;
    }
  };

  if (isLoading && data === undefined) {
    return (
      <ScreenContainer offline={networkStatus === 'offline'}>
        <ScreenHeader title="Find a Doctor" subtitle="Book Ayurvedic consultations with experts" />
        <ListShimmer />
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer offline={networkStatus === 'offline'}>
        <ErrorState message={String(error)} onRetry={() => refetch()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer offline={networkStatus === 'offline'}>
      <ScreenHeader
        title="Find a Doctor"
        subtitle={`${doctors.length}+ Ayurvedic experts · Book instantly`}
        right={
          <Button
            title="My Visits"
            variant="gold"
            size="sm"
            onPress={() => navigation.navigate('UpcomingConsultations')}
          />
        }
      />
      <View style={[styles.body, { backgroundColor: theme.colors.background }]}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, specialty, location..."
          accessibilityLabel="Search doctors"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <Button
          title={`Filters${appliedFilterCount ? ` (${appliedFilterCount})` : ''}`}
          variant={showFilters ? 'gold' : 'outline'}
          size="sm"
          onPress={handleToggleFilters}
          accessibilityLabel="Toggle doctor filters"
        />

        <FilterPanel
          visible={showFilters}
          onApply={handleApplyFilters}
          onClear={() => {
            clearAndApply();
            closeFilterPanel();
          }}
          activeCount={draftFilterCount}
        >
          <Text variant="label">Specialization</Text>
          <FilterChipBar
            chips={SPECIALIZATIONS.map(s => ({ id: s, label: s }))}
            isSelected={id => draft.specialization === id}
            onToggle={id =>
              updateDraft(prev => ({
                ...prev,
                specialization: prev.specialization === id ? undefined : (id as Specialization),
              }))
            }
          />
          <Text variant="label">Language</Text>
          <FilterChipBar
            chips={LANGUAGES.map(l => ({ id: l, label: l }))}
            isSelected={id => draft.language === id}
            onToggle={id =>
              updateDraft(prev => ({
                ...prev,
                language: prev.language === id ? undefined : (id as Language),
              }))
            }
          />
          <Text variant="label">Experience</Text>
          <FilterChipBar
            chips={EXPERIENCE_OPTIONS.map(o => ({ id: o.id, label: o.label }))}
            isSelected={id => String(draft.minExperience) === id}
            onToggle={id => {
              const opt = EXPERIENCE_OPTIONS.find(o => o.id === id);
              updateDraft(prev => ({
                ...prev,
                minExperience: prev.minExperience === opt?.value ? undefined : opt?.value,
              }));
            }}
          />
          <Text variant="label">Rating</Text>
          <FilterChipBar
            chips={RATING_OPTIONS.map(o => ({ id: o.id, label: o.label }))}
            isSelected={id => String(draft.minRating) === id}
            onToggle={id => {
              const opt = RATING_OPTIONS.find(o => o.id === id);
              updateDraft(prev => ({
                ...prev,
                minRating: prev.minRating === opt?.value ? undefined : opt?.value,
              }));
            }}
          />
          <Text variant="label">Max Fee</Text>
          <FilterChipBar
            chips={FEE_OPTIONS.map(o => ({ id: o.id, label: o.label }))}
            isSelected={id => String(draft.maxFee) === id}
            onToggle={id => {
              const opt = FEE_OPTIONS.find(o => o.id === id);
              updateDraft(prev => ({
                ...prev,
                maxFee: prev.maxFee === opt?.value ? undefined : opt?.value,
              }));
            }}
          />
          <View style={styles.switchRow}>
            <Text variant="bodySmall">Available only</Text>
            <Switch
              value={draft.availabilityOnly}
              onValueChange={value => updateDraft(prev => ({ ...prev, availabilityOnly: value }))}
              trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
              thumbColor={theme.colors.surface}
            />
          </View>
        </FilterPanel>

        {!showFilters && <ActiveFiltersBar chips={activeChips} onRemove={removeActiveFilter} />}
      </View>
      {showListShimmer ? (
        <ListShimmer />
      ) : (
        <FlashList
          data={doctors}
          renderItem={renderItem}
          estimatedItemSize={100}
          keyExtractor={item => item.id}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          refreshing={false}
          onRefresh={refetch}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={<EmptyState title="No doctors found" message="Try adjusting your filters" />}
          ListFooterComponent={isFetchingNextPage ? <ListShimmer count={2} /> : null}
          contentContainerStyle={styles.list}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
});
