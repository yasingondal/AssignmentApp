import { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Card, ScreenContainer, ScreenHeader } from '@/design-system/components';
import { useTheme } from '@/design-system/theme/ThemeContext';
import type { ThemeMode } from '@/design-system/theme/ThemeContext';
import { environment } from '@/core/config/environment';
import { updateMockFailureConfig } from '@/core/config/environment';
import { useTranslation } from 'react-i18next';
import { performanceMonitor } from '@/core/performance/performanceMonitor';
import { useSessionStore } from '@/core/auth/sessionStore';
import { useToast } from '@/design-system/components/Toast';
import { networkService } from '@/core/network/networkService';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { syncService } from '@/core/sync/syncService';
import { useSyncQueueStore } from '@/core/sync/syncQueue';

export function SettingsScreen() {
  const { themeMode, setThemeMode } = useTheme();
  const { t, i18n } = useTranslation();
  const [, setTick] = useState(0);
  const clearSession = useSessionStore(s => s.clearSession);
  const toast = useToast();
  const networkStatus = useNetworkStatus();
  const pendingSyncCount = useSyncQueueStore(
    s => s.operations.filter(op => op.status === 'pending' || op.status === 'failed' || op.status === 'syncing').length,
  );

  const refresh = () => setTick(n => n + 1);
  const mf = environment.mockFailure;
  const forcedOffline = networkService.isForcedOffline();

  const toggle = (key: keyof typeof mf, value?: boolean | number) => {
    if (typeof value === 'number') {
      updateMockFailureConfig({ [key]: value });
    } else if (typeof mf[key] === 'boolean') {
      updateMockFailureConfig({ [key]: !mf[key] });
    }
    refresh();
  };

  const modes: ThemeMode[] = ['light', 'dark', 'system'];

  return (
    <ScreenContainer offline={networkStatus === 'offline'}>
      <ScreenHeader title={t('settings.title')} subtitle="Preferences & app settings" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.section}>
          <Text variant="label">Offline</Text>
          <Text variant="caption" color="muted">
            Network: {networkStatus}
            {pendingSyncCount ? ` · ${pendingSyncCount} queued sync op(s)` : ''}
          </Text>
          <Button
            title={forcedOffline ? 'Forced Offline: ON' : 'Force Offline: OFF'}
            size="sm"
            variant={forcedOffline ? 'gold' : 'outline'}
            onPress={() => {
              const next = !networkService.isForcedOffline();
              networkService.setForcedOffline(next);
              refresh();
              toast.showInfo(next ? 'Forced offline — APIs use cache / queue' : 'Online mode restored');
              if (!next) {
                void syncService.processQueue();
              }
            }}
          />
          {pendingSyncCount > 0 && !forcedOffline ? (
            <Button
              title="Sync queued bookings now"
              size="sm"
              variant="outline"
              onPress={() => {
                void syncService.processQueue().then(() => {
                  toast.showInfo('Sync finished');
                  refresh();
                });
              }}
              style={styles.mt}
            />
          ) : null}
        </Card>

        <Card style={styles.section}>
          <Text variant="label">{t('settings.theme')}</Text>
          <View style={styles.row}>
            {modes.map(mode => (
              <Button
                key={mode}
                title={mode}
                size="sm"
                variant={themeMode === mode ? 'gold' : 'outline'}
                onPress={() => setThemeMode(mode)}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text variant="label">{t('settings.language')}</Text>
          <View style={styles.row}>
            <Button
              title="English"
              size="sm"
              variant={i18n.language === 'en' ? 'gold' : 'outline'}
              onPress={() => i18n.changeLanguage('en')}
            />
            <Button
              title="हिंदी"
              size="sm"
              variant={i18n.language === 'hi' ? 'gold' : 'outline'}
              onPress={() => i18n.changeLanguage('hi')}
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text variant="label">Session</Text>
          <Button
            title="Simulate Session Expiry"
            size="sm"
            variant="outline"
            onPress={() => {
              clearSession();
              toast.showWarning('Session expired');
            }}
          />
        </Card>

        {__DEV__ && (
          <Card style={styles.section}>
            <Text variant="label">Dev: Reliability Simulation</Text>
            <Button
              title={`Random Failures: ${mf.enabled ? 'ON' : 'OFF'}`}
              size="sm"
              variant="outline"
              onPress={() => toggle('enabled')}
            />
            <Button
              title={`Slow Network (2s): ${mf.slowNetworkMs > 0 ? 'ON' : 'OFF'}`}
              size="sm"
              variant="outline"
              onPress={() => toggle('slowNetworkMs', mf.slowNetworkMs > 0 ? 0 : 2000)}
              style={styles.mt}
            />
            <Button
              title={`Empty Response: ${mf.simulateEmptyResponse ? 'ON' : 'OFF'}`}
              size="sm"
              variant="outline"
              onPress={() => toggle('simulateEmptyResponse')}
              style={styles.mt}
            />
            <Button
              title={`Invalid JSON: ${mf.simulateInvalidJson ? 'ON' : 'OFF'}`}
              size="sm"
              variant="outline"
              onPress={() => toggle('simulateInvalidJson')}
              style={styles.mt}
            />
            <Button
              title={`Partial Response: ${mf.simulatePartialResponse ? 'ON' : 'OFF'}`}
              size="sm"
              variant="outline"
              onPress={() => toggle('simulatePartialResponse')}
              style={styles.mt}
            />
            <Button
              title={`Session Expiry on API: ${mf.simulateSessionExpiry ? 'ON' : 'OFF'}`}
              size="sm"
              variant="outline"
              onPress={() => toggle('simulateSessionExpiry')}
              style={styles.mt}
            />
            <Button
              title="Run Performance Benchmark"
              size="sm"
              variant="outline"
              onPress={() => {
                const r = performanceMonitor.runBenchmark();
                toast.showInfo(
                  `Pages: docs ${r.doctorsPageMs}ms · shop ${r.productsPageMs}ms · health ${r.healthRecordsPageMs}ms`,
                );
              }}
              style={styles.mt}
            />
          </Card>
        )}

        <Text variant="caption" color="muted" style={styles.footer}>
          Amrutam Super App v0.0.1 · {environment.env}
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  section: { gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mt: { marginTop: 8 },
  footer: { textAlign: 'center', marginTop: 24 },
});
