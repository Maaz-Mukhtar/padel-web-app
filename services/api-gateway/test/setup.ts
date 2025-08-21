import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables
config({ path: join(__dirname, '../../../.env.test') });

// Set test timeout
jest.setTimeout(30000);

// Mock environment variables for API Gateway
process.env.NODE_ENV = 'test';
process.env.API_GATEWAY_PORT = '3000';
process.env.AUTH_SERVICE_URL = 'http://localhost:3001';
process.env.USER_SERVICE_URL = 'http://localhost:3002';
process.env.BOOKING_SERVICE_URL = 'http://localhost:3003';
process.env.NOTIFICATION_SERVICE_URL = 'http://localhost:3004';

// Global test utilities for API Gateway
global.mockRequest = {
  method: 'GET',
  path: '/health',
  headers: {},
};

global.mockResponse = {
  statusCode: 200,
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
  send: jest.fn(),
};

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
