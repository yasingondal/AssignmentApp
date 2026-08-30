import React from 'react';
import { StatusBar } from 'react-native';
import { AppProviders } from '@/app/providers/AppProviders';
import { RootNavigator } from '@/app/navigation/RootNavigator';

function AppContent() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <RootNavigator />
    </>
  );
}

function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;
