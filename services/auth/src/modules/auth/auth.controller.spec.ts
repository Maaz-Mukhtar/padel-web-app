import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let _authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    verifyToken: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'player',
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    _authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return access token for valid credentials', async () => {
      const expectedResult = {
        access_token: 'jwt-token-123',
        user: mockUser,
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await authController.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(authController.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      phone: '+923001234567',
    };

    it('should successfully register a new user', async () => {
      const expectedResult = {
        ...mockUser,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await authController.register(registerDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should throw ConflictException when user already exists', async () => {
      mockAuthService.register.mockRejectedValue(
        new ConflictException('User already exists')
      );

      await expect(authController.register(registerDto)).rejects.toThrow(
        ConflictException
      );
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should return new access token for valid refresh token', async () => {
      const expectedResult = {
        access_token: 'new-access-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(expectedResult);

      const result = await authController.refreshToken(refreshTokenDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken
      );
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockAuthService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token')
      );

      await expect(
        authController.refreshToken(refreshTokenDto)
      ).rejects.toThrow(UnauthorizedException);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken
      );
    });
  });

  describe('verifyToken', () => {
    const verifyTokenDto = {
      token: 'valid-jwt-token',
    };

    it('should return payload for valid token', async () => {
      const expectedPayload = {
        sub: 'user-id',
        email: 'test@example.com',
        role: 'player',
        iat: 1234567890,
        exp: 1234567890 + 3600,
      };

      mockAuthService.verifyToken.mockResolvedValue(expectedPayload);

      const result = await authController.verifyToken(verifyTokenDto);

      expect(result).toEqual(expectedPayload);
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(
        verifyTokenDto.token
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockAuthService.verifyToken.mockRejectedValue(
        new UnauthorizedException('Invalid token')
      );

      await expect(authController.verifyToken(verifyTokenDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith(
        verifyTokenDto.token
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const request = {
        user: mockUser,
      };

      const result = await authController.getProfile(request);

      expect(result).toEqual(mockUser);
    });
  });
});
