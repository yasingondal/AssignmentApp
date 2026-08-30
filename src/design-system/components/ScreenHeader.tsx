import React from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeContext';
import { FadeInView } from '@/design-system/components/FadeInView';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  style?: ViewStyle;
}

export function ScreenHeader({ title, subtitle, right, onBack, style }: ScreenHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.colors.headerGradientStart,
          borderBottomColor: theme.colors.borderLight,
          paddingTop: topInset,
        },
        style,
      ]}
    >
      <FadeInView duration={350} slideUp={false}>
        <View style={styles.wrap}>
          <View style={styles.accentBar} />
          <View style={styles.row}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                style={({ pressed }) => [
                  styles.backBtn,
                  {
                    backgroundColor: pressed ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)',
                    borderColor: theme.colors.accent + '66',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
              >
                <Text variant="h3" style={{ color: theme.colors.onPrimary }}>←</Text>
              </Pressable>
            ) : null}
            <View style={styles.textBlock}>
              <Text variant="h2" style={{ color: theme.colors.onPrimary }} accessibilityRole="header">
                {title}
              </Text>
              {subtitle ? (
                <Text variant="bodySmall" style={styles.subtitle}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {right}
          </View>
        </View>
      </FadeInView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  accentBar: {
    width: 40,
    height: 3,
    backgroundColor: '#D4AF37',
    borderRadius: 2,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textBlock: { flex: 1 },
  subtitle: { color: '#E8D5A3', marginTop: 4 },
});
