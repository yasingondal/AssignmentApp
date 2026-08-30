import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '@/design-system/theme/ThemeContext';
import { ToastProvider } from '@/design-system/components/Toast';
import { ErrorBoundary } from '@/design-system/components/ErrorBoundary';
import { SessionGuard } from '@/app/providers/SessionGuard';
import { initMockApi } from '@/core/api/mockApiRouter';
import { networkService } from '@/core/network/networkService';
import { syncService } from '@/core/sync/syncService';
import { useSessionStore } from '@/core/auth/sessionStore';
import { useSyncQueueStore } from '@/core/sync/syncQueue';
import { consultationRepository } from '@/features/consultation/data/consultationRepository';
import { useCartStore } from '@/features/shop/data/cartStore';
import '@/core/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

function AppBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      initMockApi();
      networkService.init();

      await Promise.all([
        useSessionStore.getState().hydrate(),
        useSyncQueueStore.getState().hydrate(),
        useCartStore.getState().hydrate(),
        consultationRepository.hydrate(),
      ]);

      if (cancelled) {
        return;
      }

      // Subscribe only after queue/bookings are hydrated so reconnect sync sees pending ops.
      syncService.init();
      if (networkService.isOnline()) {
        void syncService.processQueue();
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ErrorBoundary>
              <ToastProvider>
                <SessionGuard>
                  <AppBootstrap>{children}</AppBootstrap>
                </SessionGuard>
              </ToastProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
