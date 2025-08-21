import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AuthModule } from '../../services/auth/src/modules/auth/auth.module';
import { User } from '../../services/auth/src/entities/user.entity';

describe('Auth Service Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || 'test_user',
          password: process.env.DB_PASSWORD || 'test_password',
          database: 'auth_service_test',
          entities: [User],
          synchronize: true,
          dropSchema: true,
        }),
        JwtModule.register({
          secret: process.env.JWT_SECRET || 'test-secret',
          signOptions: { expiresIn: '15m' },
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await dataSource.query('DELETE FROM users');
  });

  describe('POST /auth/register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+923001234567',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: validRegisterData.email,
        firstName: validRegisterData.firstName,
        lastName: validRegisterData.lastName,
        phone: validRegisterData.phone,
        role: 'player',
        isVerified: false,
      });
      expect(response.body.password).toBeUndefined();
    });

    it('should reject registration with existing email', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterData)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterData)
        .expect(409);

      expect(response.body.message).toContain('User already exists');
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...validRegisterData,
        email: 'invalid-email',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.message).toContain('email');
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        ...validRegisterData,
        password: '123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.message).toContain('password');
    });
  });

  describe('POST /auth/login', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    beforeEach(async () => {
      // Register a user for login tests
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: loginCredentials.email,
          password: loginCredentials.password,
          firstName: 'Test',
          lastName: 'User',
          phone: '+923001234567',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginCredentials)
        .expect(200);

      expect(response.body).toMatchObject({
        access_token: expect.any(String),
        user: {
          id: expect.any(String),
          email: loginCredentials.email,
          role: 'player',
        },
      });
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: loginCredentials.password,
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: loginCredentials.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('POST /auth/verify-token', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get a token
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          phone: '+923001234567',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      accessToken = loginResponse.body.access_token;
    });

    it('should verify valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/verify-token')
        .send({ token: accessToken })
        .expect(200);

      expect(response.body).toMatchObject({
        sub: expect.any(String),
        email: 'test@example.com',
        role: 'player',
        iat: expect.any(Number),
        exp: expect.any(Number),
      });
    });

    it('should reject invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/verify-token')
        .send({ token: 'invalid-token' })
        .expect(401);

      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('GET /auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get a token
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          phone: '+923001234567',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      accessToken = loginResponse.body.access_token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'player',
      });
      expect(response.body.password).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });
  });

  describe('Database Integration', () => {
    it('should hash passwords before storing', async () => {
      const password = 'password123';
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password,
          firstName: 'Test',
          lastName: 'User',
          phone: '+923001234567',
        });

      const user = await dataSource.query(
        'SELECT password FROM users WHERE email = $1',
        ['test@example.com']
      );

      expect(user[0].password).not.toBe(password);
      expect(user[0].password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should set correct default values', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        });

      const user = await dataSource.query(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );

      expect(user[0]).toMatchObject({
        role: 'player',
        is_verified: false,
        verification_token: expect.any(String),
      });
    });
  });

  describe('Performance', () => {
    it('should handle registration within acceptable time', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'performance@example.com',
          password: 'password123',
          firstName: 'Performance',
          lastName: 'Test',
          phone: '+923001234567',
        })
        .expect(201);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle login within acceptable time', async () => {
      // First register a user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'performance@example.com',
          password: 'password123',
          firstName: 'Performance',
          lastName: 'Test',
          phone: '+923001234567',
        });

      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'performance@example.com',
          password: 'password123',
        })
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });
  });
});