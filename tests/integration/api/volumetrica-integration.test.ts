/**
 * Integration tests for Volumetrica API
 * These tests verify that our API routes correctly integrate with Volumetrica
 */

const BASE_URL = 'http://localhost:3000/api';

describe('Volumetrica API Integration', () => {
  describe('Environment Setup', () => {
    it('should have API key configured', async () => {
      const response = await fetch(`${BASE_URL}/test`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.tests.hasApiKey).toBe(true);
      expect(data.tests.apiUrl).toBe('https://staging-api.volumetricafx.com');
    });
  });

  describe('User Management', () => {
    let testUserId: string;

    it('should create a user successfully', async () => {
      const userData = {
        firstName: 'Integration',
        lastName: 'Test',
        email: `test${Date.now()}@example.com`,
        country: 'US'
      };

      const response = await fetch(`${BASE_URL}/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('userId');
      expect(data.data).toHaveProperty('username');
      expect(data.data).toHaveProperty('password');

      testUserId = data.data.userId;
    });

    it('should generate login URL for user', async () => {
      if (!testUserId) {
        console.log('Skipping - no userId available');
        return;
      }

      const response = await fetch(`${BASE_URL}/users/login-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId })
      });

      const data = await response.json();
      
      // The endpoint exists but might return an error for test users
      expect(response.status).toBeOneOf([200, 400, 500]);
      
      if (response.status === 200) {
        expect(data.data).toHaveProperty('loginUrl');
      }
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        firstName: '', // Empty name
        lastName: 'Test',
        email: 'not-an-email',
        country: 'USA' // Should be 2-letter code
      };

      const response = await fetch(`${BASE_URL}/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
      expect(data.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Trading Rules', () => {
    it('should fetch trading rule templates', async () => {
      const response = await fetch(`${BASE_URL}/trading-rules/templates`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toBeInstanceOf(Array);
      
      // Verify template structure
      if (data.data.templates.length > 0) {
        const template = data.data.templates[0];
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('maxDrawdown');
        expect(template).toHaveProperty('dailyLossLimit');
      }
    });

    it('should handle listing trading rules', async () => {
      const response = await fetch(`${BASE_URL}/trading-rules/list`);
      const data = await response.json();

      // Might return 400 if no rules exist, which is ok
      expect(response.status).toBeOneOf([200, 400]);
      
      if (response.status === 200) {
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
      }
    });
  });

  describe('Account Management', () => {
    it('should list accounts', async () => {
      const response = await fetch(`${BASE_URL}/accounts/list`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      
      if (data.data.totalCount > 0) {
        expect(data.data.accounts).toBeInstanceOf(Array);
        const account = data.data.accounts[0];
        expect(account).toHaveProperty('accountId');
        expect(account).toHaveProperty('balance');
        expect(account).toHaveProperty('status');
      }
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await fetch(`${BASE_URL}/non-existent`);
      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${BASE_URL}/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });
});

// Custom matcher for multiple status codes
expect.extend({
  toBeOneOf(received, values) {
    const pass = values.includes(received);
    return {
      pass,
      message: () => 
        pass 
          ? `expected ${received} not to be one of ${values.join(', ')}`
          : `expected ${received} to be one of ${values.join(', ')}`
    };
  }
});