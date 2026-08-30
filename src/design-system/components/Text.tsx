import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
} from 'react-native';
import { useTheme } from '@/design-system/theme/ThemeContext';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'label';

interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: 'primary' | 'secondary' | 'muted' | 'error' | 'success' | 'inherit';
}

export function Text({ variant = 'body', color = 'inherit', style, ...props }: TextProps) {
  const { theme } = useTheme();
  const colorMap = {
    primary: theme.colors.text,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    error: theme.colors.error,
    success: theme.colors.success,
    inherit: theme.colors.text,
  };

  return (
    <RNText
      style={[theme.typography[variant], { color: colorMap[color] }, style]}
      {...props}
    />
  );
}

export function Heading({ level = 1, ...props }: TextProps & { level?: 1 | 2 | 3 }) {
  const variant = (`h${level}` as Variant);
  return <Text variant={variant} accessibilityRole="header" {...props} />;
}
