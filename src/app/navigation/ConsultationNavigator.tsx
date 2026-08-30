import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DoctorListScreen } from '@/features/consultation/presentation/screens/DoctorListScreen';
import { lazyScreen } from '@/app/navigation/lazyScreen';
import type { ConsultationStackParamList } from '@/app/navigation/types';
import { useTheme } from '@/design-system/theme/ThemeContext';

const DoctorDetailScreen = lazyScreen(() =>
  import('@/features/consultation/presentation/screens/DoctorDetailScreen').then(m => ({
    default: m.DoctorDetailScreen,
  })),
);
const BookingConfirmScreen = lazyScreen(() =>
  import('@/features/consultation/presentation/screens/BookingConfirmScreen').then(m => ({
    default: m.BookingConfirmScreen,
  })),
);
const UpcomingConsultationsScreen = lazyScreen(() =>
  import('@/features/consultation/presentation/screens/UpcomingConsultationsScreen').then(m => ({
    default: m.UpcomingConsultationsScreen,
  })),
);
const BookingDetailScreen = lazyScreen(() =>
  import('@/features/consultation/presentation/screens/BookingDetailScreen').then(m => ({
    default: m.BookingDetailScreen,
  })),
);

const Stack = createNativeStackNavigator<ConsultationStackParamList>();

export function ConsultationNavigator() {
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
      <Stack.Screen name="DoctorList" component={DoctorListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} options={{ title: 'Doctor Details' }} />
      <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="UpcomingConsultations"
        component={UpcomingConsultationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookingDetail"
        component={BookingDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
