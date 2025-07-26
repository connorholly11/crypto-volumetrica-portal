/**
 * Debug test for user endpoint
 */

const BASE_URL = 'http://localhost:3000/api';

describe('Debug User Endpoint', () => {
  it('should create and fetch user', async () => {
    // Step 1: Create user
    console.log('Creating user...');
    const createResponse = await fetch(`${BASE_URL}/users/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Debug',
        lastName: 'Test',
        email: `debug${Date.now()}@example.com`,
        country: 'US'
      })
    });

    const createData = await createResponse.json();
    console.log('Create response:', createData);
    
    expect(createResponse.status).toBe(201);
    expect(createData.success).toBe(true);
    expect(createData.data.userId).toBeDefined();

    const userId = createData.data.userId;
    console.log('Created user ID:', userId);

    // Step 2: Fetch user details
    console.log('Fetching user details...');
    const getResponse = await fetch(`${BASE_URL}/users/${userId}`);
    console.log('Get response status:', getResponse.status);
    
    const getData = await getResponse.json();
    console.log('Get response data:', getData);

    expect(getResponse.status).toBe(200);
    expect(getData.success).toBe(true);
    expect(getData.data.userId).toBe(userId);
  }, 30000); // 30 second timeout
});