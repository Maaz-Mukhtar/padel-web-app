# Week 2: Authentication Implementation & User Profiles

## 📅 Week Overview

**Duration**: Day 8-14  
**Objective**: Complete authentication service implementation, user profile management, and basic notification system setup  
**Team Required**: 2 Backend Engineers, 1 Frontend Engineer, 1 QA Engineer

---

## ✅ Prerequisites Checklist

### From Week 1

- [x] All microservices running successfully
- [x] Database connections established
- [x] CI/CD pipeline operational
- [x] API Gateway routing configured
- [x] Development environment stable

### New Requirements

- [ ] **Email Service Setup**: SMTP credentials or SendGrid API key
- [ ] **OAuth Credentials**: Google and Facebook app credentials
- [ ] **SSL Certificates**: For secure authentication
- [ ] **Test Data**: Sample venues and users for testing
- [ ] **Security Tools**: JWT secret keys generated

---

## 🛠️ Day-by-Day Implementation Tasks

### Day 8: User Registration & Email Verification

#### Morning Session (9 AM - 1 PM)

**Task 8.1: User Registration API**

- [ ] Create registration DTOs

  ```typescript
  // services/auth/src/dto/register.dto.ts
  import {
    IsEmail,
    IsString,
    MinLength,
    IsOptional,
    Matches,
  } from 'class-validator';
  import { ApiProperty } from '@nestjs/swagger';

  export class RegisterUserDto {
    @ApiProperty({ example: 'john.doe@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'SecurePass123!' })
    @IsString()
    @MinLength(8)
    @Matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      {
        message:
          'Password must contain uppercase, lowercase, number and special character',
      }
    )
    password: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    lastName: string;

    @ApiProperty({ example: '+923001234567', required: false })
    @IsOptional()
    @IsString()
    @Matches(/^\+92[0-9]{10}$/, { message: 'Invalid Pakistani phone number' })
    phone?: string;

    @ApiProperty({ example: 'player', enum: ['player', 'venue_owner'] })
    @IsString()
    role: 'player' | 'venue_owner';
  }

  export class VerifyEmailDto {
    @ApiProperty()
    @IsString()
    token: string;
  }
  ```

- [ ] Implement registration service

  ```typescript
  // services/auth/src/modules/auth/auth.service.ts
  import {
    Injectable,
    ConflictException,
    BadRequestException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import * as bcrypt from 'bcrypt';
  import * as crypto from 'crypto';
  import { User } from '../../entities/user.entity';
  import { RegisterUserDto } from '../../dto/register.dto';
  import { EmailService } from '../email/email.service';
  import { JwtService } from '@nestjs/jwt';

  @Injectable()
  export class AuthService {
    constructor(
      @InjectRepository(User)
      private userRepository: Repository<User>,
      private emailService: EmailService,
      private jwtService: JwtService
    ) {}

    async register(
      registerDto: RegisterUserDto
    ): Promise<{ user: User; tokens: any }> {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const user = this.userRepository.create({
        ...registerDto,
        password: hashedPassword,
        verificationToken,
        isVerified: false,
      });

      await this.userRepository.save(user);

      // Send verification email
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken
      );

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Remove sensitive data
      delete user.password;
      delete user.verificationToken;

      return { user, tokens };
    }

    async verifyEmail(token: string): Promise<boolean> {
      const user = await this.userRepository.findOne({
        where: { verificationToken: token },
      });

      if (!user) {
        throw new BadRequestException('Invalid verification token');
      }

      user.isVerified = true;
      user.verificationToken = null;
      await this.userRepository.save(user);

      // Send welcome email
      await this.emailService.sendWelcomeEmail(user.email, user.firstName);

      return true;
    }

    private async generateTokens(user: User) {
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '15m',
      });

      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d',
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      };
    }
  }
  ```

#### Afternoon Session (2 PM - 6 PM)

**Task 8.2: Email Service Implementation**

- [ ] Setup email service

  ```typescript
  // services/user/src/modules/email/email.service.ts
  import { Injectable } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import * as nodemailer from 'nodemailer';
  import * as handlebars from 'handlebars';
  import * as fs from 'fs/promises';
  import * as path from 'path';

  @Injectable()
  export class EmailService {
    private transporter: nodemailer.Transporter;
    private templates: Map<string, handlebars.TemplateDelegate> = new Map();

    constructor(private configService: ConfigService) {
      this.transporter = nodemailer.createTransporter({
        host: this.configService.get('SMTP_HOST'),
        port: this.configService.get('SMTP_PORT'),
        secure: this.configService.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });

      this.loadTemplates();
    }

    private async loadTemplates() {
      const templatesDir = path.join(__dirname, 'templates');
      const templates = ['verification', 'welcome', 'password-reset'];

      for (const template of templates) {
        const html = await fs.readFile(
          path.join(templatesDir, `${template}.hbs`),
          'utf-8'
        );
        this.templates.set(template, handlebars.compile(html));
      }
    }

    async sendVerificationEmail(email: string, token: string): Promise<void> {
      const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;
      const template = this.templates.get('verification');
      const html = template({ verificationUrl, email });

      await this.transporter.sendMail({
        from: '"Padel Platform" <no-reply@padelplatform.pk>',
        to: email,
        subject: 'Verify Your Email - Padel Platform',
        html,
      });
    }

    async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
      const template = this.templates.get('welcome');
      const html = template({
        firstName,
        loginUrl: this.configService.get('FRONTEND_URL'),
      });

      await this.transporter.sendMail({
        from: '"Padel Platform" <no-reply@padelplatform.pk>',
        to: email,
        subject: 'Welcome to Padel Platform!',
        html,
      });
    }

    async sendPasswordResetEmail(email: string, token: string): Promise<void> {
      const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
      const template = this.templates.get('password-reset');
      const html = template({ resetUrl, email });

      await this.transporter.sendMail({
        from: '"Padel Platform" <no-reply@padelplatform.pk>',
        to: email,
        subject: 'Reset Your Password - Padel Platform',
        html,
      });
    }
  }
  ```

- [ ] Create email templates
  ```html
  <!-- services/user/src/modules/email/templates/verification.hbs -->
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        .container {
          max-width: 600px;
          margin: 0 auto;
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        .header {
          background-color: #3b82f6;
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background-color: #f3f4f6;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Hello!</p>
          <p>
            Thank you for registering with Padel Platform. Please click the
            button below to verify your email address:
          </p>
          <center>
            <a href="{{verificationUrl}}" class="button">Verify Email</a>
          </center>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">{{verificationUrl}}</p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br />The Padel Platform Team</p>
        </div>
      </div>
    </body>
  </html>
  ```

### Day 9: Login System & JWT Implementation

#### Morning Session (9 AM - 1 PM)

**Task 9.1: Login Endpoint & JWT Strategy**

- [ ] Implement login endpoint

  ```typescript
  // services/user/src/modules/auth/auth.controller.ts
  import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Request,
    HttpCode,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
  import { AuthService } from './auth.service';
  import { LoginDto } from '../../dto/login.dto';
  import { RegisterUserDto, VerifyEmailDto } from '../../dto/register.dto';
  import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
  import { RefreshTokenDto } from '../../dto/refresh-token.dto';

  @ApiTags('authentication')
  @Controller('auth')
  export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    async register(@Body() registerDto: RegisterUserDto) {
      return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(200)
    @ApiOperation({ summary: 'Login with email and password' })
    async login(@Body() loginDto: LoginDto) {
      return this.authService.login(loginDto);
    }

    @Post('verify-email')
    @HttpCode(200)
    @ApiOperation({ summary: 'Verify email with token' })
    async verifyEmail(@Body() verifyDto: VerifyEmailDto) {
      return this.authService.verifyEmail(verifyDto.token);
    }

    @Post('refresh')
    @HttpCode(200)
    @ApiOperation({ summary: 'Refresh access token' })
    async refreshToken(@Body() refreshDto: RefreshTokenDto) {
      return this.authService.refreshToken(refreshDto.refreshToken);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(200)
    @ApiOperation({ summary: 'Logout and invalidate tokens' })
    async logout(@Request() req) {
      return this.authService.logout(req.user.id);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    async getProfile(@Request() req) {
      return this.authService.getProfile(req.user.id);
    }
  }
  ```

- [ ] Configure JWT strategy

  ```typescript
  // services/user/src/strategies/jwt.strategy.ts
  import { ExtractJwt, Strategy } from 'passport-jwt';
  import { PassportStrategy } from '@nestjs/passport';
  import { Injectable, UnauthorizedException } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { UserService } from '../modules/user/user.service';

  @Injectable()
  export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
      private configService: ConfigService,
      private userService: UserService
    ) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.get('JWT_SECRET'),
      });
    }

    async validate(payload: any) {
      const user = await this.userService.findById(payload.sub);

      if (!user || !user.isVerified) {
        throw new UnauthorizedException('User not found or not verified');
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }
  }
  ```

#### Afternoon Session (2 PM - 6 PM)

**Task 9.2: Password Reset & Account Security**

- [ ] Implement password reset flow

  ```typescript
  // services/user/src/modules/auth/auth.service.ts (additional methods)
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await this.userRepository.save(user);

    // Send reset email
    await this.emailService.sendPasswordResetEmail(email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await this.userRepository.save(user);

    // Send confirmation email
    await this.emailService.sendPasswordChangedEmail(user.email);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid old password');
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    // Invalidate all existing tokens
    await this.invalidateUserTokens(userId);
  }
  ```

- [ ] Add rate limiting for security

  ```typescript
  // services/user/src/guards/rate-limit.guard.ts
  import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import * as Redis from 'ioredis';

  @Injectable()
  export class RateLimitGuard implements CanActivate {
    private redis: Redis.Redis;

    constructor(private reflector: Reflector) {
      this.redis = new Redis.Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      });
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const limit =
        this.reflector.get<number>('rateLimit', context.getHandler()) || 100;
      const ttl =
        this.reflector.get<number>('rateLimitTTL', context.getHandler()) || 60;

      const key = `rate_limit:${request.ip}:${request.path}`;
      const current = await this.redis.incr(key);

      if (current === 1) {
        await this.redis.expire(key, ttl);
      }

      if (current > limit) {
        throw new HttpException(
          'Too many requests',
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      return true;
    }
  }
  ```

### Day 10: OAuth Integration

#### Morning Session (9 AM - 1 PM)

**Task 10.1: Google OAuth Implementation**

- [ ] Setup Google OAuth strategy

  ```typescript
  // services/user/src/strategies/google.strategy.ts
  import { PassportStrategy } from '@nestjs/passport';
  import { Strategy, VerifyCallback } from 'passport-google-oauth20';
  import { Injectable } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { AuthService } from '../modules/auth/auth.service';

  @Injectable()
  export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
      private configService: ConfigService,
      private authService: AuthService
    ) {
      super({
        clientID: configService.get('GOOGLE_CLIENT_ID'),
        clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
        callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
        scope: ['email', 'profile'],
      });
    }

    async validate(
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: VerifyCallback
    ): Promise<any> {
      const { name, emails, photos } = profile;
      const user = {
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        picture: photos[0].value,
        provider: 'google',
        providerId: profile.id,
      };

      const validatedUser = await this.authService.validateOAuthUser(user);
      done(null, validatedUser);
    }
  }
  ```

- [ ] OAuth user handling

  ```typescript
  // services/user/src/modules/auth/auth.service.ts (additional methods)
  async validateOAuthUser(oauthUser: any): Promise<any> {
    let user = await this.userRepository.findOne({
      where: { email: oauthUser.email },
    });

    if (!user) {
      // Create new user from OAuth data
      user = this.userRepository.create({
        email: oauthUser.email,
        firstName: oauthUser.firstName,
        lastName: oauthUser.lastName,
        isVerified: true, // OAuth users are pre-verified
        provider: oauthUser.provider,
        providerId: oauthUser.providerId,
        profilePicture: oauthUser.picture,
        role: 'player', // Default role
      });

      await this.userRepository.save(user);

      // Send welcome email
      await this.emailService.sendWelcomeEmail(user.email, user.firstName);
    } else if (!user.provider) {
      // Link OAuth to existing email/password account
      user.provider = oauthUser.provider;
      user.providerId = oauthUser.providerId;
      if (!user.profilePicture) {
        user.profilePicture = oauthUser.picture;
      }
      await this.userRepository.save(user);
    }

    const tokens = await this.generateTokens(user);
    return { user, tokens };
  }
  ```

#### Afternoon Session (2 PM - 6 PM)

**Task 10.2: Facebook OAuth & OAuth Controller**

- [ ] Setup Facebook OAuth

  ```typescript
  // services/user/src/strategies/facebook.strategy.ts
  import { PassportStrategy } from '@nestjs/passport';
  import { Strategy, Profile } from 'passport-facebook';
  import { Injectable } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { AuthService } from '../modules/auth/auth.service';

  @Injectable()
  export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor(
      private configService: ConfigService,
      private authService: AuthService
    ) {
      super({
        clientID: configService.get('FACEBOOK_APP_ID'),
        clientSecret: configService.get('FACEBOOK_APP_SECRET'),
        callbackURL: configService.get('FACEBOOK_CALLBACK_URL'),
        scope: 'email',
        profileFields: ['emails', 'name', 'photos'],
      });
    }

    async validate(
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: any
    ): Promise<any> {
      const { name, emails, photos } = profile;
      const user = {
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        picture: photos[0].value,
        provider: 'facebook',
        providerId: profile.id,
      };

      const validatedUser = await this.authService.validateOAuthUser(user);
      done(null, validatedUser);
    }
  }
  ```

- [ ] OAuth routes

  ```typescript
  // services/user/src/modules/auth/oauth.controller.ts
  import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';

  @ApiTags('oauth')
  @Controller('auth/oauth')
  export class OAuthController {
    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiExcludeEndpoint()
    googleAuth() {
      // Guard redirects to Google
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @ApiExcludeEndpoint()
    googleAuthCallback(@Req() req, @Res() res) {
      const { user, tokens } = req.user;
      // Redirect to frontend with tokens
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`
      );
    }

    @Get('facebook')
    @UseGuards(AuthGuard('facebook'))
    @ApiExcludeEndpoint()
    facebookAuth() {
      // Guard redirects to Facebook
    }

    @Get('facebook/callback')
    @UseGuards(AuthGuard('facebook'))
    @ApiExcludeEndpoint()
    facebookAuthCallback(@Req() req, @Res() res) {
      const { user, tokens } = req.user;
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`
      );
    }
  }
  ```

### Day 11: User Profile Management

#### Morning Session (9 AM - 1 PM)

**Task 11.1: User Profile CRUD Operations**

- [ ] Create user profile DTOs

  ```typescript
  // services/user/src/dto/user-profile.dto.ts
  import {
    IsString,
    IsOptional,
    IsEnum,
    IsUrl,
    IsObject,
  } from 'class-validator';
  import { ApiProperty } from '@nestjs/swagger';

  export class CreateUserProfileDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiProperty({
      enum: ['beginner', 'intermediate', 'advanced', 'professional'],
      required: false,
    })
    @IsOptional()
    @IsEnum(['beginner', 'intermediate', 'advanced', 'professional'])
    skillLevel?: string;

    @ApiProperty({
      enum: ['daily', 'weekly', 'monthly', 'occasionally'],
      required: false,
    })
    @IsOptional()
    @IsEnum(['daily', 'weekly', 'monthly', 'occasionally'])
    playFrequency?: string;

    @ApiProperty({
      enum: ['morning', 'afternoon', 'evening', 'night'],
      required: false,
    })
    @IsOptional()
    @IsEnum(['morning', 'afternoon', 'evening', 'night'])
    preferredPlayTime?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUrl()
    profilePictureUrl?: string;

    @ApiProperty({ type: 'object', required: false })
    @IsOptional()
    @IsObject()
    achievements?: object;

    @ApiProperty({ type: 'object', required: false })
    @IsOptional()
    @IsObject()
    stats?: object;
  }

  export class CreateCourtDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ enum: ['padel', 'tennis', 'badminton', 'squash'] })
    @IsEnum(['padel', 'tennis', 'badminton', 'squash'])
    courtType: string;

    @ApiProperty({ enum: ['artificial_grass', 'concrete', 'clay', 'hard'] })
    @IsEnum(['artificial_grass', 'concrete', 'clay', 'hard'])
    surfaceType: string;

    @ApiProperty()
    @IsBoolean()
    isIndoor: boolean;

    @ApiProperty()
    @IsNumber()
    basePrice: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    peakPrice?: number;

    @ApiProperty({ type: [String], required: false })
    @IsOptional()
    @IsArray()
    amenities?: string[];
  }

  export class OperatingHoursDto {
    @ApiProperty({ example: 0, description: '0=Sunday, 6=Saturday' })
    @IsNumber()
    dayOfWeek: number;

    @ApiProperty({ example: '09:00' })
    @IsString()
    openTime: string;

    @ApiProperty({ example: '22:00' })
    @IsString()
    closeTime: string;

    @ApiProperty()
    @IsBoolean()
    isClosed: boolean;
  }
  ```

- [ ] Implement venue service

  ```typescript
  // services/venue/src/modules/venue/venue.service.ts
  import {
    Injectable,
    NotFoundException,
    ForbiddenException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { Venue } from '../../entities/venue.entity';
  import { Court } from '../../entities/court.entity';
  import { OperatingHours } from '../../entities/operating-hours.entity';
  import { CreateVenueDto, UpdateVenueDto } from '../../dto/venue.dto';
  import { PaginationDto } from '../../dto/pagination.dto';

  @Injectable()
  export class VenueService {
    constructor(
      @InjectRepository(Venue)
      private venueRepository: Repository<Venue>,
      @InjectRepository(Court)
      private courtRepository: Repository<Court>,
      @InjectRepository(OperatingHours)
      private operatingHoursRepository: Repository<OperatingHours>
    ) {}

    async create(
      createVenueDto: CreateVenueDto,
      ownerId: string
    ): Promise<Venue> {
      const venue = this.venueRepository.create({
        ...createVenueDto,
        ownerId,
        status: 'pending', // Requires admin approval
      });

      return await this.venueRepository.save(venue);
    }

    async findAll(
      pagination: PaginationDto,
      filters?: any
    ): Promise<{
      venues: Venue[];
      total: number;
      page: number;
      limit: number;
    }> {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const query = this.venueRepository
        .createQueryBuilder('venue')
        .leftJoinAndSelect('venue.courts', 'courts')
        .where('venue.status = :status', { status: 'active' });

      if (filters?.city) {
        query.andWhere('venue.city = :city', { city: filters.city });
      }

      if (filters?.search) {
        query.andWhere(
          '(venue.name ILIKE :search OR venue.description ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      const [venues, total] = await query
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        venues,
        total,
        page,
        limit,
      };
    }

    async findById(id: string): Promise<Venue> {
      const venue = await this.venueRepository.findOne({
        where: { id },
        relations: ['courts', 'operatingHours'],
      });

      if (!venue) {
        throw new NotFoundException('Venue not found');
      }

      return venue;
    }

    async update(
      id: string,
      updateVenueDto: UpdateVenueDto,
      userId: string
    ): Promise<Venue> {
      const venue = await this.findById(id);

      if (venue.ownerId !== userId) {
        throw new ForbiddenException('You can only update your own venues');
      }

      Object.assign(venue, updateVenueDto);
      return await this.venueRepository.save(venue);
    }

    async delete(id: string, userId: string): Promise<void> {
      const venue = await this.findById(id);

      if (venue.ownerId !== userId) {
        throw new ForbiddenException('You can only delete your own venues');
      }

      await this.venueRepository.softDelete(id);
    }

    async addCourt(
      venueId: string,
      createCourtDto: any,
      userId: string
    ): Promise<Court> {
      const venue = await this.findById(venueId);

      if (venue.ownerId !== userId) {
        throw new ForbiddenException(
          'You can only add courts to your own venues'
        );
      }

      const court = this.courtRepository.create({
        ...createCourtDto,
        venueId,
      });

      return await this.courtRepository.save(court);
    }

    async setOperatingHours(
      venueId: string,
      operatingHours: OperatingHoursDto[],
      userId: string
    ): Promise<OperatingHours[]> {
      const venue = await this.findById(venueId);

      if (venue.ownerId !== userId) {
        throw new ForbiddenException(
          'You can only set operating hours for your own venues'
        );
      }

      // Delete existing operating hours
      await this.operatingHoursRepository.delete({ venueId });

      // Create new operating hours
      const hours = operatingHours.map(hour =>
        this.operatingHoursRepository.create({
          ...hour,
          venueId,
        })
      );

      return await this.operatingHoursRepository.save(hours);
    }
  }
  ```

#### Afternoon Session (2 PM - 6 PM)

**Task 11.2: Venue Search & Filtering**

- [ ] Implement search functionality

  ```typescript
  // services/venue/src/modules/venue/venue.search.service.ts
  import { Injectable } from '@nestjs/common';
  import { ElasticsearchService } from '@nestjs/elasticsearch';
  import { Venue } from '../../entities/venue.entity';

  @Injectable()
  export class VenueSearchService {
    private readonly index = 'venues';

    constructor(private elasticsearchService: ElasticsearchService) {}

    async indexVenue(venue: Venue): Promise<void> {
      await this.elasticsearchService.index({
        index: this.index,
        id: venue.id,
        body: {
          id: venue.id,
          name: venue.name,
          description: venue.description,
          address: venue.address,
          city: venue.city,
          location:
            venue.latitude && venue.longitude
              ? {
                  lat: venue.latitude,
                  lon: venue.longitude,
                }
              : null,
          amenities: venue.amenities,
          rating: venue.rating,
          totalReviews: venue.totalReviews,
          status: venue.status,
          courts: venue.courts?.map(court => ({
            id: court.id,
            name: court.name,
            type: court.courtType,
            surface: court.surfaceType,
            isIndoor: court.isIndoor,
            basePrice: court.basePrice,
          })),
          createdAt: venue.createdAt,
        },
      });
    }

    async searchVenues(params: {
      query?: string;
      city?: string;
      lat?: number;
      lon?: number;
      radius?: number;
      minPrice?: number;
      maxPrice?: number;
      amenities?: string[];
      page?: number;
      limit?: number;
    }): Promise<any> {
      const { page = 1, limit = 10 } = params;
      const from = (page - 1) * limit;

      const must = [];
      const filter = [];

      // Always filter for active venues
      filter.push({ term: { status: 'active' } });

      if (params.query) {
        must.push({
          multi_match: {
            query: params.query,
            fields: ['name^3', 'description^2', 'address', 'amenities'],
            fuzziness: 'AUTO',
          },
        });
      }

      if (params.city) {
        filter.push({ term: { city: params.city.toLowerCase() } });
      }

      if (params.lat && params.lon) {
        filter.push({
          geo_distance: {
            distance: `${params.radius || 10}km`,
            location: {
              lat: params.lat,
              lon: params.lon,
            },
          },
        });
      }

      if (params.minPrice || params.maxPrice) {
        filter.push({
          nested: {
            path: 'courts',
            query: {
              range: {
                'courts.basePrice': {
                  ...(params.minPrice && { gte: params.minPrice }),
                  ...(params.maxPrice && { lte: params.maxPrice }),
                },
              },
            },
          },
        });
      }

      if (params.amenities?.length) {
        filter.push({
          terms: { amenities: params.amenities },
        });
      }

      const body = {
        query: {
          bool: {
            ...(must.length && { must }),
            ...(filter.length && { filter }),
          },
        },
        sort: [
          ...(params.lat && params.lon
            ? [
                {
                  _geo_distance: {
                    location: {
                      lat: params.lat,
                      lon: params.lon,
                    },
                    order: 'asc',
                    unit: 'km',
                  },
                },
              ]
            : []),
          { rating: { order: 'desc' } },
        ],
        from,
        size: limit,
      };

      const result = await this.elasticsearchService.search({
        index: this.index,
        body,
      });

      return {
        venues: result.body.hits.hits.map(hit => ({
          ...hit._source,
          distance: hit.sort?.[0],
        })),
        total: result.body.hits.total.value,
        page,
        limit,
      };
    }
  }
  ```

### Day 12: Admin Portal Foundation

#### Morning Session (9 AM - 1 PM)

**Task 12.1: Admin Authentication & Authorization**

- [ ] Create admin guard

  ```typescript
  // shared/guards/admin.guard.ts
  import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';

  @Injectable()
  export class AdminGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user || user.role !== 'admin') {
        throw new ForbiddenException('Admin access required');
      }

      return true;
    }
  }

  @Injectable()
  export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
      const roles = this.reflector.get<string[]>('roles', context.getHandler());
      if (!roles) {
        return true;
      }

      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user) {
        throw new ForbiddenException('Authentication required');
      }

      const hasRole = roles.includes(user.role);
      if (!hasRole) {
        throw new ForbiddenException(`Required role: ${roles.join(' or ')}`);
      }

      return true;
    }
  }
  ```

- [ ] Admin controller

  ```typescript
  // services/user/src/modules/admin/admin.controller.ts
  import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
  } from '@nestjs/common';
  import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
  import { AdminGuard } from '../../guards/admin.guard';
  import { AdminService } from './admin.service';

  @ApiTags('admin')
  @Controller('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  export class AdminController {
    constructor(private adminService: AdminService) {}

    @Get('dashboard')
    @ApiOperation({ summary: 'Get admin dashboard data' })
    async getDashboard() {
      return this.adminService.getDashboardData();
    }

    @Get('users')
    @ApiOperation({ summary: 'Get all users with pagination' })
    async getUsers(@Query() query: any) {
      return this.adminService.getUsers(query);
    }

    @Put('users/:id/status')
    @ApiOperation({ summary: 'Update user status' })
    async updateUserStatus(
      @Param('id') id: string,
      @Body() body: { status: string; reason?: string }
    ) {
      return this.adminService.updateUserStatus(id, body.status, body.reason);
    }

    @Get('venues/pending')
    @ApiOperation({ summary: 'Get pending venue approvals' })
    async getPendingVenues() {
      return this.adminService.getPendingVenues();
    }

    @Put('venues/:id/approve')
    @ApiOperation({ summary: 'Approve venue' })
    async approveVenue(@Param('id') id: string) {
      return this.adminService.approveVenue(id);
    }

    @Put('venues/:id/reject')
    @ApiOperation({ summary: 'Reject venue' })
    async rejectVenue(
      @Param('id') id: string,
      @Body() body: { reason: string }
    ) {
      return this.adminService.rejectVenue(id, body.reason);
    }

    @Get('analytics')
    @ApiOperation({ summary: 'Get platform analytics' })
    async getAnalytics(@Query() query: { startDate: string; endDate: string }) {
      return this.adminService.getAnalytics(query.startDate, query.endDate);
    }
  }
  ```

#### Afternoon Session (2 PM - 6 PM)

**Task 12.2: Admin Dashboard Service**

- [ ] Implement admin service

  ```typescript
  // services/user/src/modules/admin/admin.service.ts
  import { Injectable } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository, Between } from 'typeorm';
  import { User } from '../../entities/user.entity';
  import { HttpService } from '@nestjs/axios';
  import { firstValueFrom } from 'rxjs';

  @Injectable()
  export class AdminService {
    constructor(
      @InjectRepository(User)
      private userRepository: Repository<User>,
      private httpService: HttpService
    ) {}

    async getDashboardData() {
      const today = new Date();
      const lastMonth = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        today.getDate()
      );

      // Get user statistics
      const totalUsers = await this.userRepository.count();
      const newUsersThisMonth = await this.userRepository.count({
        where: {
          createdAt: Between(lastMonth, today),
        },
      });

      // Get venue statistics from venue service
      const venueStats = await this.getVenueStatistics();

      // Get booking statistics from booking service
      const bookingStats = await this.getBookingStatistics();

      return {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
          activeToday: await this.getActiveUsersToday(),
        },
        venues: venueStats,
        bookings: bookingStats,
        revenue: await this.getRevenueStatistics(),
      };
    }

    async getUsers(query: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      status?: string;
    }) {
      const { page = 1, limit = 10, search, role, status } = query;
      const skip = (page - 1) * limit;

      const queryBuilder = this.userRepository.createQueryBuilder('user');

      if (search) {
        queryBuilder.andWhere(
          '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (role) {
        queryBuilder.andWhere('user.role = :role', { role });
      }

      if (status) {
        queryBuilder.andWhere('user.isVerified = :status', {
          status: status === 'verified',
        });
      }

      const [users, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    async updateUserStatus(userId: string, status: string, reason?: string) {
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      switch (status) {
        case 'active':
          user.isActive = true;
          user.isSuspended = false;
          break;
        case 'suspended':
          user.isActive = false;
          user.isSuspended = true;
          user.suspensionReason = reason;
          break;
        case 'deleted':
          await this.userRepository.softDelete(userId);
          return { message: 'User deleted successfully' };
      }

      await this.userRepository.save(user);
      return user;
    }

    async getPendingVenues() {
      // Call venue service to get pending venues
      const response = await firstValueFrom(
        this.httpService.get(
          `http://venue-service:3002/internal/venues/pending`,
          {
            headers: { 'X-Internal-Service': 'admin-service' },
          }
        )
      );
      return response.data;
    }

    async approveVenue(venueId: string) {
      const response = await firstValueFrom(
        this.httpService.put(
          `http://venue-service:3002/internal/venues/${venueId}/approve`,
          {},
          { headers: { 'X-Internal-Service': 'admin-service' } }
        )
      );
      return response.data;
    }

    async rejectVenue(venueId: string, reason: string) {
      const response = await firstValueFrom(
        this.httpService.put(
          `http://venue-service:3002/internal/venues/${venueId}/reject`,
          { reason },
          { headers: { 'X-Internal-Service': 'admin-service' } }
        )
      );
      return response.data;
    }

    async getAnalytics(startDate: string, endDate: string) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const userGrowth = await this.getUserGrowthData(start, end);
      const revenueGrowth = await this.getRevenueGrowthData(start, end);
      const bookingTrends = await this.getBookingTrendsData(start, end);

      return {
        userGrowth,
        revenueGrowth,
        bookingTrends,
        period: { startDate, endDate },
      };
    }

    private async getVenueStatistics() {
      try {
        const response = await firstValueFrom(
          this.httpService.get(
            'http://venue-service:3002/internal/statistics',
            {
              headers: { 'X-Internal-Service': 'admin-service' },
            }
          )
        );
        return response.data;
      } catch (error) {
        return { total: 0, active: 0, pending: 0 };
      }
    }

    private async getBookingStatistics() {
      try {
        const response = await firstValueFrom(
          this.httpService.get(
            'http://booking-service:3003/internal/statistics',
            {
              headers: { 'X-Internal-Service': 'admin-service' },
            }
          )
        );
        return response.data;
      } catch (error) {
        return { total: 0, today: 0, thisMonth: 0 };
      }
    }
  }
  ```

### Day 13: Testing & Integration

#### Morning Session (9 AM - 1 PM)

**Task 13.1: Unit Tests for Auth Service**

- [ ] Write comprehensive auth tests

  ```typescript
  // services/user/test/auth.service.spec.ts
  import { Test, TestingModule } from '@nestjs/testing';
  import { AuthService } from '../src/modules/auth/auth.service';
  import { Repository } from 'typeorm';
  import { getRepositoryToken } from '@nestjs/typeorm';
  import { User } from '../src/entities/user.entity';
  import { JwtService } from '@nestjs/jwt';
  import { EmailService } from '../src/modules/email/email.service';
  import * as bcrypt from 'bcrypt';

  describe('AuthService', () => {
    let service: AuthService;
    let userRepository: Repository<User>;
    let jwtService: JwtService;
    let emailService: EmailService;

    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockEmailService = {
      sendVerificationEmail: jest.fn(),
      sendWelcomeEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    };

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: getRepositoryToken(User),
            useValue: mockUserRepository,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
          {
            provide: EmailService,
            useValue: mockEmailService,
          },
        ],
      }).compile();

      service = module.get<AuthService>(AuthService);
      userRepository = module.get<Repository<User>>(getRepositoryToken(User));
      jwtService = module.get<JwtService>(JwtService);
      emailService = module.get<EmailService>(EmailService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('register', () => {
      it('should successfully register a new user', async () => {
        const registerDto = {
          email: 'test@example.com',
          password: 'Test@123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'player' as const,
        };

        mockUserRepository.findOne.mockResolvedValue(null);
        mockUserRepository.create.mockReturnValue({ id: '1', ...registerDto });
        mockUserRepository.save.mockResolvedValue({ id: '1', ...registerDto });
        mockJwtService.sign.mockReturnValue('token');
        mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

        const result = await service.register(registerDto);

        expect(result).toHaveProperty('user');
        expect(result).toHaveProperty('tokens');
        expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
      });

      it('should throw ConflictException if user already exists', async () => {
        const registerDto = {
          email: 'existing@example.com',
          password: 'Test@123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'player' as const,
        };

        mockUserRepository.findOne.mockResolvedValue({
          id: '1',
          email: registerDto.email,
        });

        await expect(service.register(registerDto)).rejects.toThrow(
          'User with this email already exists'
        );
      });
    });

    describe('login', () => {
      it('should successfully login with valid credentials', async () => {
        const loginDto = {
          email: 'test@example.com',
          password: 'Test@123',
        };

        const hashedPassword = await bcrypt.hash(loginDto.password, 10);
        const user = {
          id: '1',
          email: loginDto.email,
          password: hashedPassword,
          isVerified: true,
        };

        mockUserRepository.findOne.mockResolvedValue(user);
        jest
          .spyOn(bcrypt, 'compare')
          .mockImplementation(() => Promise.resolve(true));
        mockJwtService.sign.mockReturnValue('token');

        const result = await service.login(loginDto);

        expect(result).toHaveProperty('user');
        expect(result).toHaveProperty('tokens');
      });

      it('should throw UnauthorizedException for invalid credentials', async () => {
        const loginDto = {
          email: 'test@example.com',
          password: 'WrongPassword',
        };

        mockUserRepository.findOne.mockResolvedValue(null);

        await expect(service.login(loginDto)).rejects.toThrow(
          'Invalid credentials'
        );
      });
    });

    describe('verifyEmail', () => {
      it('should verify email with valid token', async () => {
        const token = 'valid-token';
        const user = {
          id: '1',
          email: 'test@example.com',
          verificationToken: token,
          isVerified: false,
        };

        mockUserRepository.findOne.mockResolvedValue(user);
        mockUserRepository.save.mockResolvedValue({
          ...user,
          isVerified: true,
        });
        mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);

        const result = await service.verifyEmail(token);

        expect(result).toBe(true);
        expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalled();
      });

      it('should throw BadRequestException for invalid token', async () => {
        mockUserRepository.findOne.mockResolvedValue(null);

        await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
          'Invalid verification token'
        );
      });
    });
  });
  ```

#### Afternoon Session (2 PM - 6 PM)

**Task 13.2: Integration Tests**

- [ ] Write E2E tests

  ```typescript
  // test/e2e/auth.e2e-spec.ts
  import { Test, TestingModule } from '@nestjs/testing';
  import { INestApplication } from '@nestjs/common';
  import * as request from 'supertest';
  import { AppModule } from '../src/app.module';

  describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let authToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    describe('/auth/register (POST)', () => {
      it('should register a new user', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: `test-${Date.now()}@example.com`,
            password: 'Test@123',
            firstName: 'Test',
            lastName: 'User',
            role: 'player',
          })
          .expect(201);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('tokens');
        expect(response.body.user.email).toBeDefined();
        expect(response.body.tokens.accessToken).toBeDefined();
      });

      it('should not register duplicate email', async () => {
        const email = `duplicate-${Date.now()}@example.com`;

        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email,
            password: 'Test@123',
            firstName: 'Test',
            lastName: 'User',
            role: 'player',
          })
          .expect(201);

        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email,
            password: 'Test@123',
            firstName: 'Test',
            lastName: 'User',
            role: 'player',
          })
          .expect(409);
      });
    });

    describe('/auth/login (POST)', () => {
      const testEmail = `login-test-${Date.now()}@example.com`;
      const testPassword = 'Test@123';

      beforeAll(async () => {
        // Register user for login tests
        await request(app.getHttpServer()).post('/auth/register').send({
          email: testEmail,
          password: testPassword,
          firstName: 'Login',
          lastName: 'Test',
          role: 'player',
        });
      });

      it('should login with valid credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testEmail,
            password: testPassword,
          })
          .expect(200);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('tokens');
        authToken = response.body.tokens.accessToken;
        refreshToken = response.body.tokens.refreshToken;
      });

      it('should not login with invalid password', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testEmail,
            password: 'WrongPassword',
          })
          .expect(401);
      });
    });

    describe('/auth/me (GET)', () => {
      it('should get current user profile with valid token', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email');
        expect(response.body).not.toHaveProperty('password');
      });

      it('should not get profile without token', async () => {
        await request(app.getHttpServer()).get('/auth/me').expect(401);
      });
    });

    describe('/auth/refresh (POST)', () => {
      it('should refresh access token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/refresh')
          .send({
            refreshToken,
          })
          .expect(200);

        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
      });
    });
  });
  ```

### Day 14: Documentation & Deployment

#### Morning Session (9 AM - 1 PM)

**Task 14.1: API Documentation Completion**

- [ ] Complete Swagger documentation
- [ ] Create API usage examples
- [ ] Document authentication flows
- [ ] Create venue management guide

#### Afternoon Session (2 PM - 6 PM)

**Task 14.2: Week 2 Deployment**

- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Performance testing
- [ ] Security audit

---

## 🧪 Testing Requirements

### Unit Testing Checklist

- [ ] **Authentication Tests** (>90% coverage)
  - [ ] Registration with validation
  - [ ] Login with various scenarios
  - [ ] Token generation and refresh
  - [ ] Password reset flow
  - [ ] Email verification

- [ ] **Venue Management Tests** (>85% coverage)
  - [ ] CRUD operations
  - [ ] Search and filtering
  - [ ] Operating hours management
  - [ ] Court management

- [ ] **Admin Tests** (>80% coverage)
  - [ ] User management
  - [ ] Venue approval workflow
  - [ ] Analytics data retrieval

### Integration Testing Checklist

- [ ] **Auth Flow E2E**

  ```bash
  npm run test:e2e -- auth
  ```

  - [ ] Complete registration to login flow
  - [ ] OAuth authentication flows
  - [ ] Password reset end-to-end

- [ ] **Venue Management E2E**

  ```bash
  npm run test:e2e -- venue
  ```

  - [ ] Venue creation and approval
  - [ ] Search with various filters
  - [ ] Court management operations

### Security Testing

- [ ] **Authentication Security**
  - [ ] SQL injection prevention
  - [ ] XSS protection
  - [ ] Rate limiting effectiveness
  - [ ] JWT security validation

### Performance Testing

- [ ] **Load Testing Results**

  ```bash
  k6 run scripts/week2-load-test.js
  ```

  - [ ] Login endpoint: 500 requests/second
  - [ ] Venue search: 300 requests/second
  - [ ] User registration: 100 requests/second

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (Unit: >85%, Integration: 100%)
- [ ] Security audit completed
- [ ] Database migrations tested
- [ ] Email service configured and tested
- [ ] OAuth providers configured

### Deployment Steps

1. [ ] Deploy user service updates
2. [ ] Deploy venue service
3. [ ] Update API gateway routes
4. [ ] Run database migrations
5. [ ] Verify service health

### Post-Deployment Verification

- [ ] User registration working
- [ ] Email verification functional
- [ ] OAuth login operational
- [ ] Venue search returning results
- [ ] Admin dashboard accessible

---

## ✅ Week 2 Acceptance Criteria

### Must Have (P0)

- [x] User registration with email verification
- [x] JWT-based authentication
- [x] Password reset functionality
- [x] Basic venue CRUD operations
- [x] Admin authentication
- [x] Venue search functionality

### Should Have (P1)

- [x] OAuth integration (Google, Facebook)
- [x] Rate limiting implementation
- [x] Admin dashboard foundation
- [x] Elasticsearch integration for venues

### Nice to Have (P2)

- [ ] Two-factor authentication
- [ ] Advanced admin analytics
- [ ] Venue image upload
- [ ] Email templates customization

---

## 📊 Week 2 Sign-off

### Technical Metrics

- **Test Coverage**: Unit: **\_%, Integration: \_\_**%
- **Security Scan**: \_\_\_ vulnerabilities found and fixed
- **Performance**: All endpoints <200ms response time
- **Code Quality**: ESLint: **_ issues, SonarQube: _** code smells

### Deliverables Completed

- ✅ Complete authentication system
- ✅ Email service integration
- ✅ Venue management foundation
- ✅ Admin portal basics
- ✅ Security implementation

### Known Issues

1. Issue: **\*\*\*\***\_**\*\*\*\*** | Priority: **\_ | Resolution: \*\*\*\***\_\_\_**\*\*\*\***
2. Issue: **\*\*\*\***\_**\*\*\*\*** | Priority: **\_ | Resolution: \*\*\*\***\_\_\_**\*\*\*\***

---

**Week 2 Status**: 🟢 COMPLETE | 🟡 PARTIAL | 🔴 BLOCKED

**Overall Progress**: ██████████░░░░░ 14% Complete (2/14 weeks)

**Next Steps**: Proceed to Week 3 - Core Booking System Implementation
