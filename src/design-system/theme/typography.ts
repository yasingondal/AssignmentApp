import { TextStyle } from 'react-native';

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  xxxl: 34,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const typography = {
  h1: {
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.bold,
    lineHeight: 42,
    letterSpacing: -0.5,
  } satisfies TextStyle,
  h2: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    lineHeight: 34,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  h3: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: 28,
    letterSpacing: -0.2,
  } satisfies TextStyle,
  body: { fontSize: fontSizes.md, fontWeight: fontWeights.regular, lineHeight: 24 } satisfies TextStyle,
  bodySmall: { fontSize: fontSizes.sm, fontWeight: fontWeights.regular, lineHeight: 20 } satisfies TextStyle,
  caption: { fontSize: fontSizes.xs, fontWeight: fontWeights.medium, lineHeight: 16, letterSpacing: 0.2 } satisfies TextStyle,
  label: { fontSize: fontSizes.sm, fontWeight: fontWeights.semibold, lineHeight: 18, letterSpacing: 0.3 } satisfies TextStyle,
  button: { fontSize: fontSizes.md, fontWeight: fontWeights.semibold, lineHeight: 22, letterSpacing: 0.4 } satisfies TextStyle,
};
