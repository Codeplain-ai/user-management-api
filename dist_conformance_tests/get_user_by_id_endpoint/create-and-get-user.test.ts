import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'http://localhost:8000';

describe('Acceptance Test - Create and Retrieve User', () => {
  
  test('acceptance_test_create_and_retrieve_user', async () => {
    // Note: Using a timestamp-based email to ensure test repeatability
    // while maintaining the spirit of the acceptance test requirement
    const timestamp = Date.now();
    const testEmail = `john.doe.${timestamp}@example.com`;
    const testName = 'John Doe';
    const testPassword = 'password';
    
    console.log(`[Acceptance Test] Starting test with email: ${testEmail}`);
    
    // Step 1: Create a new user
    let createResponse;
    try {
      createResponse = await axios.post(`${API_BASE_URL}/users`, {
        name: testName,
        email: testEmail,
        password: testPassword
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('[Acceptance Test] Failed to create user:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message
      });
      throw new Error(`Failed to create user: ${axiosError.message}. Response: ${JSON.stringify(axiosError.response?.data)}`);
    }
    
    // Verify user was created successfully
    expect(createResponse.status).toBe(201);
    expect(createResponse.data).toBeDefined();
    expect(createResponse.data.status).toBe('success');
    expect(createResponse.data.data).toBeDefined();
    expect(createResponse.data.data.id).toBeDefined();
    
    const createdUserId = createResponse.data.data.id;
    console.log(`[Acceptance Test] User created successfully with ID: ${createdUserId}`);
    
    // Step 2: Retrieve the user by their ID
    let getResponse;
    try {
      getResponse = await axios.get(`${API_BASE_URL}/users/${createdUserId}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('[Acceptance Test] Failed to retrieve user:', {
        userId: createdUserId,
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message
      });
      throw new Error(`Failed to retrieve user with ID ${createdUserId}: ${axiosError.message}. Response: ${JSON.stringify(axiosError.response?.data)}`);
    }
    
    // Step 3: Verify the response status code is 200
    expect(getResponse.status).toBe(200);
    console.log(`[Acceptance Test] User retrieved successfully with status 200`);
    
    // Step 4: Verify the response structure
    expect(getResponse.data).toBeDefined();
    expect(getResponse.data.status).toBe('success');
    expect(getResponse.data.data).toBeDefined();
    
    const retrievedUser = getResponse.data.data;
    
    // Step 5: Verify the name is correctly retrieved
    expect(retrievedUser.name).toBeDefined();
    expect(typeof retrievedUser.name).toBe('string');
    expect(retrievedUser.name).toBe(testName);
    console.log(`[Acceptance Test] Name verified: expected="${testName}", actual="${retrievedUser.name}"`);
    
    // Step 6: Verify the email is correctly retrieved
    expect(retrievedUser.email).toBeDefined();
    expect(typeof retrievedUser.email).toBe('string');
    expect(retrievedUser.email).toBe(testEmail);
    console.log(`[Acceptance Test] Email verified: expected="${testEmail}", actual="${retrievedUser.email}"`);
    
    // Additional verification: Ensure the ID matches
    expect(retrievedUser.id).toBe(createdUserId);
    console.log(`[Acceptance Test] User ID verified: ${createdUserId}`);
    
    // Additional verification: Ensure required fields are present
    expect(retrievedUser.created_at).toBeDefined();
    expect(retrievedUser.updated_at).toBeDefined();
    
    // Additional verification: Ensure password is NOT returned
    expect(retrievedUser).not.toHaveProperty('password');
    
    console.log(`[Acceptance Test] All verifications passed successfully`);
  });
});