import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Switch, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Text, SearchInput, EmptyState, ErrorState, ScreenContainer, Button, ScreenHeader, ListShimmer,
} from '@/design-system/components';
import { useDebouncedValue } from '@/core/utils/debounce';
import { productRepository } from '@/features/shop/data/productRepository';
import {
  BRANDS,
  CATEGORIES,
  TAGS,
  type Brand,
  type Category,
  type Product,
  type ProductFilters,
  type SortOption,
} from '@/features/shop/domain/types';
import type { ShopStackParamList } from '@/app/navigation/types';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { FilterChipBar } from '@/shared/components/FilterChipBar';
import { ProductListItem } from '@/features/shop/presentation/components/ProductListItem';
import { FilterPanel, ActiveFiltersBar } from '@/shared/components/FilterPanel';
import { useCollapsibleFilters } from '@/shared/hooks/useCollapsibleFilters';
import { useDeferredFilterState, useFilterApplyCompletion } from '@/shared/hooks/useDeferredFilterState';
import { useTheme } from '@/design-system/theme/ThemeContext';

const PAGE_SIZE = 20;

type ProductPanelFilters = {
  category?: Category;
  brand?: Brand;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  selectedTags: string[];
  availabilityOnly: boolean;
  pricePreset?: string;
};

const EMPTY_PANEL_FILTERS: ProductPanelFilters = {
  category: undefined,
  brand: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  minRating: undefined,
  selectedTags: [],
  availabilityOnly: false,
  pricePreset: undefined,
};

const PRICE_OPTIONS = [
  { id: '500', label: 'Under ₹500', min: undefined, max: 500 },
  { id: '2000', label: '₹500–2000', min: 500, max: 2000 },
  { id: '5000', label: '₹2000+', min: 2000, max: undefined },
];

const RATING_OPTIONS = [
  { id: '3.5', value: 3.5 },
  { id: '4', value: 4 },
  { id: '4.5', value: 4.5 },
];

function countProductPanelFilters(state: ProductPanelFilters): number {
  const priceActive =
    Boolean(state.pricePreset) || state.minPrice !== undefined || state.maxPrice !== undefined;
  return [
    state.category,
    state.brand,
    priceActive ? true : undefined,
    state.minRating,
    state.availabilityOnly,
    ...state.selectedTags,
  ].filter(v => v !== undefined && v !== false).length;
}

function buildActiveChips(state: ProductPanelFilters) {
  const chips: { id: string; label: string }[] = [];
  if (state.category) chips.push({ id: 'category', label: state.category });
  if (state.brand) chips.push({ id: 'brand', label: state.brand });
  if (state.pricePreset) {
    chips.push({
      id: 'price',
      label: PRICE_OPTIONS.find(p => p.id === state.pricePreset)?.label ?? 'Price',
    });
  }
  if (state.minRating) chips.push({ id: 'rating', label: `${state.minRating}+ ★` });
  state.selectedTags.forEach(t => chips.push({ id: `tag:${t}`, label: t }));
  if (state.availabilityOnly) chips.push({ id: 'stock', label: 'In stock' });
  return chips;
}

export function ProductListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ShopStackParamList>>();
  const [search, setSearch] = useState('');
  /** Immediate pill highlight (paints before heavy sort work). */
  const [selectedSort, setSelectedSort] = useState<SortOption>('popularity');
  /** Drives the query — updated after shimmer paints. */
  const [querySort, setQuerySort] = useState<SortOption>('popularity');
  const [sortPending, setSortPending] = useState(false);
  const sortPendingStartedAt = useRef(0);
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

  const filters: ProductFilters = useMemo(
    () => ({
      search: debouncedSearch,
      category: applied.category,
      brand: applied.brand,
      minPrice: applied.minPrice,
      maxPrice: applied.maxPrice,
      minRating: applied.minRating,
      tags: applied.selectedTags.length ? applied.selectedTags : undefined,
      availabilityOnly: applied.availabilityOnly,
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
    isPlaceholderData,
  } = useInfiniteQuery({
    queryKey: ['products', filters, querySort],
    queryFn: ({ pageParam }) =>
      productRepository.getProducts(filters, querySort, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });

  useFilterApplyCompletion(isApplying, isFetching, isLoading, finishApplying);

  // Keep shimmer until the new sort query settles (min ~220ms for visible feedback).
  useEffect(() => {
    if (!sortPending) {
      return;
    }

    // Wait until deferred querySort catches up to the selected pill.
    if (querySort !== selectedSort) {
      return;
    }

    const sortQueryInFlight =
      (isFetching && !isFetchingNextPage) || isLoading || isPlaceholderData;

    if (sortQueryInFlight) {
      return;
    }

    const elapsed = Date.now() - sortPendingStartedAt.current;
    const remaining = Math.max(0, 220 - elapsed);
    const timer = setTimeout(() => setSortPending(false), remaining);
    return () => clearTimeout(timer);
  }, [
    sortPending,
    querySort,
    selectedSort,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isPlaceholderData,
  ]);

  const products = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data]);
  const appliedFilterCount = countProductPanelFilters(applied);
  const draftFilterCount = countProductPanelFilters(draft);
  const activeChips = useMemo(() => buildActiveChips(applied), [applied]);
  const showListShimmer = isApplying || sortPending;

  const handleSort = useCallback((id: string) => {
    if (id === selectedSort) {
      return;
    }
    const next = id as SortOption;
    sortPendingStartedAt.current = Date.now();
    setSelectedSort(next);
    setSortPending(true);
    // Let the selected pill + shimmer paint before kicking off sort work.
    requestAnimationFrame(() => {
      setQuerySort(next);
    });
  }, [selectedSort]);

  const handleProductPress = useCallback(
    (productId: string) => navigation.navigate('ProductDetail', { productId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <ProductListItem product={item} onPress={handleProductPress} index={index} />
    ),
    [handleProductPress],
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
    switch (id) {
      case 'category': applyPatch({ category: undefined }); break;
      case 'brand': applyPatch({ brand: undefined }); break;
      case 'price':
        applyPatch({ pricePreset: undefined, minPrice: undefined, maxPrice: undefined });
        break;
      case 'rating': applyPatch({ minRating: undefined }); break;
      case 'stock': applyPatch({ availabilityOnly: false }); break;
      default: break;
    }
  };

  const sortOptions: SortOption[] = ['popularity', 'price_asc', 'price_desc', 'rating', 'newest'];

  if (isLoading && data === undefined) {
    return (
      <ScreenContainer offline={networkStatus === 'offline'}>
        <ScreenHeader title="Amrutam Shop" subtitle="Authentic Ayurvedic wellness products" />
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
        title="Amrutam Shop"
        subtitle={`${products.length}+ products · Curated wellness`}
        right={
          <View style={styles.headerActions}>
            <Button title="♡" variant="outline" size="sm" onPress={() => navigation.navigate('Wishlist')} accessibilityLabel="Wishlist" />
            <Button title="Cart" variant="gold" size="sm" onPress={() => navigation.navigate('Cart')} />
          </View>
        }
      />
      <View style={styles.header}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products, brands, ingredients..."
          accessibilityLabel="Search products"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        <Button
          title={`Filters${appliedFilterCount ? ` (${appliedFilterCount})` : ''}`}
          variant={showFilters ? 'gold' : 'outline'}
          size="sm"
          onPress={handleToggleFilters}
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
          <Text variant="label">Category</Text>
          <FilterChipBar
            chips={CATEGORIES.map(c => ({ id: c, label: c }))}
            isSelected={id => draft.category === id}
            onToggle={id =>
              updateDraft(prev => ({
                ...prev,
                category: prev.category === id ? undefined : (id as Category),
              }))
            }
          />
          <Text variant="label">Brand</Text>
          <FilterChipBar
            chips={BRANDS.map(b => ({ id: b, label: b }))}
            isSelected={id => draft.brand === id}
            onToggle={id =>
              updateDraft(prev => ({
                ...prev,
                brand: prev.brand === id ? undefined : (id as Brand),
              }))
            }
          />
          <Text variant="label">Price</Text>
          <FilterChipBar
            chips={PRICE_OPTIONS.map(p => ({ id: p.id, label: p.label }))}
            isSelected={id => draft.pricePreset === id}
            onToggle={id => {
              const opt = PRICE_OPTIONS.find(p => p.id === id);
              if (draft.pricePreset === id) {
                updateDraft(prev => ({ ...prev, pricePreset: undefined, minPrice: undefined, maxPrice: undefined }));
              } else if (opt) {
                updateDraft(prev => ({
                  ...prev,
                  pricePreset: id,
                  minPrice: opt.min,
                  maxPrice: opt.max,
                }));
              }
            }}
          />
          <Text variant="label">Rating</Text>
          <FilterChipBar
            chips={RATING_OPTIONS.map(r => ({ id: r.id, label: `${r.value}+ ★` }))}
            isSelected={id => String(draft.minRating) === id}
            onToggle={id => {
              const opt = RATING_OPTIONS.find(r => r.id === id);
              updateDraft(prev => ({
                ...prev,
                minRating: prev.minRating === opt?.value ? undefined : opt?.value,
              }));
            }}
          />
          <Text variant="label">Tags</Text>
          <FilterChipBar
            chips={TAGS.map(t => ({ id: t, label: t }))}
            isSelected={id => draft.selectedTags.includes(id)}
            onToggle={toggleDraftTag}
          />
          <View style={styles.switchRow}>
            <Text variant="bodySmall">In stock only</Text>
            <Switch
              value={draft.availabilityOnly}
              onValueChange={value => updateDraft(prev => ({ ...prev, availabilityOnly: value }))}
              trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
              thumbColor={theme.colors.surface}
            />
          </View>
        </FilterPanel>

        {!showFilters && <ActiveFiltersBar chips={activeChips} onRemove={removeActiveFilter} />}

        <Text variant="label">Sort by</Text>
        <FilterChipBar
          chips={sortOptions.map(s => ({ id: s, label: s.replace(/_/g, ' ') }))}
          isSelected={id => selectedSort === id}
          onToggle={handleSort}
          accessibilityLabel="Sort products"
        />
      </View>
      {showListShimmer ? (
        <ListShimmer />
      ) : (
        <FlashList
          data={products}
          renderItem={renderItem}
          estimatedItemSize={90}
          extraData={querySort}
          keyExtractor={item => item.id}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          refreshing={false}
          onRefresh={refetch}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={<EmptyState title="No products found" message="Try adjusting filters" />}
          ListFooterComponent={isFetchingNextPage ? <ListShimmer count={2} /> : null}
          contentContainerStyle={styles.list}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, gap: 10 },
  headerActions: { flexDirection: 'row', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
});
