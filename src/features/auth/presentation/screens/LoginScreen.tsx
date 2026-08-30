import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text, Button, Input, ScreenContainer, Card, ScreenHeader } from '@/design-system/components';
import { useSessionStore } from '@/core/auth/sessionStore';
import { useToast } from '@/design-system/components/Toast';
import { FadeInView } from '@/design-system/components/FadeInView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function LoginScreen() {
  const [email, setEmail] = useState('user@amrutam.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const setToken = useSessionStore(s => s.setToken);
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setToken('mock-session-token');
    toast.showSuccess('Signed in successfully');
    setLoading(false);
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Amrutam" subtitle="Ayurvedic Super App" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <FadeInView style={styles.container} accessibilityLabel="Sign in screen">
            <Text variant="body" color="secondary" style={styles.subtitle}>
              Sign in to access consultations, shop, and health records.
            </Text>
            <Card style={styles.card}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                accessibilityLabel="Email address"
              />
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                accessibilityLabel="Password"
              />
              <Button
                title="Sign In"
                variant="gold"
                fullWidth
                loading={loading}
                onPress={handleLogin}
                style={styles.btn}
              />
            </Card>
            <Text variant="caption" color="muted" style={styles.hint}>
              Demo — any email and password works.
            </Text>
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  container: { flex: 1, padding: 24, paddingTop: 16 },
  subtitle: { marginBottom: 20, lineHeight: 22 },
  card: { gap: 16 },
  btn: { marginTop: 8 },
  hint: { textAlign: 'center', marginTop: 20 },
});
