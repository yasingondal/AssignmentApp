import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeContext';

export interface FilterChip {
  id: string;
  label: string;
}

interface FilterChipBarProps {
  chips: FilterChip[];
  isSelected: (id: string) => boolean;
  onToggle: (id: string) => void;
  accessibilityLabel?: string;
}

export function FilterChipBar({
  chips,
  isSelected,
  onToggle,
  accessibilityLabel = 'Filters',
}: FilterChipBarProps) {
  const { theme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={accessibilityLabel}
      contentContainerStyle={styles.row}
    >
      {chips.map(chip => {
        const active = isSelected(chip.id);
        return (
          <Pressable
            key={chip.id}
            onPress={() => onToggle(chip.id)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? theme.colors.primary : theme.colors.surfaceMuted,
                borderColor: active ? theme.colors.primary : theme.colors.border,
              },
              active && theme.shadows.sm,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Filter ${chip.label}`}
          >
            <Text
              variant="caption"
              style={{
                color: active ? theme.colors.onPrimary : theme.colors.textSecondary,
                fontWeight: active ? '700' : '500',
              }}
            >
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
});
