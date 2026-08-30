import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ViewProps,
} from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  offline?: boolean;
  /** Wrap content in KeyboardAvoidingView for forms */
  keyboardAware?: boolean;
  /** Scroll content when keyboard is open */
  scrollable?: boolean;
  /** Respect top safe area on ScreenHeader screens */
  safeTop?: boolean;
}

export function ScreenContainer({
  children,
  offline,
  keyboardAware = false,
  scrollable = false,
  safeTop = false,
  style,
  ...props
}: ScreenContainerProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        safeTop && { paddingTop: insets.top },
        style,
      ]}
      {...props}
    >
      {offline ? (
        <View
          style={[
            styles.offlineBanner,
            { backgroundColor: theme.colors.offlineBanner, borderBottomColor: theme.colors.border },
          ]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text variant="caption" style={styles.offlineText}>
            ● Offline — showing cached data
          </Text>
        </View>
      ) : null}
      {children}
    </View>
  );

  if (keyboardAware) {
    const inner = scrollable ? (
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {children}
      </ScrollView>
    ) : (
      children
    );

    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <View style={[styles.flex, { backgroundColor: theme.colors.background }, safeTop && { paddingTop: insets.top }, style]}>
          {offline ? (
            <View
              style={[
                styles.offlineBanner,
                { backgroundColor: theme.colors.offlineBanner, borderBottomColor: theme.colors.border },
              ]}
            >
              <Text variant="caption" style={styles.offlineText}>● Offline — showing cached data</Text>
            </View>
          ) : null}
          {inner}
        </View>
      </KeyboardAvoidingView>
    );
  }

  return content;
}

export function QuantityStepper({
  value,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
}: {
  value: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={onDecrease}
        disabled={value <= min}
        style={[styles.stepBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted }]}
        accessibilityLabel="Decrease quantity"
        accessibilityRole="button"
      >
        <Text variant="h3" style={{ color: theme.colors.primary }}>−</Text>
      </Pressable>
      <Text variant="body" style={[styles.stepValue, { color: theme.colors.text }]} accessibilityLabel={`Quantity ${value}`}>
        {value}
      </Text>
      <Pressable
        onPress={onIncrease}
        disabled={value >= max}
        style={[styles.stepBtn, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary }]}
        accessibilityLabel="Increase quantity"
        accessibilityRole="button"
      >
        <Text variant="h3" style={{ color: theme.colors.onPrimary }}>+</Text>
      </Pressable>
    </View>
  );
}

export function Badge({ label, color, variant = 'default' }: { label: string; color?: string; variant?: 'default' | 'gold' | 'outline' }) {
  const { theme } = useTheme();
  const bg =
    variant === 'gold'
      ? theme.colors.accentMuted
      : variant === 'outline'
        ? 'transparent'
        : color ?? theme.colors.primary + '18';
  const textColor =
    variant === 'gold' ? '#7A5C00' : variant === 'outline' ? theme.colors.primary : color ?? theme.colors.primary;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor: variant === 'outline' ? theme.colors.primary : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
        },
      ]}
    >
      <Text variant="caption" style={{ color: textColor, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  offlineBanner: { padding: 10, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  offlineText: { fontWeight: '600', color: '#7A5C00' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { minWidth: 28, textAlign: 'center', fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
});
