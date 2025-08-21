import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

describe('End-to-End User Journey Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let userId: string;

  const testUser = {
    email: 'e2e.test@example.com',
    password: 'SecurePass123!',
    firstName: 'E2E',
    lastName: 'TestUser',
    phone: '+923001234567',
  };

  beforeAll(async () => {
    // Note: In a real implementation, you would set up the full application
    // This is a simplified version for demonstration
    console.log('Setting up E2E test environment...');
  });

  afterAll(async () => {
    // Cleanup
    if (dataSource) {
      await dataSource.destroy();
    }
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Clean database before each test
    if (dataSource) {
      await dataSource.query('DELETE FROM user_profiles');
      await dataSource.query('DELETE FROM users');
    }
  });

  describe('Complete User Registration and Profile Setup Flow', () => {
    it('should complete full user onboarding journey', async () => {
      // Step 1: Register new user
      const registrationResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(registrationResponse.body).toMatchObject({
        id: expect.any(String),
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: 'player',
        isVerified: false,
      });

      userId = registrationResponse.body.id;

      // Step 2: Login with new user
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(loginResponse.body).toMatchObject({
        access_token: expect.any(String),
        user: expect.objectContaining({
          id: userId,
          email: testUser.email,
        }),
      });

      authToken = loginResponse.body.access_token;

      // Step 3: Create user profile
      const profileData = {
        userId,
        bio: 'Passionate padel player from Karachi looking for partners!',
        skillLevel: 'intermediate',
        playFrequency: 'weekly',
        preferredPlayTime: 'evening',
      };

      const profileResponse = await request(app.getHttpServer())
        .post('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(201);

      expect(profileResponse.body).toMatchObject({
        id: expect.any(String),
        userId,
        bio: profileData.bio,
        skillLevel: profileData.skillLevel,
        rating: 0,
        totalReviews: 0,
      });

      // Step 4: Update profile with additional information
      const updateData = {
        profilePictureUrl: 'https://example.com/profile.jpg',
        achievements: {
          tournaments_participated: 5,
          matches_won: 12,
        },
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`/api/users/profile/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        userId,
        profilePictureUrl: updateData.profilePictureUrl,
        achievements: updateData.achievements,
      });

      // Step 5: Verify profile can be retrieved
      const getProfileResponse = await request(app.getHttpServer())
        .get(`/api/users/profile/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getProfileResponse.body).toMatchObject({
        userId,
        bio: profileData.bio,
        profilePictureUrl: updateData.profilePictureUrl,
        achievements: updateData.achievements,
      });

      // Step 6: Search for users (should find our test user)
      const searchResponse = await request(app.getHttpServer())
        .get('/api/users/search')
        .query({
          skillLevel: 'intermediate',
          city: 'Karachi',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(searchResponse.body).toMatchObject({
        profiles: expect.arrayContaining([
          expect.objectContaining({
            userId,
            skillLevel: 'intermediate',
          }),
        ]),
        total: expect.any(Number),
        page: 1,
        limit: 10,
      });
    });
  });

  describe('Authentication Flow with Error Scenarios', () => {
    it('should handle authentication edge cases', async () => {
      // Register user first
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      // Test duplicate registration
      const duplicateResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(duplicateResponse.body.message).toContain('already exists');

      // Test invalid login credentials
      const invalidLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(invalidLoginResponse.body.message).toContain(
        'Invalid credentials'
      );

      // Test successful login
      const validLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      authToken = validLoginResponse.body.access_token;

      // Test token verification
      const tokenVerifyResponse = await request(app.getHttpServer())
        .post('/api/auth/verify-token')
        .send({ token: authToken })
        .expect(200);

      expect(tokenVerifyResponse.body).toMatchObject({
        sub: expect.any(String),
        email: testUser.email,
        role: 'player',
      });

      // Test invalid token
      const invalidTokenResponse = await request(app.getHttpServer())
        .post('/api/auth/verify-token')
        .send({ token: 'invalid-token' })
        .expect(401);

      expect(invalidTokenResponse.body.message).toContain('Invalid token');
    });
  });

  describe('Profile Management Flow', () => {
    beforeEach(async () => {
      // Setup authenticated user
      const registrationResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser);

      userId = registrationResponse.body.id;

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      authToken = loginResponse.body.access_token;
    });

    it('should manage user profile lifecycle', async () => {
      // Create profile
      const profileData = {
        userId,
        bio: 'Beginner padel player seeking improvement',
        skillLevel: 'beginner',
        playFrequency: 'occasionally',
        preferredPlayTime: 'morning',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(201);

      const _profileId = createResponse.body.id;

      // Update skill level progression
      const skillUpdate = {
        skillLevel: 'intermediate',
        bio: 'Improving padel player with growing experience',
        achievements: {
          lessons_completed: 10,
          tournaments_participated: 2,
        },
      };

      await request(app.getHttpServer())
        .put(`/api/users/profile/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(skillUpdate)
        .expect(200);

      // Update stats after playing matches
      const statsUpdate = {
        matches_played: 15,
        matches_won: 9,
        win_rate: 0.6,
      };

      await request(app.getHttpServer())
        .put(`/api/users/profile/${userId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(statsUpdate)
        .expect(200);

      // Update rating based on reviews
      await request(app.getHttpServer())
        .put(`/api/users/profile/${userId}/rating`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 4.2 })
        .expect(200);

      // Verify final profile state
      const finalProfileResponse = await request(app.getHttpServer())
        .get(`/api/users/profile/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalProfileResponse.body).toMatchObject({
        userId,
        skillLevel: 'intermediate',
        bio: skillUpdate.bio,
        achievements: skillUpdate.achievements,
        stats: expect.objectContaining(statsUpdate),
        rating: 4.2,
        totalReviews: 1,
      });
    });
  });

  describe('API Gateway Integration Flow', () => {
    it('should route requests through API Gateway correctly', async () => {
      // Register through API Gateway
      const registrationResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      userId = registrationResponse.body.id;

      // Login through API Gateway
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      authToken = loginResponse.body.access_token;

      // Create profile through API Gateway (user service)
      const profileResponse = await request(app.getHttpServer())
        .post('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId,
          bio: 'API Gateway test user',
          skillLevel: 'beginner',
        })
        .expect(201);

      // Verify request was properly routed and authenticated
      expect(profileResponse.body).toMatchObject({
        userId,
        bio: 'API Gateway test user',
        skillLevel: 'beginner',
      });

      // Test unauthorized access
      await request(app.getHttpServer())
        .get(`/api/users/profile/${userId}`)
        .expect(401);

      // Test with invalid token
      await request(app.getHttpServer())
        .get(`/api/users/profile/${userId}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent user registrations', async () => {
      const concurrentUsers = 10;
      const userPromises: Promise<any>[] = [];

      // Create concurrent registration requests
      for (let i = 0; i < concurrentUsers; i++) {
        const userEmail = `concurrent.user.${i}@example.com`;
        const promise = request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            ...testUser,
            email: userEmail,
          });
        userPromises.push(promise);
      }

      // Wait for all registrations to complete
      const responses = await Promise.all(userPromises);

      // Verify all registrations succeeded
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.email).toBe(
          `concurrent.user.${index}@example.com`
        );
      });
    });

    it('should maintain performance under load', async () => {
      // Register a user for testing
      const registrationResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const token = loginResponse.body.access_token;
      const testUserId = registrationResponse.body.id;

      // Create multiple concurrent profile requests
      const profileRequests = Array(20)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get(`/api/users/profile/${testUserId}`)
            .set('Authorization', `Bearer ${token}`)
        );

      const startTime = Date.now();
      const profileResponses = await Promise.all(profileRequests);
      const endTime = Date.now();

      // Verify all requests succeeded
      profileResponses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.userId).toBe(testUserId);
      });

      // Verify reasonable response time (should be under 2 seconds for 20 requests)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database errors gracefully', async () => {
      // This test would involve simulating database failures
      // In a real implementation, you might temporarily disconnect the database
      // or use a mock that returns errors
      // Test registration with database error
      // (Implementation would depend on your error handling strategy)
      // Verify proper error responses
      // Verify system remains stable
      // Verify recovery after database is restored
    });

    it('should handle service timeouts gracefully', async () => {
      // Test with slow database responses
      // Test with network timeouts
      // Verify circuit breaker patterns work
      // Test graceful degradation
    });
  });

  describe('Cross-Service Data Consistency', () => {
    it('should maintain data consistency across services', async () => {
      // Register user (auth service)
      const registrationResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser);

      userId = registrationResponse.body.id;

      // Login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      authToken = loginResponse.body.access_token;

      // Create profile (user service)
      const _profileResponse = await request(app.getHttpServer())
        .post('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId,
          bio: 'Cross-service consistency test',
          skillLevel: 'intermediate',
        });

      // Verify user data is consistent between services
      const authProfileCheck = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const userProfileCheck = await request(app.getHttpServer())
        .get(`/api/users/profile/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify consistent user ID and email across services
      expect(authProfileCheck.body.id).toBe(userId);
      expect(authProfileCheck.body.email).toBe(testUser.email);
      expect(userProfileCheck.body.userId).toBe(userId);
    });
  });
});
