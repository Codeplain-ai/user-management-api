import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Helper function to create a test user
async function createTestUser(name: string, email: string, password: string) {
  const response = await axios.post(`${API_BASE_URL}/users`, {
    name,
    email,
    password
  });
  return response.data.data;
}

// Helper function to generate unique email
function generateUniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

describe('GET /users/{id} - Conformance Tests', () => {
  
  test('get_users_by_id_response_structure', async () => {
    // Create a user first
    const email = generateUniqueEmail();
    const createdUser = await createTestUser('John Doe', email, 'password123');
    
    // Get the user by ID
    const response = await axios.get(`${API_BASE_URL}/users/${createdUser.id}`);
    
    // Verify status code
    expect(response.status).toBe(200);
    
    // Verify response body structure
    expect(response.data).toBeDefined();
    expect(typeof response.data).toBe('object');
    
    // Verify exactly two top-level properties
    const topLevelKeys = Object.keys(response.data);
    expect(topLevelKeys).toHaveLength(2);
    expect(topLevelKeys).toContain('status');
    expect(topLevelKeys).toContain('data');
    
    // Verify 'data' property structure
    expect(response.data.data).toBeDefined();
    expect(typeof response.data.data).toBe('object');
    
    // Verify exactly five properties in 'data'
    const dataKeys = Object.keys(response.data.data);
    expect(dataKeys).toHaveLength(5);
    expect(dataKeys).toContain('id');
    expect(dataKeys).toContain('name');
    expect(dataKeys).toContain('email');
    expect(dataKeys).toContain('created_at');
    expect(dataKeys).toContain('updated_at');
    
    // Verify all fields are defined
    expect(response.data.data.id).toBeDefined();
    expect(response.data.data.name).toBeDefined();
    expect(response.data.data.email).toBeDefined();
    expect(response.data.data.created_at).toBeDefined();
    expect(response.data.data.updated_at).toBeDefined();
  });

  test('get_users_by_id_response_status_field', async () => {
    // Create a user first
    const email = generateUniqueEmail();
    const createdUser = await createTestUser('Jane Smith', email, 'password456');
    
    // Get the user by ID
    const response = await axios.get(`${API_BASE_URL}/users/${createdUser.id}`);
    
    // Verify status code
    expect(response.status).toBe(200);
    
    // Verify 'status' field
    expect(response.data.status).toBeDefined();
    expect(typeof response.data.status).toBe('string');
    expect(response.data.status).toBe('success');
  });

  test('get_users_by_id_with_invalid_uuid_format_returns_400', async () => {
    try {
      await axios.get(`${API_BASE_URL}/users/not-a-valid-uuid`);
      fail('Expected request to fail with 400 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response).toBeDefined();
      expect(axiosError.response!.status).toBe(400);
      
      const responseData = axiosError.response!.data as any;
      expect(responseData.error).toBe('validation_error');
      
      // Verify message contains UUID/uuid and valid/invalid
      expect(responseData.message).toBeDefined();
      expect(typeof responseData.message).toBe('string');
      const messageLower = responseData.message.toLowerCase();
      expect(messageLower).toMatch(/uuid/);
      expect(messageLower).toMatch(/valid|invalid/);
    }
  });

  test('get_users_by_id_invalid_uuid_error_structure', async () => {
    try {
      await axios.get(`${API_BASE_URL}/users/invalid-uuid-format`);
      fail('Expected request to fail with 400 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response).toBeDefined();
      expect(axiosError.response!.status).toBe(400);
      
      const responseData = axiosError.response!.data as any;
      
      // Verify exactly four properties
      const keys = Object.keys(responseData);
      expect(keys).toHaveLength(4);
      expect(keys).toContain('status');
      expect(keys).toContain('error');
      expect(keys).toContain('message');
      expect(keys).toContain('field');
      
      // Verify values
      expect(responseData.status).toBe('error');
      expect(typeof responseData.status).toBe('string');
      
      expect(responseData.error).toBe('validation_error');
      expect(typeof responseData.error).toBe('string');
      
      expect(responseData.field).toBe('id');
      expect(typeof responseData.field).toBe('string');
      
      expect(responseData.message).toBeDefined();
      expect(typeof responseData.message).toBe('string');
    }
  });

  test('get_users_by_id_with_nonexistent_uuid_returns_404', async () => {
    // Use a valid UUID format that doesn't exist
    const nonexistentUuid = '123e4567-e89b-12d3-a456-426614174000';
    
    try {
      await axios.get(`${API_BASE_URL}/users/${nonexistentUuid}`);
      fail('Expected request to fail with 404 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response).toBeDefined();
      expect(axiosError.response!.status).toBe(404);
      
      const responseData = axiosError.response!.data as any;
      expect(responseData.error).toBe('user_not_found');
    }
  });

  test('get_users_by_id_not_found_error_structure', async () => {
    // Use a valid UUID format that doesn't exist
    const nonexistentUuid = '987e6543-e21b-45d3-a654-123456789abc';
    
    try {
      await axios.get(`${API_BASE_URL}/users/${nonexistentUuid}`);
      fail('Expected request to fail with 404 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response).toBeDefined();
      expect(axiosError.response!.status).toBe(404);
      
      const responseData = axiosError.response!.data as any;
      
      // Verify at least three properties
      expect(responseData).toBeDefined();
      expect(typeof responseData).toBe('object');
      expect(responseData.status).toBeDefined();
      expect(responseData.error).toBeDefined();
      expect(responseData.message).toBeDefined();
      
      // Verify values
      expect(responseData.status).toBe('error');
      expect(typeof responseData.status).toBe('string');
      
      expect(responseData.error).toBe('user_not_found');
      expect(typeof responseData.error).toBe('string');
      
      expect(typeof responseData.message).toBe('string');
      expect(responseData.message).toContain(nonexistentUuid);
    }
  });

  test('get_users_by_id_response_does_not_contain_password', async () => {
    // Create a user with a password
    const email = generateUniqueEmail();
    const createdUser = await createTestUser('Bob Johnson', email, 'secretPassword789');
    
    // Get the user by ID
    const response = await axios.get(`${API_BASE_URL}/users/${createdUser.id}`);
    
    // Verify status code
    expect(response.status).toBe(200);
    
    // Verify password is NOT in the response
    expect(response.data.data).toBeDefined();
    expect(response.data.data.hasOwnProperty('password')).toBe(false);
    expect(Object.keys(response.data.data)).not.toContain('password');
  });

  test('get_users_by_id_timestamps_are_iso8601_format', async () => {
    // Create a user first
    const email = generateUniqueEmail();
    const createdUser = await createTestUser('Alice Williams', email, 'password999');
    
    // Get the user by ID
    const response = await axios.get(`${API_BASE_URL}/users/${createdUser.id}`);
    
    // Verify status code
    expect(response.status).toBe(200);
    
    const userData = response.data.data;
    
    // Verify created_at
    expect(userData.created_at).toBeDefined();
    expect(typeof userData.created_at).toBe('string');
    
    // Check ISO 8601 pattern (YYYY-MM-DDTHH:mm:ss.sssZ)
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(userData.created_at).toMatch(iso8601Pattern);
    
    // Verify it's a valid date
    const createdAtDate = new Date(userData.created_at);
    expect(createdAtDate.toString()).not.toBe('Invalid Date');
    expect(createdAtDate.toISOString()).toBe(userData.created_at);
    
    // Verify updated_at
    expect(userData.updated_at).toBeDefined();
    expect(typeof userData.updated_at).toBe('string');
    expect(userData.updated_at).toMatch(iso8601Pattern);
    
    // Verify it's a valid date
    const updatedAtDate = new Date(userData.updated_at);
    expect(updatedAtDate.toString()).not.toBe('Invalid Date');
    expect(updatedAtDate.toISOString()).toBe(userData.updated_at);
  });
});