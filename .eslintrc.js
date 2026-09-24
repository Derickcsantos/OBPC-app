module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['dist/', '.expo/', 'android/', 'ios/'],
  overrides: [
    {
      files: ['**/*.test.*', '**/__tests__/**/*', 'jest.setup.js'],
      env: { jest: true },
    },
  ],
};
