const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  displayName: 'Integration Tests',
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.[jt]s?(x)',
    '<rootDir>/tests/integration/**/*.spec.[jt]s?(x)'
  ],
  testTimeout: 30000, // 30 seconds for integration tests
};