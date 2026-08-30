import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeContext';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  leftIcon,
  rightIcon,
  style,
  ...props
}: ButtonProps) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: { bg: theme.colors.primary, text: theme.colors.onPrimary, border: theme.colors.primary },
    secondary: { bg: theme.colors.surfaceMuted, text: theme.colors.text, border: theme.colors.border },
    gold: { bg: theme.colors.accent, text: '#1A1F1C', border: theme.colors.accent },
    outline: { bg: 'transparent', text: theme.colors.primary, border: theme.colors.primary },
    ghost: { bg: 'transparent', text: theme.colors.primary, border: 'transparent' },
    danger: { bg: theme.colors.error, text: theme.colors.onPrimary, border: theme.colors.error },
  }[variant];

  const sizeStyles = {
    sm: { paddingVertical: theme.spacing.xs + 2, paddingHorizontal: theme.spacing.md, minHeight: 40 },
    md: { paddingVertical: theme.spacing.sm + 4, paddingHorizontal: theme.spacing.lg, minHeight: 48 },
    lg: { paddingVertical: theme.spacing.md + 2, paddingHorizontal: theme.spacing.xl, minHeight: 54 },
  }[size];

  const shadow = variant === 'gold' || variant === 'primary' ? theme.shadows.sm : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        shadow,
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.97 : 1 }],
          width: fullWidth ? '100%' : undefined,
        },
        sizeStyles,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <Text variant="button" style={[styles.label, { color: variantStyles.text }]}>
            {title}
          </Text>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: { textAlign: 'center', fontWeight: '700', letterSpacing: 0.3 },
});
