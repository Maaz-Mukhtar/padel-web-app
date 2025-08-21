import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables
config({ path: join(__dirname, '../../../.env.test') });

// Set test timeout
jest.setTimeout(30000);

// Mock environment variables for auth service
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'auth_service_test';
process.env.DB_USERNAME = 'test_user';
process.env.DB_PASSWORD = 'test_password';

// Global test utilities
global.mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  password: 'hashedPassword123',
  firstName: 'Test',
  lastName: 'User',
  role: 'player',
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

global.mockJwtPayload = {
  sub: 'test-user-id-123',
  email: 'test@example.com',
  role: 'player',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
