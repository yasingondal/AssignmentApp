import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HealthTimelineScreen } from '@/features/health-records/presentation/screens/HealthTimelineScreen';
import { lazyScreen } from '@/app/navigation/lazyScreen';
import type { HealthStackParamList } from '@/app/navigation/types';
import { useTheme } from '@/design-system/theme/ThemeContext';

const HealthRecordDetailScreen = lazyScreen(() =>
  import('@/features/health-records/presentation/screens/HealthRecordDetailScreen').then(m => ({
    default: m.HealthRecordDetailScreen,
  })),
);

const Stack = createNativeStackNavigator<HealthStackParamList>();

export function HealthNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.headerGradientStart },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="HealthTimeline" component={HealthTimelineScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="HealthRecordDetail"
        component={HealthRecordDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
