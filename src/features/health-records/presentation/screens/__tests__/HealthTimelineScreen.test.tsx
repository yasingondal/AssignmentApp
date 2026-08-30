import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/design-system/theme/ThemeContext';
import { ErrorBoundary } from '@/design-system/components/ErrorBoundary';
import { initMockApi } from '@/core/api/mockApiRouter';
import { HealthTimelineScreen } from '@/features/health-records/presentation/screens/HealthTimelineScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  };
});

initMockApi();

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderScreen() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ErrorBoundary>
              <HealthTimelineScreen />
            </ErrorBoundary>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>,
  );
}

describe('HealthTimelineScreen', () => {
  jest.setTimeout(30000);

  it('renders patient timeline with all record type filters', async () => {
    const screen = renderScreen();
    await waitFor(
      () => {
        expect(screen.getByText('Patient Timeline')).toBeTruthy();
        expect(screen.getByText('All types')).toBeTruthy();
        expect(screen.getAllByText('Lab Report').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Prescription').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Consultation').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Vaccination').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Allergy').length).toBeGreaterThan(0);
      },
      { timeout: 20000 },
    );
  });
});
