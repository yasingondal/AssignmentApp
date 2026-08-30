import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/design-system/theme/ThemeContext';

interface TabIconProps {
  focused: boolean;
  color: string;
}

function IconShell({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.shell,
        focused && {
          backgroundColor: theme.colors.primary + '18',
          borderColor: theme.colors.accent + '55',
        },
      ]}
    >
      {focused ? <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} /> : null}
      {children}
    </View>
  );
}

export function ConsultationTabIcon({ focused, color }: TabIconProps) {
  return (
    <IconShell focused={focused}>
      <View style={styles.iconBox}>
        <View style={[styles.stethHead, { borderColor: color }]} />
        <View style={[styles.stethTube, { backgroundColor: color }]} />
        <View style={[styles.stethChest, { borderColor: color }]} />
      </View>
    </IconShell>
  );
}

export function ShopTabIcon({ focused, color }: TabIconProps) {
  return (
    <IconShell focused={focused}>
      <View style={styles.iconBox}>
        <View style={[styles.bagBody, { borderColor: color }]} />
        <View style={[styles.bagHandle, { borderColor: color }]} />
      </View>
    </IconShell>
  );
}

export function HealthTabIcon({ focused, color }: TabIconProps) {
  return (
    <IconShell focused={focused}>
      <View style={styles.iconBox}>
        <View style={[styles.clipBoard, { borderColor: color }]} />
        <View style={[styles.clipLine, { backgroundColor: color }]} />
        <View style={[styles.clipLine, styles.clipLineMid, { backgroundColor: color }]} />
      </View>
    </IconShell>
  );
}

export function SettingsTabIcon({ focused, color }: TabIconProps) {
  return (
    <IconShell focused={focused}>
      <View style={styles.iconBox}>
        <View style={[styles.gearOuter, { borderColor: color }]}>
          <View style={[styles.gearInner, { backgroundColor: color }]} />
        </View>
      </View>
    </IconShell>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: 44,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dot: {
    position: 'absolute',
    top: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  iconBox: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  stethHead: {
    position: 'absolute',
    left: 2,
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  stethTube: {
    position: 'absolute',
    left: 9,
    top: 11,
    width: 10,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: '-25deg' }],
  },
  stethChest: {
    position: 'absolute',
    right: 2,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 2,
  },
  bagBody: {
    width: 16,
    height: 14,
    borderWidth: 2,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    marginTop: 4,
  },
  bagHandle: {
    position: 'absolute',
    top: 2,
    width: 10,
    height: 6,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  clipBoard: {
    width: 14,
    height: 18,
    borderWidth: 2,
    borderRadius: 3,
  },
  clipLine: {
    position: 'absolute',
    top: 7,
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  clipLineMid: { top: 12 },
  gearOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearInner: { width: 6, height: 6, borderRadius: 3 },
});
