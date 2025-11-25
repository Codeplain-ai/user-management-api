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
async function createTestUser(name: string, email: string, password: string): Promise<{ id: string; email: string }> {
  try {
    const response = await axios.post<UserResponse>(`${API_BASE_URL}/users`, {
      name,
      email,
      password
    });
    
    if (response.status !== 201) {
      throw new Error(`Expected status 201 but got ${response.status}`);
    }
    
    if (!response.data.data || !response.data.data.id) {
      throw new Error(`Invalid response structure: ${JSON.stringify(response.data)}`);
    }
    
    return {
      id: response.data.data.id,
      email: response.data.data.email
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to create test user: ${error.message}. ` +
        `Status: ${error.response?.status}, ` +
        `Response: ${JSON.stringify(error.response?.data)}`
      );
    }
    throw error;
  }
}

/**
 * Helper function to generate unique email based on timestamp
 */
function generateUniqueEmail(baseEmail: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const [localPart, domain] = baseEmail.split('@');
  return `${localPart}-${timestamp}-${random}@${domain}`;
}

describe('DELETE /users/{id} - Acceptance Test', () => {
  
  it('should successfully delete a user and verify user no longer exists', async () => {
    // Step 1: Create a new user
    const uniqueEmail = generateUniqueEmail('john.doe@example.com');
    const userName = 'John Doe';
    const userPassword = 'password';
    
    let userId: string;
    let userEmail: string;
    
    try {
      const createdUser = await createTestUser(userName, uniqueEmail, userPassword);
      userId = createdUser.id;
      userEmail = createdUser.email;
    } catch (error) {
      fail(`Step 1 Failed - Could not create test user: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    
    expect(userId).toBeDefined();
    expect(typeof userId).toBe('string');
    expect(userId.length).toBeGreaterThan(0);
    
    // Step 2: Delete the user by their ID
    let deleteResponse: AxiosResponse;
    
    try {
      deleteResponse = await axios.delete(`${API_BASE_URL}/users/${userId}`);
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      fail(
        `Step 2 Failed - Could not delete user with ID '${userId}' and email '${userEmail}'. ` +
        `Status: ${axiosError.response?.status}, ` +
        `Error: ${JSON.stringify(axiosError.response?.data)}, ` +
        `Message: ${axiosError.message}`
      );
      return;
    }
    
    // Verify DELETE returned 204 No Content (per OpenAPI spec and implementation)
    expect(deleteResponse.status).toBe(204);
    
    // Verify response has no content body
    const deleteBody = deleteResponse.data;
    const isEmptyBody = deleteBody === undefined || 
                       deleteBody === null || 
                       deleteBody === '' || 
                       (typeof deleteBody === 'object' && Object.keys(deleteBody).length === 0);
    
    expect(isEmptyBody).toBe(true);
    
    // Step 3: Verify user no longer exists by attempting to GET the user
    try {
      const getResponse = await axios.get(`${API_BASE_URL}/users/${userId}`);
      
      // If we reach here, the GET request succeeded when it should have failed
      fail(
        `Step 3 Failed - User with ID '${userId}' and email '${userEmail}' still exists after deletion. ` +
        `GET request returned status ${getResponse.status} with data: ${JSON.stringify(getResponse.data)}. ` +
        `Expected 404 Not Found.`
      );
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      
      // Verify we got a 404 error
      if (!axiosError.response) {
        fail(
          `Step 3 Failed - GET request for user ID '${userId}' failed without a response. ` +
          `Error: ${axiosError.message}. ` +
          `Expected 404 Not Found response.`
        );
        return;
      }
      
      expect(axiosError.response.status).toBe(404);
      
      // Verify error response structure
      const errorData = axiosError.response.data;
      expect(errorData).toBeDefined();
      expect(errorData.status).toBe('error');
      expect(errorData.error).toBe('user_not_found');
      expect(errorData.message).toBeDefined();
      expect(typeof errorData.message).toBe('string');
      
      // Verify the error message contains the user ID
      expect(errorData.message).toContain(userId);
    }
  });
});