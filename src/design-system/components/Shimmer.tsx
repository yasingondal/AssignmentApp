import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/design-system/theme/ThemeContext';

interface ShimmerProps {
  width: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Shimmer({ width, height = 16, borderRadius = 10, style }: ShimmerProps) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.skeleton,
          opacity,
        },
        style,
      ]}
      accessibilityElementsHidden
    />
  );
}

export function ListItemShimmer() {
  const { theme } = useTheme();
  return (
    <View style={[shimmerStyles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]}>
      <View style={shimmerStyles.row}>
        <Shimmer width={56} height={56} borderRadius={28} />
        <View style={shimmerStyles.content}>
          <Shimmer width="70%" height={18} />
          <Shimmer width="50%" height={14} style={shimmerStyles.gap} />
          <View style={shimmerStyles.chips}>
            <Shimmer width={64} height={24} borderRadius={20} />
            <Shimmer width={48} height={24} borderRadius={20} />
          </View>
        </View>
        <Shimmer width={56} height={20} />
      </View>
    </View>
  );
}

export function ListShimmer({ count = 6 }: { count?: number }) {
  return (
    <View style={shimmerStyles.list}>
      {Array.from({ length: count }, (_, i) => (
        <ListItemShimmer key={i} />
      ))}
    </View>
  );
}

export function DetailShimmer() {
  const { theme } = useTheme();
  return (
    <View style={shimmerStyles.detail}>
      <Shimmer width="100%" height={220} borderRadius={16} />
      <Shimmer width="80%" height={28} style={shimmerStyles.gap} />
      <Shimmer width="55%" height={16} />
      <View style={[shimmerStyles.card, { backgroundColor: theme.colors.surface, marginTop: 16 }]}>
        <Shimmer width="40%" height={14} />
        <Shimmer width="100%" height={14} style={shimmerStyles.gap} />
        <Shimmer width="90%" height={14} style={shimmerStyles.gap} />
      </View>
    </View>
  );
}

const shimmerStyles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  content: { flex: 1, gap: 6 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 4 },
  gap: { marginTop: 8 },
  detail: { padding: 20 },
});
