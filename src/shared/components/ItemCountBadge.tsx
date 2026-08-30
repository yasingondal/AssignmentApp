import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeContext';

interface ItemCountBadgeProps {
  count: number;
}

export function ItemCountBadge({ count }: ItemCountBadgeProps) {
  const { theme } = useTheme();

  if (count <= 0) {
    return null;
  }

  const label = count > 99 ? '99+' : String(count);

  return (
    <View
      style={[styles.badge, { backgroundColor: theme.colors.accent, borderColor: theme.colors.surface }]}
      accessibilityLabel={`${count} in cart`}
      accessibilityRole="text"
    >
      <Text variant="caption" style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    zIndex: 2,
  },
  label: {
    color: '#1A1F1C',
    fontWeight: '800',
    fontSize: 11,
    lineHeight: 14,
  },
});
