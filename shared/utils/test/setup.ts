import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables
config({ path: join(__dirname, '../../../.env.test') });

// Set test timeout
jest.setTimeout(30000);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Global test utilities for shared utils
global.mockRequest = {
  method: 'GET',
  path: '/api/test',
  headers: {
    'x-correlation-id': 'test-correlation-id',
  },
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'player',
  },
};

global.mockResponse = {
  statusCode: 200,
  on: jest.fn(),
};

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});