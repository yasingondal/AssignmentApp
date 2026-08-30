import React from 'react';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from '@/app/navigation/MainTabNavigator';
import { LoginScreen } from '@/features/auth/presentation/screens/LoginScreen';
import type { RootStackParamList } from '@/app/navigation/types';
import { useTheme } from '@/design-system/theme/ThemeContext';
import { environment } from '@/core/config/environment';
import { navigationRef } from '@/app/navigation/navigationRef';
import { useSessionStore } from '@/core/auth/sessionStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['amrutam://', 'https://amrutam.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          ConsultationTab: {
            screens: {
              DoctorDetail: 'doctor/:doctorId',
              BookingConfirm: 'doctor/:doctorId/book/:slotId',
              UpcomingConsultations: 'consultations',
              BookingDetail: 'consultations/:bookingId',
            },
          },
          ShopTab: {
            screens: {
              ProductDetail: 'product/:productId',
              Cart: 'cart',
              Checkout: 'checkout',
              Wishlist: 'wishlist',
            },
          },
          HealthTab: {
            screens: {
              HealthTimeline: 'health',
              HealthRecordDetail: 'health/:recordId',
            },
          },
        },
      },
      Auth: 'login',
    },
  },
};

export function RootNavigator() {
  const { theme } = useTheme();
  const isAuthenticated = useSessionStore(s => s.isAuthenticated);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={environment.featureFlags.deepLinking ? linking : undefined}
      theme={{
        dark: theme.mode === 'dark',
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.info,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
