import request from 'supertest';
import express, { Express } from 'express';
import { healthCheckRouter } from '../health-check';

describe('Health Check Endpoint', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/health_check', healthCheckRouter);
  });

  describe('GET /health_check', () => {
    it('should return 200 status code', async () => {
      const response = await request(app).get('/health_check');
      
      expect(response.status).toBe(200);
    });

    it('should return JSON response with status ok', async () => {
      const response = await request(app).get('/health_check');
      
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should return JSON response with timestamp', async () => {
      const response = await request(app).get('/health_check');
      
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
      
      // Verify timestamp is a valid ISO date string
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('should return JSON response with service name', async () => {
      const response = await request(app).get('/health_check');
      
      expect(response.body).toHaveProperty('service', 'api');
    });

    it('should use snake_case for JSON keys', async () => {
      const response = await request(app).get('/health_check');
      
      // Verify all keys are in snake_case (no camelCase keys)
      const keys = Object.keys(response.body);
      keys.forEach(key => {
        expect(key).toMatch(/^[a-z]+(_[a-z]+)*$/);
      });
    });

    it('should return content-type application/json', async () => {
      const response = await request(app).get('/health_check');
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});