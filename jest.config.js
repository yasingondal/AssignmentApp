module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/src/testing/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@shopify/flash-list|@tanstack)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};
