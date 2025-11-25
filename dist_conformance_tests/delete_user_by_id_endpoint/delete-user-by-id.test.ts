import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface ErrorResponse {
  status?: string;
  error?: string;
  message?: string;
  field?: string;
  details?: string;
}

interface UserResponse {
  status: string;
  data: {
    id: string;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Helper function to create a test user
 */
async function createTestUser(name: string, email: string, password: string): Promise<string> {
  const response = await axios.post<UserResponse>(`${API_BASE_URL}/users`, {
    name,
    email,
    password
  });
  return response.data.data.id;
}

/**
 * Helper function to generate unique email
 */
function generateUniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

describe('DELETE /users/{id} - Conformance Tests', () => {
  
  describe('Test 1: delete_users_by_id_with_invalid_uuid_format_returns_400', () => {
    it('should return 400 with validation_error when UUID format is invalid', async () => {
      const invalidUuid = 'not-a-valid-uuid';
      
      try {
        await axios.delete(`${API_BASE_URL}/users/${invalidUuid}`);
        fail('Expected request to fail with 400 status');
      } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>;
        
        expect(axiosError.response).toBeDefined();
        expect(axiosError.response!.status).toBe(400);
        
        const responseData = axiosError.response!.data;
        expect(responseData.error).toBe('validation_error');
        expect(responseData.message).toBeDefined();
        expect(typeof responseData.message).toBe('string');
        
        const messageLower = responseData.message!.toLowerCase();
        expect(messageLower).toMatch(/uuid/);
        expect(messageLower).toMatch(/valid|invalid/);
      }
    });
  });

  describe('Test 2: delete_users_by_id_invalid_uuid_error_structure', () => {
    it('should return complete error structure with exactly four properties for invalid UUID', async () => {
      const invalidUuid = 'invalid-uuid-format';
      
      try {
        await axios.delete(`${API_BASE_URL}/users/${invalidUuid}`);
        fail('Expected request to fail with 400 status');
      } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>;
        
        expect(axiosError.response).toBeDefined();
        expect(axiosError.response!.status).toBe(400);
        
        const responseData = axiosError.response!.data;
        expect(responseData).toBeDefined();
        expect(typeof responseData).toBe('object');
        
        const keys = Object.keys(responseData);
        expect(keys).toHaveLength(4);
        expect(keys).toContain('status');
        expect(keys).toContain('error');
        expect(keys).toContain('message');
        expect(keys).toContain('field');
        
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
  });

  describe('Test 3: delete_users_by_id_with_nonexistent_uuid_returns_404', () => {
    it('should return 404 with user_not_found error for valid but non-existent UUID', async () => {
      const nonExistentUuid = '123e4567-e89b-12d3-a456-426614174000';
      
      try {
        await axios.delete(`${API_BASE_URL}/users/${nonExistentUuid}`);
        fail('Expected request to fail with 404 status');
      } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>;
        
        expect(axiosError.response).toBeDefined();
        expect(axiosError.response!.status).toBe(404);
        
        const responseData = axiosError.response!.data;
        expect(responseData.error).toBe('user_not_found');
      }
    });
  });

  describe('Test 4: delete_users_by_id_not_found_error_structure', () => {
    it('should return complete error structure with at least three properties for non-existent user', async () => {
      const nonExistentUuid = '987e6543-e21b-45d3-a654-123456789abc';
      
      try {
        await axios.delete(`${API_BASE_URL}/users/${nonExistentUuid}`);
        fail('Expected request to fail with 404 status');
      } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>;
        
        expect(axiosError.response).toBeDefined();
        expect(axiosError.response!.status).toBe(404);
        
        const responseData = axiosError.response!.data;
        expect(responseData).toBeDefined();
        expect(typeof responseData).toBe('object');
        
        const keys = Object.keys(responseData);
        expect(keys.length).toBeGreaterThanOrEqual(3);
        expect(keys).toContain('status');
        expect(keys).toContain('error');
        expect(keys).toContain('message');
        
        expect(responseData.status).toBe('error');
        expect(typeof responseData.status).toBe('string');
        
        expect(responseData.error).toBe('user_not_found');
        expect(typeof responseData.error).toBe('string');
        
        expect(typeof responseData.message).toBe('string');
        expect(responseData.message).toContain('987e6543-e21b-45d3-a654-123456789abc');
      }
    });
  });

  describe('Test 5: delete_users_by_id_response_has_no_content_body', () => {
    it('should return 204 with no content body for successful deletion', async () => {
      const email = generateUniqueEmail();
      const userId = await createTestUser('Test User', email, 'password123');
      
      const response: AxiosResponse = await axios.delete(`${API_BASE_URL}/users/${userId}`);
      
      expect(response.status).toBe(204);
      
      const body = response.data;
      const isEmptyBody = body === undefined || 
                         body === null || 
                         body === '' || 
                         (typeof body === 'object' && Object.keys(body).length === 0);
      
      expect(isEmptyBody).toBe(true);
    });
  });

  describe('Test 6: delete_users_by_id_idempotency_second_delete_returns_404', () => {
    it('should return 404 on second delete attempt demonstrating idempotency', async () => {
      const email = generateUniqueEmail();
      const userId = await createTestUser('Idempotency Test User', email, 'testpass123');
      
      const firstDeleteResponse: AxiosResponse = await axios.delete(`${API_BASE_URL}/users/${userId}`);
      expect(firstDeleteResponse.status).toBe(204);
      
      try {
        await axios.delete(`${API_BASE_URL}/users/${userId}`);
        fail('Expected second delete request to fail with 404 status');
      } catch (error) {
        const axiosError = error as AxiosError<ErrorResponse>;
        
        expect(axiosError.response).toBeDefined();
        expect(axiosError.response!.status).toBe(404);
        
        const responseData = axiosError.response!.data;
        expect(responseData.error).toBe('user_not_found');
      }
    });
  });
});