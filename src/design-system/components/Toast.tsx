import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = String(++toastId);
    setToasts(prev => [...prev.slice(-2), { id, type, message }]);
    setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  const value = useMemo(
    () => ({
      showToast,
      showSuccess: (m: string) => showToast('success', m),
      showError: (m: string) => showToast('error', m),
      showWarning: (m: string) => showToast('warning', m),
      showInfo: (m: string) => showToast('info', m),
    }),
    [showToast],
  );

  const typeColors: Record<ToastType, string> = {
    success: theme.colors.success,
    error: theme.colors.error,
    warning: theme.colors.warning,
    info: theme.colors.info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="box-none">
        {toasts.map(toast => (
          <Pressable
            key={toast.id}
            onPress={() => dismiss(toast.id)}
            style={[styles.toast, { backgroundColor: typeColors[toast.type] }]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Text variant="bodySmall" style={styles.toastText}>{toast.message}</Text>
          </Pressable>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...({ shadowColor: '#0F3D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 }),
  },
  toastText: { color: '#FFFFFF' },
});
