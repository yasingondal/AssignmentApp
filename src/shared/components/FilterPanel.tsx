import React from 'react';
import { LayoutAnimation, Platform, StyleSheet, UIManager, View } from 'react-native';
import { Button, Text } from '@/design-system/components';
import { useTheme } from '@/design-system/theme/ThemeContext';
import { FadeInView } from '@/design-system/components/FadeInView';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FilterPanelProps {
  visible: boolean;
  onApply: () => void;
  onClear?: () => void;
  activeCount?: number;
  children: React.ReactNode;
}

export function FilterPanel({ visible, onApply, onClear, activeCount = 0, children }: FilterPanelProps) {
  const { theme } = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <FadeInView>
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight,
          },
          theme.shadows.md,
        ]}
        accessibilityLabel="Filter panel"
      >
        {children}
        <View style={styles.actions}>
          {onClear && activeCount > 0 ? (
            <Button title="Clear all" variant="ghost" size="sm" onPress={onClear} style={styles.actionBtn} />
          ) : null}
          <Button
            title={activeCount > 0 ? `Apply (${activeCount})` : 'Apply'}
            variant="gold"
            size="sm"
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              onApply();
            }}
            style={styles.applyBtn}
          />
        </View>
      </View>
    </FadeInView>
  );
}

interface ActiveFiltersBarProps {
  chips: { id: string; label: string }[];
  onRemove: (id: string) => void;
}

export function ActiveFiltersBar({ chips, onRemove }: ActiveFiltersBarProps) {
  const { theme } = useTheme();

  if (chips.length === 0) {
    return null;
  }

  return (
    <View style={styles.activeRow}>
      <Text variant="caption" color="muted" style={styles.activeLabel}>Active:</Text>
      <View style={styles.activeChips}>
        {chips.map(chip => (
          <Button
            key={chip.id}
            title={`${chip.label} ×`}
            variant="outline"
            size="sm"
            onPress={() => onRemove(chip.id)}
            style={[styles.activeChip, { borderColor: theme.colors.accent }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2DDD4',
  },
  actionBtn: { minHeight: 40 },
  applyBtn: { minWidth: 120 },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  activeLabel: { fontWeight: '600' },
  activeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  activeChip: { minHeight: 32, paddingVertical: 4 },
});
