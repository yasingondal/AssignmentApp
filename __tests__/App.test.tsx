jest.mock('@/app/providers/AppProviders', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/design-system/theme/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));

jest.mock('@/app/navigation/RootNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    RootNavigator: () => React.createElement(Text, null, 'RootNavigator'),
  };
});

import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<App />);
    expect(getByText('RootNavigator')).toBeTruthy();
  });
});
