import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '@/core/storage/storage';
import { darkColors, lightColors, type ThemeColors } from '@/design-system/theme/colors';
import { borderRadius, shadows, spacing } from '@/design-system/theme/spacing';
import { fontSizes, typography } from '@/design-system/theme/typography';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  typography: typeof typography;
  fontSizes: typeof fontSizes;
}

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = 'theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    void storage.get<ThemeMode>(THEME_KEY).then(saved => {
      if (saved) {
        setThemeModeState(saved);
      }
    });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    void storage.set(THEME_KEY, mode);
  }, []);

  const resolvedMode: 'light' | 'dark' =
    themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;

  const theme: Theme = useMemo(
    () => ({
      mode: resolvedMode,
      colors: resolvedMode === 'dark' ? darkColors : lightColors,
      spacing,
      borderRadius,
      shadows,
      typography,
      fontSizes,
    }),
    [resolvedMode],
  );

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      setThemeMode,
      isDark: resolvedMode === 'dark',
    }),
    [theme, themeMode, setThemeMode, resolvedMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
