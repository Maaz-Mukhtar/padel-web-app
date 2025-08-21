import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables
config({ path: join(__dirname, '../../../.env.test') });

// Set test timeout
jest.setTimeout(30000);

// Mock environment variables for notification service
process.env.NODE_ENV = 'test';
process.env.NOTIFICATION_SERVICE_PORT = '3004';

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
