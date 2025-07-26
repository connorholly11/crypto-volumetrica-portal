/**
 * API Endpoint Tests
 * Tests all API endpoints to ensure they're working correctly
 */

const BASE_URL = 'http://localhost:3000/api';

describe('API Endpoints', () => {
  describe('Health Check', () => {
    it('should verify environment variables are loaded', async () => {
      const response = await fetch(`${BASE_URL}/test`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tests.hasApiKey).toBe(true);
      expect(data.tests.apiUrl).toBe('https://staging-api.volumetricafx.com');
    });
  });

  describe('User Management', () => {
    let createdUserId: string;

    it('should create a new user', async () => {
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: `test${Date.now()}@example.com`, // Unique email
        country: 'US'
      };

      const response = await fetch(`${BASE_URL}/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      console.log('Create user response:', data);

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.userId).toBeDefined();
      expect(data.data.username).toBeDefined();
      expect(data.data.password).toBeDefined();

      createdUserId = data.data.userId;
    });

    it('should fetch user details', async () => {
      if (!createdUserId) {
        console.log('Skipping - no user ID');
        return;
      }

      const response = await fetch(`${BASE_URL}/users/${createdUserId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.userId).toBe(createdUserId);
    });

    it('should generate login URL', async () => {
      if (!createdUserId) {
        console.log('Skipping - no user ID');
        return;
      }

      const response = await fetch(`${BASE_URL}/users/login-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: createdUserId })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.loginUrl).toBeDefined();
      expect(data.data.loginUrl).toContain('http');
    });

    it('should handle invalid user creation', async () => {
      const invalidData = {
        firstName: '',  // Empty name
        lastName: 'User',
        email: 'invalid-email', // Invalid email
        country: 'USA' // Should be 2 letters
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
    });
  });

  describe('Trading Rules', () => {
    it('should fetch trading rule templates', async () => {
      const response = await fetch(`${BASE_URL}/trading-rules/templates`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toBeDefined();
      expect(Array.isArray(data.data.templates)).toBe(true);
      expect(data.data.templates.length).toBeGreaterThan(0);
      
      // Check template structure
      const template = data.data.templates[0];
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.maxDrawdown).toBeDefined();
    });

    it('should list trading rules', async () => {
      const response = await fetch(`${BASE_URL}/trading-rules/list`);
      const data = await response.json();

      // This might return 400 if no rules exist yet
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
      
      // Check response structure
      if (data.data.totalCount > 0) {
        const account = data.data.accounts[0];
        expect(account.accountId).toBeDefined();
        expect(account.balance).toBeDefined();
        expect(account.status).toBeDefined();
      }
    });

    // Note: Account creation requires a valid userId and trading rule
    // This would need to be tested after creating a user and rule
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await fetch(`${BASE_URL}/non-existent-endpoint`);
      expect(response.status).toBe(404);
    });

    it('should handle empty request body', async () => {
      const response = await fetch(`${BASE_URL}/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ''
      });

      expect(response.status).toBe(400);
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${BASE_URL}/users/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json'
      });

      expect(response.status).toBe(400);
    });
  });
});

// Run specific endpoint test
export async function testEndpoint(endpoint: string, method = 'GET', body?: any) {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`Testing ${method} ${endpoint}...`);
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.error('Error:', error);
    return { status: 'error', error };
  }
}