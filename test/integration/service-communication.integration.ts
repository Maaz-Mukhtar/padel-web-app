import request from 'supertest';
import { Server } from 'http';
import express from 'express';

describe('Service Communication Integration Tests', () => {
  let authService: Server;
  let userService: Server;
  let apiGateway: Server;
  let authPort: number;
  let userPort: number;
  let gatewayPort: number;

  beforeAll(async () => {
    // Setup mock services for integration testing
    authPort = 3501;
    userPort = 3502;
    gatewayPort = 3500;

    // Mock Auth Service
    const authApp = express();
    authApp.use(express.json());

    authApp.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'auth' });
    });

    authApp.post('/auth/verify-token', (req, res) => {
      const { token } = req.body;
      if (token === 'valid-token') {
        res.json({
          sub: 'user-123',
          email: 'test@example.com',
          role: 'player',
        });
      } else {
        res.status(401).json({ message: 'Invalid token' });
      }
    });

    authService = authApp.listen(authPort);

    // Mock User Service
    const userApp = express();
    userApp.use(express.json());

    userApp.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'user' });
    });

    userApp.get('/profile/:userId', (req, res) => {
      const { userId } = req.params;
      if (userId === 'user-123') {
        res.json({
          id: 'profile-123',
          userId: 'user-123',
          bio: 'Test user profile',
          skillLevel: 'intermediate',
        });
      } else {
        res.status(404).json({ message: 'Profile not found' });
      }
    });

    userService = userApp.listen(userPort);

    // Mock API Gateway
    const gatewayApp = express();
    gatewayApp.use(express.json());

    gatewayApp.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
      });
    });

    // Proxy to auth service
    gatewayApp.use('/api/auth', async (req, res) => {
      try {
        const response = await request(`http://localhost:${authPort}`)
          .post(req.path)
          .send(req.body);
        res.status(response.status).json(response.body);
      } catch (error) {
        res.status(502).json({ error: 'Service unavailable' });
      }
    });

    // Proxy to user service with auth
    gatewayApp.use('/api/users', async (req, res) => {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ message: 'Authorization required' });
      }

      const token = authHeader.replace('Bearer ', '');

      try {
        // Verify token with auth service
        const authResponse = await request(`http://localhost:${authPort}`)
          .post('/auth/verify-token')
          .send({ token });

        if (authResponse.status !== 200) {
          return res.status(401).json({ message: 'Invalid token' });
        }

        // Forward to user service
        const userResponse = await request(`http://localhost:${userPort}`).get(
          req.path
        );

        res.status(userResponse.status).json(userResponse.body);
      } catch (error) {
        res.status(502).json({ error: 'Service unavailable' });
      }
    });

    apiGateway = gatewayApp.listen(gatewayPort);

    // Wait for services to start
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    authService?.close();
    userService?.close();
    apiGateway?.close();
  });

  describe('Service Health Checks', () => {
    it('should verify all services are healthy', async () => {
      // Check Auth Service
      const authHealth = await request(`http://localhost:${authPort}`)
        .get('/health')
        .expect(200);
      expect(authHealth.body.service).toBe('auth');

      // Check User Service
      const userHealth = await request(`http://localhost:${userPort}`)
        .get('/health')
        .expect(200);
      expect(userHealth.body.service).toBe('user');

      // Check API Gateway
      const gatewayHealth = await request(`http://localhost:${gatewayPort}`)
        .get('/health')
        .expect(200);
      expect(gatewayHealth.body.service).toBe('api-gateway');
    });
  });

  describe('Gateway to Auth Service Communication', () => {
    it('should proxy token verification to auth service', async () => {
      const response = await request(`http://localhost:${gatewayPort}`)
        .post('/api/auth/verify-token')
        .send({ token: 'valid-token' })
        .expect(200);

      expect(response.body).toMatchObject({
        sub: 'user-123',
        email: 'test@example.com',
        role: 'player',
      });
    });

    it('should handle auth service errors', async () => {
      const response = await request(`http://localhost:${gatewayPort}`)
        .post('/api/auth/verify-token')
        .send({ token: 'invalid-token' })
        .expect(401);

      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('Gateway to User Service Communication with Authentication', () => {
    it('should access user service with valid token', async () => {
      const response = await request(`http://localhost:${gatewayPort}`)
        .get('/api/users/profile/user-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 'profile-123',
        userId: 'user-123',
        bio: 'Test user profile',
        skillLevel: 'intermediate',
      });
    });

    it('should reject user service access without token', async () => {
      const response = await request(`http://localhost:${gatewayPort}`)
        .get('/api/users/profile/user-123')
        .expect(401);

      expect(response.body.message).toBe('Authorization required');
    });

    it('should reject user service access with invalid token', async () => {
      const response = await request(`http://localhost:${gatewayPort}`)
        .get('/api/users/profile/user-123')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('End-to-End Authentication Flow', () => {
    it('should complete full authentication and profile access flow', async () => {
      // Step 1: Verify token with auth service
      const authResponse = await request(`http://localhost:${gatewayPort}`)
        .post('/api/auth/verify-token')
        .send({ token: 'valid-token' })
        .expect(200);

      expect(authResponse.body.sub).toBe('user-123');

      // Step 2: Access user profile with the same token
      const profileResponse = await request(`http://localhost:${gatewayPort}`)
        .get('/api/users/profile/user-123')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(profileResponse.body.userId).toBe('user-123');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle service unavailability gracefully', async () => {
      // Close auth service temporarily
      authService.close();

      const response = await request(`http://localhost:${gatewayPort}`)
        .post('/api/auth/verify-token')
        .send({ token: 'valid-token' })
        .expect(502);

      expect(response.body.error).toBe('Service unavailable');

      // Restart auth service
      const authApp = express();
      authApp.use(express.json());
      authApp.get('/health', (req, res) => {
        res.json({ status: 'healthy', service: 'auth' });
      });
      authApp.post('/auth/verify-token', (req, res) => {
        const { token } = req.body;
        if (token === 'valid-token') {
          res.json({
            sub: 'user-123',
            email: 'test@example.com',
            role: 'player',
          });
        } else {
          res.status(401).json({ message: 'Invalid token' });
        }
      });
      authService = authApp.listen(authPort);
    });
  });

  describe('Performance and Load', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(`http://localhost:${gatewayPort}`)
            .post('/api/auth/verify-token')
            .send({ token: 'valid-token' })
        );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.sub).toBe('user-123');
      });
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();

      const requests = Array(20)
        .fill(null)
        .map(() => request(`http://localhost:${gatewayPort}`).get('/health'));

      await Promise.all(requests);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Security', () => {
    it('should not expose internal service URLs in errors', async () => {
      const response = await request(`http://localhost:${gatewayPort}`)
        .post('/api/auth/verify-token')
        .send({ token: 'invalid-token' })
        .expect(401);

      expect(JSON.stringify(response.body)).not.toContain('localhost');
      expect(JSON.stringify(response.body)).not.toContain('3501');
    });

    it('should validate authorization headers properly', async () => {
      const invalidHeaders = [
        'invalid-token',
        'Basic valid-token',
        'bearer valid-token', // lowercase
        'Bearer ',
      ];

      for (const header of invalidHeaders) {
        const response = await request(`http://localhost:${gatewayPort}`)
          .get('/api/users/profile/user-123')
          .set('Authorization', header)
          .expect(401);

        expect(response.body.message).toContain('Authorization required');
      }
    });
  });
});
