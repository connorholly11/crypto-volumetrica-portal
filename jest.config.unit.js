const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  displayName: 'Unit Tests',
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.[jt]s?(x)',
    '<rootDir>/tests/unit/**/*.spec.[jt]s?(x)'
  ],
  testTimeout: 5000, // 5 seconds for unit tests
};