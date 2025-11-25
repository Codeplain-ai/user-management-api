import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:8000';
const HEALTH_CHECK_ENDPOINT = `${API_BASE_URL}/health_check`;

describe('Health Check Endpoint Conformance Tests', () => {

  /**
   * Acceptance Test: health_check_returns_200_status_code
   * Verify that the /health_check endpoint is accessible and returns a 200 OK status code
   * This is the fundamental acceptance criterion: the API can be invoked successfully
   */
  test('health_check_returns_200_status_code', async () => {
    try {
      const response: AxiosResponse = await axios.get(HEALTH_CHECK_ENDPOINT);
      
      // Verify the endpoint returns 200 OK status code
      expect(response.status).toBe(200);
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 'N/A';
        const statusText = error.response?.statusText || 'N/A';
        const errorMessage = error.message;
        fail(`Health check endpoint failed to return 200 status code. Received status: ${statusCode} (${statusText}). Error: ${errorMessage}`);
      }
      throw error;
    }
  });
  
  /**
   * Test 1: health_check_response_contains_required_fields
   * Verify that the response contains exactly three required fields: status, timestamp, and service
   */
  test('health_check_response_contains_required_fields', async () => {
    const response: AxiosResponse = await axios.get(HEALTH_CHECK_ENDPOINT);
    
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(typeof response.data).toBe('object');
    
    const responseKeys = Object.keys(response.data);
    const requiredFields = ['status', 'timestamp', 'service'];
    
    // Check that all required fields are present
    requiredFields.forEach(field => {
      expect(responseKeys).toContain(field);
      expect(response.data[field]).toBeDefined();
    });
    
    // Check that exactly three fields are present (no extra fields)
    expect(responseKeys.length).toBe(3);
    expect(responseKeys.sort()).toEqual(requiredFields.sort());
  });

  /**
   * Test 2: health_check_status_field_value
   * Verify that the status field has the exact string value 'ok'
   */
  test('health_check_status_field_value', async () => {
    const response: AxiosResponse = await axios.get(HEALTH_CHECK_ENDPOINT);
    
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.status).toBeDefined();
    
    // Verify status field is exactly 'ok'
    expect(response.data.status).toBe('ok');
    expect(typeof response.data.status).toBe('string');
  });

  /**
   * Test 3: health_check_timestamp_format
   * Verify that the timestamp field is a valid ISO 8601 formatted date-time string
   */
  test('health_check_timestamp_format', async () => {
    const response: AxiosResponse = await axios.get(HEALTH_CHECK_ENDPOINT);
    
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.timestamp).toBeDefined();
    
    const timestamp = response.data.timestamp;
    
    // Verify timestamp is a string
    expect(typeof timestamp).toBe('string');
    
    // Verify timestamp matches ISO 8601 format pattern
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(timestamp).toMatch(iso8601Pattern);
    
    // Verify timestamp can be parsed as a valid date
    const parsedDate = new Date(timestamp);
    expect(parsedDate.toISOString()).toBe(timestamp);
    expect(isNaN(parsedDate.getTime())).toBe(false);
  });

  /**
   * Test 4: health_check_service_field_value
   * Verify that the service field has the exact string value 'api'
   */
  test('health_check_service_field_value', async () => {
    const response: AxiosResponse = await axios.get(HEALTH_CHECK_ENDPOINT);
    
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.service).toBeDefined();
    
    // Verify service field is exactly 'api'
    expect(response.data.service).toBe('api');
    expect(typeof response.data.service).toBe('string');
  });

  /**
   * Test 5: health_check_response_content_type
   * Verify that the response Content-Type header indicates 'application/json'
   */
  test('health_check_response_content_type', async () => {
    const response: AxiosResponse = await axios.get(HEALTH_CHECK_ENDPOINT);
    
    expect(response.status).toBe(200);
    expect(response.headers).toBeDefined();
    expect(response.headers['content-type']).toBeDefined();
    
    const contentType = response.headers['content-type'];
    
    // Verify Content-Type header contains 'application/json'
    expect(contentType).toContain('application/json');
  });

  /**
   * Test 6: health_check_response_time
   * Verify that the endpoint responds within 5 seconds
   */
  test('health_check_response_time', async () => {
    const startTime = Date.now();
    
    const response: AxiosResponse = await axios.get(HEALTH_CHECK_ENDPOINT);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status).toBe(200);
    
    // Verify response time is within 5 seconds (5000 milliseconds)
    expect(responseTime).toBeLessThan(5000);
  });
});