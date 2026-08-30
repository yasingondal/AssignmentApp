import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ConsultationNavigator } from '@/app/navigation/ConsultationNavigator';
import { ShopNavigator } from '@/app/navigation/ShopNavigator';
import { HealthNavigator } from '@/app/navigation/HealthNavigator';
import { SettingsScreen } from '@/features/settings/presentation/screens/SettingsScreen';
import type { MainTabParamList } from '@/app/navigation/types';
import { useTheme } from '@/design-system/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '@/features/shop/data/cartStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ConsultationTabIcon,
  HealthTabIcon,
  SettingsTabIcon,
  ShopTabIcon,
} from '@/shared/components/TabIcons';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, React.ComponentType<{ focused: boolean; color: string }>> = {
  ConsultationTab: ConsultationTabIcon,
  ShopTab: ShopTabIcon,
  HealthTab: HealthTabIcon,
  SettingsTab: SettingsTabIcon,
};

export function MainTabNavigator() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const cartCount = useCartStore(s => s.getItemCount());
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 12);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.borderLight,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 10,
          ...theme.shadows.lg,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 4, letterSpacing: 0.2 },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarIcon: ({ focused, color }) => {
          const Icon = TAB_ICONS[route.name];
          return Icon ? <Icon focused={focused} color={color} /> : null;
        },
      })}
    >
      <Tab.Screen
        name="ConsultationTab"
        component={ConsultationNavigator}
        options={{ tabBarLabel: t('tabs.consultation') }}
      />
      <Tab.Screen
        name="ShopTab"
        component={ShopNavigator}
        options={{
          tabBarLabel: t('tabs.shop'),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.colors.accent, color: '#1A1F1C', fontWeight: '700' },
        }}
      />
      <Tab.Screen
        name="HealthTab"
        component={HealthNavigator}
        options={{ tabBarLabel: t('tabs.health') }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ tabBarLabel: t('tabs.settings'), headerShown: false }}
      />
    </Tab.Navigator>
  );
}
