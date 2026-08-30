import React from 'react';
import { Pressable, StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '@/design-system/theme/ThemeContext';

interface CardProps extends ViewProps {
  onPress?: () => void;
  elevated?: boolean;
}

export function Card({ onPress, elevated = true, style, children, ...props }: CardProps) {
  const { theme } = useTheme();
  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderLight,
        },
        elevated && theme.shadows.md,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.pressable,
          { transform: [{ scale: pressed ? 0.985 : 1 }] },
        ]}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  pressable: { marginBottom: 0, alignSelf: 'stretch', width: '100%' },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    overflow: 'hidden',
  },
});
