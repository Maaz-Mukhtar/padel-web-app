import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables
config({ path: join(__dirname, '../../../.env.test') });

// Set test timeout
jest.setTimeout(30000);

// Mock environment variables for user service
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'user_service_test';
process.env.DB_USERNAME = 'test_user';
process.env.DB_PASSWORD = 'test_password';

// Global test utilities for user service
global.mockUserProfile = {
  id: 'profile-id-123',
  userId: 'user-id-123',
  bio: 'Test padel player from Karachi',
  skillLevel: 'intermediate',
  playFrequency: 'weekly',
  preferredPlayTime: 'evening',
  profilePictureUrl: 'https://example.com/profile.jpg',
  achievements: {
    tournaments_won: 2,
    matches_played: 45,
  },
  stats: {
    win_rate: 0.67,
    average_score: 85,
  },
  rating: 4.2,
  totalReviews: 15,
  createdAt: new Date(),
  updatedAt: new Date(),
};

global.mockCreateProfileDto = {
  userId: 'user-id-123',
  bio: 'New padel player',
  skillLevel: 'beginner',
  playFrequency: 'occasionally',
  preferredPlayTime: 'morning',
};

global.mockUpdateProfileDto = {
  bio: 'Updated bio',
  skillLevel: 'advanced',
  preferredPlayTime: 'afternoon',
};

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
