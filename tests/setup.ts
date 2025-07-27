// Test setup file
import '@testing-library/jest-dom';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables for tests
config({ path: join(__dirname, '..', '.env.local') });

// Mock fetch for Node environment
global.fetch = require('node-fetch');

// Suppress console logs during tests unless debugging
if (process.env.DEBUG_TESTS !== 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Common test utilities
export const TEST_API_URL = process.env.VOLUMETRICA_API_URL || 'https://staging-api.volumetricafx.com';
export const TEST_API_KEY = process.env.VOLUMETRICA_API_KEY || 'test-api-key';

// Mock Volumetrica responses
export const mockVolumetricaResponses = {
  user: {
    userId: 'test-user-id',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    country: 'US',
  },
  account: {
    accountId: 'test-account-id',
    userId: 'test-user-id',
    balance: 100000,
    equity: 100000,
    status: 'Enabled',
    currency: 'USD',
  },
  tradingRule: {
    ruleId: 'test-rule-id',
    name: 'Test Rule',
    maxDrawdown: 10,
    dailyLossLimit: 5,
    profitTarget: 20,
  },
};

// Helper to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));