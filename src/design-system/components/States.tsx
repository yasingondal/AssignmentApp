import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { Button } from '@/design-system/components/Button';
import { useTheme } from '@/design-system/theme/ThemeContext';

export function Loader({ message = 'Loading...' }: { message?: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text variant="bodySmall" color="secondary" style={styles.mt}>
        {message}
      </Text>
    </View>
  );
}

export function Skeleton({ width, height = 16, style }: { width: number | `${number}%`; height?: number; style?: object }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        { width, height, backgroundColor: theme.colors.skeleton, borderRadius: 4 },
        style,
      ]}
      accessibilityElementsHidden
    />
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center} accessibilityRole="text">
      <Text variant="h3" style={styles.mb}>{title}</Text>
      {message ? <Text variant="bodySmall" color="secondary" style={styles.mb}>{message}</Text> : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} variant="gold" /> : null}
    </View>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center} accessibilityRole="alert">
      <Text variant="h3" color="error" style={styles.mb}>{title}</Text>
      {message ? <Text variant="bodySmall" color="secondary" style={styles.mb}>{message}</Text> : null}
      {onRetry ? <Button title="Retry" onPress={onRetry} variant="gold" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  mt: { marginTop: 12 },
  mb: { marginBottom: 12, textAlign: 'center' },
});
