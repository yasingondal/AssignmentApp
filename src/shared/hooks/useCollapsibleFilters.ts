import { useCallback, useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function useCollapsibleFilters(initialOpen = false) {
  const [showFilters, setShowFilters] = useState(initialOpen);

  const openFilters = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters(true);
  }, []);

  const closeFilters = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters(false);
  }, []);

  const toggleFilters = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters(v => !v);
  }, []);

  const applyFilters = useCallback(() => {
    closeFilters();
  }, [closeFilters]);

  return { showFilters, openFilters, closeFilters, toggleFilters, applyFilters, setShowFilters };
}
