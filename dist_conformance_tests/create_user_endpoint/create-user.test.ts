import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'http://localhost:8000';

describe('POST /users endpoint conformance tests', () => {
  
  // Test 1: post_users_missing_name_returns_400
  test('post_users_missing_name_returns_400', async () => {
    try {
      await axios.post(`${API_BASE_URL}/users`, {
        email: 'test@example.com',
        password: 'password123'
      });
      fail('Expected request to fail with 400 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(400);
      const data: any = axiosError.response?.data;
      expect(data.status).toBe('error');
      expect(data.error).toBe('validation_error');
      expect(data.message).toMatch(/name/i);
      expect(data.message).toMatch(/required/i);
      expect(data.field).toBe('name');
    }
  });

  // Test 2: post_users_empty_name_returns_400
  test('post_users_empty_name_returns_400', async () => {
    try {
      await axios.post(`${API_BASE_URL}/users`, {
        name: '',
        email: 'test@example.com',
        password: 'password123'
      });
      fail('Expected request to fail with 400 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(400);
      const data: any = axiosError.response?.data;
      expect(data.status).toBe('error');
      expect(data.error).toBe('validation_error');
      expect(data.message).toMatch(/name/i);
      expect(data.message).toMatch(/empty/i);
      expect(data.field).toBe('name');
    }
  });

  // Test 3: post_users_name_exceeds_255_characters_returns_400
  test('post_users_name_exceeds_255_characters_returns_400', async () => {
    const longName = 'a'.repeat(256);
    try {
      await axios.post(`${API_BASE_URL}/users`, {
        name: longName,
        email: 'test@example.com',
        password: 'password123'
      });
      fail('Expected request to fail with 400 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(400);
      const data: any = axiosError.response?.data;
      expect(data.status).toBe('error');
      expect(data.error).toBe('validation_error');
      expect(data.message).toMatch(/name/i);
      expect(data.message).toMatch(/255/);
      expect(data.field).toBe('name');
    }
  });

  // Test 4: post_users_missing_email_returns_400
  test('post_users_missing_email_returns_400', async () => {
    try {
      await axios.post(`${API_BASE_URL}/users`, {
        name: 'John Doe',
        password: 'password123'
      });
      fail('Expected request to fail with 400 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(400);
      const data: any = axiosError.response?.data;
      expect(data.status).toBe('error');
      expect(data.error).toBe('validation_error');
      expect(data.message).toMatch(/email/i);
      expect(data.message).toMatch(/required/i);
      expect(data.field).toBe('email');
    }
  });

  // Test 5: post_users_invalid_email_format_returns_400
  test('post_users_invalid_email_format_returns_400', async () => {
    try {
      await axios.post(`${API_BASE_URL}/users`, {
        name: 'John Doe',
        email: 'notanemail',
        password: 'password123'
      });
      fail('Expected request to fail with 400 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(400);
      const data: any = axiosError.response?.data;
      expect(data.status).toBe('error');
      expect(data.error).toBe('validation_error');
      expect(data.message).toMatch(/email/i);
      expect(data.message).toMatch(/valid/i);
      expect(data.field).toBe('email');
    }
  });

  // Test 6: post_users_email_exceeds_255_characters_returns_400
  test('post_users_email_exceeds_255_characters_returns_400', async () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    try {
      await axios.post(`${API_BASE_URL}/users`, {
        name: 'John Doe',
        email: longEmail,
        password: 'password123'
      });
      fail('Expected request to fail with 400 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(400);
      const data: any = axiosError.response?.data;
      expect(data.status).toBe('error');
      expect(data.error).toBe('validation_error');
      expect(data.message).toMatch(/email/i);
      expect(data.message).toMatch(/255/);
      expect(data.field).toBe('email');
    }
  });

  // Test 7: post_users_missing_password_returns_400
  test('post_users_missing_password_returns_400', async () => {
    try {
      await axios.post(`${API_BASE_URL}/users`, {
        name: 'John Doe',
        email: 'test@example.com'
      });
      fail('Expected request to fail with 400 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(400);
      const data: any = axiosError.response?.data;
      expect(data.status).toBe('error');
      expect(data.error).toBe('validation_error');
      expect(data.message).toMatch(/password/i);
      expect(data.message).toMatch(/required/i);
      expect(data.field).toBe('password');
    }
  });

  // Test 8: post_users_password_less_than_8_characters_returns_400
  test('post_users_password_less_than_8_characters_returns_400', async () => {
    try {
      await axios.post(`${API_BASE_URL}/users`, {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'pass123'
      });
      fail('Expected request to fail with 400 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(400);
      const data: any = axiosError.response?.data;
      expect(data.status).toBe('error');
      expect(data.error).toBe('validation_error');
      expect(data.message).toMatch(/password/i);
      expect(data.message).toMatch(/8/);
      expect(data.field).toBe('password');
    }
  });

  // Test 9: post_users_password_exceeds_255_characters_returns_400
  test('post_users_password_exceeds_255_characters_returns_400', async () => {
    const longPassword = 'a'.repeat(256);
    try {
      await axios.post(`${API_BASE_URL}/users`, {
        name: 'John Doe',
        email: 'test@example.com',
        password: longPassword
      });
      fail('Expected request to fail with 400 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(400);
      const data: any = axiosError.response?.data;
      expect(data.status).toBe('error');
      expect(data.error).toBe('validation_error');
      expect(data.message).toMatch(/password/i);
      expect(data.message).toMatch(/255/);
      expect(data.field).toBe('password');
    }
  });

  // Test 10: post_users_duplicate_email_returns_409
  test('post_users_duplicate_email_returns_409', async () => {
    const uniqueEmail = `test-${Date.now()}-${Math.random()}@example.com`;
    
    // Create first user
    const firstResponse = await axios.post(`${API_BASE_URL}/users`, {
      name: 'John Doe',
      email: uniqueEmail,
      password: 'password123'
    });
    expect(firstResponse.status).toBe(201);
    
    // Try to create second user with same email
    try {
      await axios.post(`${API_BASE_URL}/users`, {
        name: 'Jane Doe',
        email: uniqueEmail,
        password: 'differentpass123'
      });
      fail('Expected request to fail with 409 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(409);
      const data: any = axiosError.response?.data;
      expect(data.status).toBe('error');
      expect(data.error).toBe('duplicate_email');
      expect(data.message).toMatch(/email/i);
      expect(data.message).toMatch(/exists/i);
      expect(data.field).toBe('email');
    }
  });

  // Test 11: post_users_duplicate_email_error_response_structure
  test('post_users_duplicate_email_error_response_structure', async () => {
    const uniqueEmail = `test-${Date.now()}-${Math.random()}@example.com`;
    
    // Create first user
    await axios.post(`${API_BASE_URL}/users`, {
      name: 'John Doe',
      email: uniqueEmail,
      password: 'password123'
    });
    
    // Try to create second user with same email
    try {
      await axios.post(`${API_BASE_URL}/users`, {
        name: 'Jane Doe',
        email: uniqueEmail,
        password: 'differentpass123'
      });
      fail('Expected request to fail with 409 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(409);
      const data: any = axiosError.response?.data;
      
      // Verify exact structure
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('field');
      
      expect(data.status).toBe('error');
      expect(data.error).toBe('duplicate_email');
      expect(data.field).toBe('email');
      expect(data.message).toContain(uniqueEmail);
    }
  });

  // Test 12: post_users_invalid_json_body_returns_400
  test('post_users_invalid_json_body_returns_400', async () => {
    try {
      await axios.post(`${API_BASE_URL}/users`, 
        '{invalid json}',
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      fail('Expected request to fail with 400 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(400);
      const data: any = axiosError.response?.data;
      expect(data).toHaveProperty('error');
      expect(data.error).toMatch(/invalid/i);
    }
  });

  // Test 13: post_users_non_object_body_returns_400
  test('post_users_non_object_body_returns_400', async () => {
    try {
      await axios.post(`${API_BASE_URL}/users`, 
        ['not', 'an', 'object']
      );
      fail('Expected request to fail with 400 status code');
    } catch (error) {
      const axiosError = error as AxiosError;
      expect(axiosError.response?.status).toBe(400);
      const data: any = axiosError.response?.data;
      expect(data.status).toBe('error');
      expect(data.error).toBe('invalid_request');
      expect(data.message).toMatch(/object/i);
    }
  });
});