import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:8000';

describe('POST /users acceptance test', () => {
  
  test('successfully_create_user_with_valid_data', async () => {
    // Use a unique email to avoid conflicts with existing test data
    const uniqueEmail = `john.doe.${Date.now()}.${Math.random().toString(36).substring(7)}@example.com`;
    
    const requestData = {
      name: 'John Doe',
      email: uniqueEmail,
      password: 'password'
    };

    let response: AxiosResponse;
    
    try {
      response = await axios.post(`${API_BASE_URL}/users`, requestData);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error(`Expected successful user creation but request failed: ${error}`);
    }

    // Verify status code is 201 Created
    expect(response.status).toBe(201);
    if (response.status !== 201) {
      throw new Error(`Expected status code 201 but received ${response.status}. Response: ${JSON.stringify(response.data)}`);
    }

    const responseData = response.data;

    // Verify response has required top-level structure
    expect(responseData).toHaveProperty('status');
    expect(responseData).toHaveProperty('data');
    
    if (!responseData.status || !responseData.data) {
      throw new Error(`Response missing required top-level fields. Received: ${JSON.stringify(responseData)}`);
    }

    // Verify status field
    expect(responseData.status).toBe('success');
    if (responseData.status !== 'success') {
      throw new Error(`Expected status 'success' but received '${responseData.status}'. Response: ${JSON.stringify(responseData)}`);
    }

    const userData = responseData.data;

    // Verify all required fields are present in data object
    expect(userData).toHaveProperty('id');
    expect(userData).toHaveProperty('name');
    expect(userData).toHaveProperty('email');
    expect(userData).toHaveProperty('created_at');
    expect(userData).toHaveProperty('updated_at');

    if (!userData.id || !userData.name || !userData.email || !userData.created_at || !userData.updated_at) {
      throw new Error(`Response data missing required fields. Received: ${JSON.stringify(userData)}`);
    }

    // Verify password is NOT returned
    expect(userData).not.toHaveProperty('password');
    if ('password' in userData) {
      throw new Error(`Password should not be returned in response but was found. Response: ${JSON.stringify(userData)}`);
    }

    // Verify id is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(userData.id).toMatch(uuidRegex);
    if (!uuidRegex.test(userData.id)) {
      throw new Error(`Expected id to be a valid UUID but received '${userData.id}'. Response: ${JSON.stringify(userData)}`);
    }

    // Verify name matches input
    expect(userData.name).toBe('John Doe');
    if (userData.name !== 'John Doe') {
      throw new Error(`Expected name 'John Doe' but received '${userData.name}'. Response: ${JSON.stringify(userData)}`);
    }

    // Verify email matches input (should be normalized to lowercase)
    expect(userData.email.toLowerCase()).toBe(uniqueEmail.toLowerCase());
    if (userData.email.toLowerCase() !== uniqueEmail.toLowerCase()) {
      throw new Error(`Expected email '${uniqueEmail}' but received '${userData.email}'. Response: ${JSON.stringify(userData)}`);
    }

    // Verify created_at is a valid ISO 8601 timestamp
    const createdAt = new Date(userData.created_at);
    expect(createdAt.toISOString()).toBe(userData.created_at);
    if (isNaN(createdAt.getTime())) {
      throw new Error(`Expected created_at to be a valid ISO 8601 timestamp but received '${userData.created_at}'. Response: ${JSON.stringify(userData)}`);
    }

    // Verify updated_at is a valid ISO 8601 timestamp
    const updatedAt = new Date(userData.updated_at);
    expect(updatedAt.toISOString()).toBe(userData.updated_at);
    if (isNaN(updatedAt.getTime())) {
      throw new Error(`Expected updated_at to be a valid ISO 8601 timestamp but received '${userData.updated_at}'. Response: ${JSON.stringify(userData)}`);
    }

    // Verify timestamps are reasonable (not in the future, not too old)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneMinuteInFuture = new Date(now.getTime() + 60 * 1000);

    if (createdAt < fiveMinutesAgo || createdAt > oneMinuteInFuture) {
      throw new Error(`Expected created_at to be recent but received '${userData.created_at}' (current time: ${now.toISOString()}). Response: ${JSON.stringify(userData)}`);
    }

    if (updatedAt < fiveMinutesAgo || updatedAt > oneMinuteInFuture) {
      throw new Error(`Expected updated_at to be recent but received '${userData.updated_at}' (current time: ${now.toISOString()}). Response: ${JSON.stringify(userData)}`);
    }

    // Verify created_at and updated_at are the same (or very close) for a new user
    const timeDiff = Math.abs(createdAt.getTime() - updatedAt.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
    if (timeDiff >= 1000) {
      throw new Error(`Expected created_at and updated_at to be similar for new user but difference is ${timeDiff}ms. Response: ${JSON.stringify(userData)}`);
    }

    console.log('✓ User created successfully:', {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    });
  });
});