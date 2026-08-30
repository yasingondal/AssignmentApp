import { useCallback, useEffect, useState } from 'react';

function filtersEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useDeferredFilterState<T extends Record<string, unknown>>(initial: T) {
  const [draft, setDraft] = useState<T>(initial);
  const [applied, setApplied] = useState<T>(initial);
  const [isApplying, setIsApplying] = useState(false);

  const syncDraftFromApplied = useCallback(() => {
    setDraft(applied);
  }, [applied]);

  const updateDraft = useCallback((updater: (prev: T) => T) => {
    setDraft(updater);
  }, []);

  const setDraftValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  }, []);

  const applyDraft = useCallback(() => {
    setApplied(prev => {
      if (filtersEqual(prev, draft)) {
        setIsApplying(false);
        return prev;
      }
      setIsApplying(true);
      return draft;
    });
  }, [draft]);

  const clearDraft = useCallback(() => {
    setDraft(initial);
  }, [initial]);

  const clearAndApply = useCallback(() => {
    setDraft(initial);
    setApplied(prev => {
      if (filtersEqual(prev, initial)) {
        setIsApplying(false);
        return prev;
      }
      setIsApplying(true);
      return initial;
    });
  }, [initial]);

  const applyPatch = useCallback((patch: Partial<T>) => {
    setApplied(prev => {
      const next = { ...prev, ...patch };
      if (filtersEqual(prev, next)) {
        setIsApplying(false);
        return prev;
      }
      setDraft(next);
      setIsApplying(true);
      return next;
    });
  }, []);

  const finishApplying = useCallback(() => {
    setIsApplying(false);
  }, []);

  return {
    draft,
    applied,
    isApplying,
    syncDraftFromApplied,
    updateDraft,
    setDraftValue,
    applyDraft,
    clearDraft,
    clearAndApply,
    applyPatch,
    finishApplying,
    setDraft,
  };
}

/** Clears isApplying once the query has settled (or immediately if no fetch was needed). */
export function useFilterApplyCompletion(
  isApplying: boolean,
  isFetching: boolean,
  isLoading: boolean,
  finishApplying: () => void,
) {
  useEffect(() => {
    if (isApplying && !isFetching && !isLoading) {
      finishApplying();
    }
  }, [isApplying, isFetching, isLoading, finishApplying]);
}

export function countActiveFilters<T extends Record<string, unknown>>(
  state: T,
  counters: Array<(value: T) => number>,
): number {
  return counters.reduce((sum, counter) => sum + counter(state), 0);
}
