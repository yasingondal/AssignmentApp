import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View, Text as RNText } from 'react-native';
import { Text } from '@/design-system/components/Text';
import { useTheme } from '@/design-system/theme/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {label ? (
        <Text variant="label" style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[
          styles.input,
          theme.shadows.sm,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
            color: theme.colors.text,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.textMuted}
        accessibilityLabel={label ?? props.placeholder}
        {...props}
      />
      {error ? (
        <Text variant="caption" color="error" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function SearchInput(props: Omit<InputProps, 'label'> & { onClear?: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.searchWrap, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.borderLight }]}>
      <RNText style={{ fontSize: 16, marginRight: 8, opacity: 0.5 }}>🔍</RNText>
      <TextInput
        style={[styles.searchInput, { color: theme.colors.text }]}
        placeholderTextColor={theme.colors.textMuted}
        placeholder="Search..."
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel={props.placeholder ?? 'Search'}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
});
