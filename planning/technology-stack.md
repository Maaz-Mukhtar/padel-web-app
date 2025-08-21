# Technology Stack - Comprehensive Technical Specifications

## 🎯 Technology Philosophy

### Design Principles

- **Cloud-Native**: Built for scalability and modern deployment patterns
- **API-First**: Contract-driven development with OpenAPI specifications
- **Microservices**: Domain-driven service boundaries for maintainability
- **Security by Design**: Zero-trust architecture with defense in depth
- **Performance-Focused**: Sub-200ms response times and high throughput
- **Developer Experience**: Modern tooling and development workflows

---

## 🖥️ Frontend Technology Stack

### Web Application Framework

**Next.js 14 (App Router)**

- **Framework**: React 18 with Next.js 14 App Router
- **Language**: TypeScript 5.0+ for type safety
- **Styling**: Tailwind CSS 3.3+ with custom design system
- **State Management**: Zustand for global state, React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Authentication**: NextAuth.js v5 with JWT strategy

```typescript
// Next.js 14 App Router configuration
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverActions: true,
    typedRoutes: true,
  },
  images: {
    domains: ['images.padelplatform.pk', 'avatars.padelplatform.pk'],
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
};

export default nextConfig;
```

### UI Component Library

**Custom Design System with Tailwind CSS**

- **Base Framework**: Tailwind CSS 3.3+
- **Component Library**: Custom components built with Radix UI primitives
- **Icons**: Lucide React for consistent iconography
- **Animations**: Framer Motion for smooth interactions
- **Charts**: Recharts for analytics dashboards

```typescript
// Design system configuration
export const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      900: '#1e3a8a',
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
    },
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
};
```

### Mobile Application Framework

**React Native with Expo (SDK 50)**

- **Framework**: React Native 0.73+ with Expo SDK 50
- **Language**: TypeScript with strict mode
- **Navigation**: React Navigation v6 with type-safe routing
- **State Management**: Zustand with async storage persistence
- **UI Library**: NativeBase with custom theme
- **Maps**: React Native Maps with Google Maps integration

```typescript
// React Native app configuration
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Padel Platform',
  slug: 'padel-platform',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  plugins: [
    'expo-secure-store',
    'expo-camera',
    'expo-location',
    'expo-notifications',
    [
      'expo-build-properties',
      {
        ios: {
          newArchEnabled: true,
        },
        android: {
          newArchEnabled: true,
        },
      },
    ],
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.padelplatform.app',
    buildNumber: '1',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'com.padelplatform.app',
    versionCode: 1,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
};

export default config;
```

---

## ⚙️ Backend Technology Stack

### API Framework & Runtime

**NestJS 10 with Node.js 20**

- **Runtime**: Node.js 20 LTS with ECMAScript modules
- **Framework**: NestJS 10 with Express adapter
- **Language**: TypeScript 5.0+ with strict configuration
- **Validation**: Class-validator with class-transformer
- **Documentation**: Swagger/OpenAPI 3.0 with automatic generation
- **Testing**: Jest with supertest for integration testing

```typescript
// NestJS application bootstrap
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    })
  );

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Padel Platform API')
    .setDescription(
      "API documentation for Pakistan's premier padel booking platform"
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('authentication', 'User authentication and authorization')
    .addTag('users', 'User profile management')
    .addTag('notifications', 'Multi-channel notifications')
    .addTag('bookings', 'Booking management and scheduling')
    .addTag('payments', 'Payment processing and financial transactions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3001);
}

bootstrap();
```

### Microservices Architecture

**Service-Oriented Architecture with Domain Boundaries**

#### Core MVP Services (Phase 1)

1. **Authentication Service**
   - User registration and login
   - JWT token management
   - OAuth integration (Google, Facebook)
   - Password reset functionality

2. **User Service**
   - User profile management
   - Player preferences and settings
   - Social connections and friends
   - Skill level tracking

3. **Booking Service**
   - Core booking functionality
   - Availability checking
   - Booking lifecycle management
   - Basic calendar integration

4. **Notification Service**
   - Email notifications (booking confirmations)
   - SMS notifications for reminders
   - WhatsApp Business API integration
   - Push notification preparation

```typescript
// Example microservice module structure
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        STRIPE_SECRET_KEY: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl:
          configService.get('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        config: {
          url: configService.get('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    UserModule,
    VenueModule,
    BookingModule,
    PaymentModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
```

### API Design & Communication

**GraphQL Federation with REST Fallback**

- **Primary API**: GraphQL with Apollo Federation
- **Fallback API**: RESTful endpoints for simple operations
- **Real-time**: WebSocket with Socket.io for live updates
- **Inter-service**: gRPC for high-performance service communication

```typescript
// GraphQL Federation gateway configuration
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import { ApolloServer } from 'apollo-server-express';

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'users', url: 'http://user-service:4001/graphql' },
      { name: 'users', url: 'http://user-service:3002/graphql' },
      { name: 'bookings', url: 'http://booking-service:3003/graphql' },
      {
        name: 'notifications',
        url: 'http://notification-service:3004/graphql',
      },
    ],
  }),
});

const server = new ApolloServer({
  gateway,
  subscriptions: false,
  context: ({ req }) => ({
    user: req.user,
    headers: req.headers,
  }),
});
```

---

## 🗄️ Database & Storage Technology

### Primary Database

**PostgreSQL 15 with Advanced Features**

- **Version**: PostgreSQL 15+ with latest patches
- **Extensions**: PostGIS for geospatial data, pg_cron for scheduling
- **ORM**: Prisma 5.0+ with type-safe database access
- **Connection Pooling**: PgBouncer for connection management
- **Backup Strategy**: Continuous archiving with point-in-time recovery

```sql
-- Database configuration optimizations
-- postgresql.conf settings for production
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
```

### Prisma Schema Configuration

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  firstName String?  @map("first_name")
  lastName  String?  @map("last_name")
  phone     String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  bookings     Booking[]
  reviews      Review[]
  preferences  UserPreferences?

  @@map("users")
}

model Venue {
  id          String   @id @default(uuid())
  name        String
  description String?
  address     String
  latitude    Float?
  longitude   Float?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  courts   Court[]
  bookings Booking[]
  reviews  Review[]

  // Indexes for performance
  @@index([latitude, longitude])
  @@map("venues")
}

model Booking {
  id          String      @id @default(uuid())
  userId      String      @map("user_id")
  venueId     String      @map("venue_id")
  courtId     String      @map("court_id")
  bookingDate DateTime    @map("booking_date")
  startTime   DateTime    @map("start_time")
  endTime     DateTime    @map("end_time")
  status      BookingStatus @default(PENDING)
  totalAmount Decimal     @map("total_amount") @db.Decimal(10, 2)
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  // Relations
  user  User  @relation(fields: [userId], references: [id])
  venue Venue @relation(fields: [venueId], references: [id])
  court Court @relation(fields: [courtId], references: [id])

  // Indexes for performance
  @@index([userId, bookingDate])
  @@index([venueId, bookingDate])
  @@index([status, bookingDate])
  @@map("bookings")
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}
```

### Caching Layer

**Redis 7 with Cluster Mode**

- **Version**: Redis 7+ with cluster configuration
- **Use Cases**: Session storage, API caching, real-time data
- **Client**: ioredis with connection pooling
- **Persistence**: RDB + AOF for data durability
- **Memory Optimization**: LRU eviction with optimized memory usage

```typescript
// Redis configuration for caching
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### File Storage

**AWS S3 with CloudFront CDN**

- **Storage**: AWS S3 with versioning and lifecycle policies
- **CDN**: CloudFront for global content delivery
- **Image Processing**: Sharp for on-the-fly image optimization
- **Security**: Signed URLs for secure file access

```typescript
// File upload service with S3
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FileUploadService {
  private s3Client: S3Client;
  private bucketName = process.env.AWS_S3_BUCKET;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const key = `${folder}/${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private',
    });

    await this.s3Client.send(command);
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}
```

---

## 💳 Payment Integration Technology

### Payment Gateways

**Multi-Gateway Payment Processing**

#### International Gateway

**Stripe Connect for Global Payments**

- **Version**: Stripe API 2023-10-16
- **Features**: Payment intents, webhooks, marketplace functionality
- **Security**: PCI DSS Level 1 compliance
- **Currencies**: PKR, USD, EUR support

```typescript
// Stripe payment service implementation
import Stripe from 'stripe';

@Injectable()
export class StripePaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'pkr'
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      capture_method: 'automatic',
      confirmation_method: 'automatic',
      metadata: {
        platform: 'padel-booking',
      },
    });
  }

  async handleWebhook(
    payload: string,
    signature: string
  ): Promise<Stripe.Event> {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      endpointSecret
    );
  }

  async createConnectedAccount(
    businessInfo: BusinessInfo
  ): Promise<Stripe.Account> {
    return this.stripe.accounts.create({
      type: 'express',
      country: 'PK',
      business_type: 'company',
      company: {
        name: businessInfo.businessName,
        address: {
          line1: businessInfo.address,
          city: businessInfo.city,
          country: 'PK',
        },
        phone: businessInfo.phone,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
  }
}
```

#### Local Pakistani Gateways

**EasyPaisa & JazzCash Integration**

- **EasyPaisa**: Direct API integration with mobile wallet
- **JazzCash**: Payment gateway for mobile payments
- **Bank Transfers**: Traditional banking integration

```typescript
// Local payment gateways service
@Injectable()
export class LocalPaymentService {
  // EasyPaisa integration
  async processEasyPaisaPayment(
    paymentData: EasyPaisaPaymentDto
  ): Promise<PaymentResult> {
    const payload = {
      amount: paymentData.amount,
      customer_mobile_number: paymentData.mobileNumber,
      merchant_id: process.env.EASYPAYSA_MERCHANT_ID,
      transaction_id: paymentData.transactionId,
      callback_url: `${process.env.API_URL}/payments/easypaysa/callback`,
    };

    const response = await fetch(process.env.EASYPAYSA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.EASYPAYSA_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    return {
      success: result.status === 'SUCCESS',
      transactionId: result.transaction_id,
      gatewayResponse: result,
    };
  }

  // JazzCash integration
  async processJazzCashPayment(
    paymentData: JazzCashPaymentDto
  ): Promise<PaymentResult> {
    const payload = {
      pp_Amount: paymentData.amount * 100, // Convert to paisa
      pp_CustomerID: paymentData.customerId,
      pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID,
      pp_Password: process.env.JAZZCASH_PASSWORD,
      pp_TxnRefNo: paymentData.transactionRef,
      pp_ReturnURL: `${process.env.API_URL}/payments/jazzcash/return`,
      pp_Language: 'EN',
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: new Date()
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0],
      pp_TxnType: 'MWALLET',
    };

    // Generate secure hash
    const hashString = this.generateJazzCashHash(payload);
    payload['pp_SecureHash'] = hashString;

    const response = await fetch(process.env.JAZZCASH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(payload).toString(),
    });

    const result = await response.text();
    const parsed = this.parseJazzCashResponse(result);

    return {
      success: parsed.pp_ResponseCode === '000',
      transactionId: parsed.pp_TxnRefNo,
      gatewayResponse: parsed,
    };
  }

  private generateJazzCashHash(data: any): string {
    const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT;
    const sortedKeys = Object.keys(data).sort();
    const hashString =
      sortedKeys.map(key => data[key]).join('&') + '&' + integritySalt;
    return crypto
      .createHash('sha256')
      .update(hashString)
      .digest('hex')
      .toUpperCase();
  }
}
```

---

## 📱 Communication & Notification Technology

### Multi-Channel Notification System

**Comprehensive Communication Infrastructure**

#### Email Service

**Amazon SES with Template Management**

- **Provider**: Amazon Simple Email Service (SES)
- **Templates**: Handlebars-based email templates
- **Analytics**: Open rates, click tracking, bounce handling
- **Compliance**: GDPR compliant unsubscribe management

```typescript
// Email service implementation
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

@Injectable()
export class EmailService {
  private sesClient: SESv2Client;

  constructor() {
    this.sesClient = new SESv2Client({
      region: process.env.AWS_SES_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async sendTemplatedEmail(emailData: TemplatedEmailData): Promise<void> {
    const template = await this.getEmailTemplate(emailData.templateName);
    const compiledHtml = Handlebars.compile(template.html)(
      emailData.templateData
    );
    const compiledText = Handlebars.compile(template.text)(
      emailData.templateData
    );

    const command = new SendEmailCommand({
      FromEmailAddress: process.env.FROM_EMAIL,
      Destination: {
        ToAddresses: [emailData.to],
      },
      Content: {
        Simple: {
          Subject: {
            Data: emailData.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: compiledHtml,
              Charset: 'UTF-8',
            },
            Text: {
              Data: compiledText,
              Charset: 'UTF-8',
            },
          },
        },
      },
      Tags: [
        {
          Name: 'template',
          Value: emailData.templateName,
        },
        {
          Name: 'category',
          Value: emailData.category,
        },
      ],
    });

    await this.sesClient.send(command);
  }

  private async getEmailTemplate(templateName: string): Promise<EmailTemplate> {
    // Load template from cache or database
    return (
      this.templateCache.get(templateName) ||
      (await this.loadTemplate(templateName))
    );
  }
}
```

#### SMS Service

**Multi-Provider SMS Gateway**

- **Primary**: Twilio for international SMS
- **Local**: Pakistani SMS providers for local numbers
- **Features**: Delivery reports, two-way messaging, shortcodes

```typescript
// SMS service with multiple providers
@Injectable()
export class SmsService {
  private twilioClient: Twilio;
  private localSmsProvider: any;

  constructor() {
    this.twilioClient = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendSms(phoneNumber: string, message: string): Promise<SmsResult> {
    try {
      // Determine provider based on phone number
      const provider = this.getProviderForNumber(phoneNumber);

      if (provider === 'twilio') {
        return this.sendViaTwilio(phoneNumber, message);
      } else {
        return this.sendViaLocalProvider(phoneNumber, message);
      }
    } catch (error) {
      this.logger.error('SMS sending failed', error);
      throw new Error('Failed to send SMS');
    }
  }

  private async sendViaTwilio(
    phoneNumber: string,
    message: string
  ): Promise<SmsResult> {
    const result = await this.twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    return {
      success: true,
      messageId: result.sid,
      provider: 'twilio',
    };
  }

  private getProviderForNumber(phoneNumber: string): string {
    // Use local provider for Pakistani numbers, Twilio for international
    return phoneNumber.startsWith('+92') ? 'local' : 'twilio';
  }
}
```

#### WhatsApp Business Integration

**WhatsApp Business API for Rich Communication**

- **Platform**: WhatsApp Business Cloud API
- **Features**: Template messages, media sharing, interactive buttons
- **Compliance**: WhatsApp business policy compliant messaging

```typescript
// WhatsApp Business API service
@Injectable()
export class WhatsAppService {
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private readonly accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  async sendTemplateMessage(
    data: WhatsAppTemplateData
  ): Promise<WhatsAppResult> {
    const payload = {
      messaging_product: 'whatsapp',
      to: data.to.replace(/^\+/, ''), // Remove + prefix
      type: 'template',
      template: {
        name: data.templateName,
        language: {
          code: data.languageCode || 'en',
        },
        components: data.components,
      },
    };

    const response = await fetch(
      `${this.baseUrl}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `WhatsApp API error: ${result.error?.message || 'Unknown error'}`
      );
    }

    return {
      success: true,
      messageId: result.messages[0].id,
      provider: 'whatsapp',
    };
  }

  async sendInteractiveMessage(
    data: WhatsAppInteractiveData
  ): Promise<WhatsAppResult> {
    const payload = {
      messaging_product: 'whatsapp',
      to: data.to.replace(/^\+/, ''),
      type: 'interactive',
      interactive: {
        type: data.interactiveType, // 'button' | 'list'
        header: data.header,
        body: {
          text: data.bodyText,
        },
        footer: data.footer,
        action: data.action,
      },
    };

    const response = await fetch(
      `${this.baseUrl}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    return {
      success: response.ok,
      messageId: result.messages?.[0]?.id,
      provider: 'whatsapp',
    };
  }
}
```

### Real-Time Communication

**WebSocket with Socket.io for Live Updates**

- **Framework**: Socket.io 4.7+ with Redis adapter
- **Features**: Real-time booking updates, live chat, notifications
- **Scaling**: Redis adapter for multi-instance deployments

```typescript
// WebSocket gateway for real-time updates
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  adapter: createAdapter(redisClient, redisClient.duplicate()),
})
export class BookingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const user = await this.authService.validateWebSocketToken(token);

      this.connectedUsers.set(client.id, user.id);
      client.join(`user:${user.id}`);

      this.logger.log(`User ${user.id} connected via WebSocket`);
    } catch (error) {
      this.logger.error('WebSocket authentication failed', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      this.logger.log(`User ${userId} disconnected from WebSocket`);
    }
  }

  @SubscribeMessage('join-venue')
  handleJoinVenue(client: Socket, venueId: string) {
    client.join(`venue:${venueId}`);
    client.emit('joined-venue', venueId);
  }

  // Emit real-time booking updates
  emitBookingUpdate(booking: Booking) {
    this.server.to(`venue:${booking.venueId}`).emit('booking-update', {
      type: 'booking_created',
      booking: booking,
    });

    this.server.to(`user:${booking.userId}`).emit('booking-notification', {
      type: 'booking_confirmed',
      booking: booking,
    });
  }

  // Emit availability updates
  emitAvailabilityUpdate(courtId: string, availability: AvailabilityUpdate) {
    this.server.emit('availability-update', {
      courtId,
      availability,
    });
  }
}
```

---

## 🔍 Search & Analytics Technology

### Search Engine

**Elasticsearch 8 for Advanced Search**

- **Version**: Elasticsearch 8.10+ with Kibana dashboard
- **Features**: Full-text search, geospatial queries, aggregations
- **Performance**: Sub-100ms search response times
- **Scaling**: Multi-node cluster with automatic sharding

```typescript
// Elasticsearch search service
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class SearchService {
  private esClient: Client;

  constructor() {
    this.esClient = new Client({
      node: process.env.ELASTICSEARCH_URL,
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async indexVenue(venue: Venue): Promise<void> {
    await this.esClient.index({
      index: 'venues',
      id: venue.id,
      body: {
        name: venue.name,
        description: venue.description,
        location: {
          lat: venue.latitude,
          lon: venue.longitude,
        },
        address: venue.address,
        city: venue.city,
        amenities: venue.amenities,
        rating: venue.rating,
        priceRange: venue.priceRange,
        courts: venue.courts.map(court => ({
          id: court.id,
          name: court.name,
          type: court.type,
          surface: court.surface,
          indoor: court.isIndoor,
          basePrice: court.basePrice,
        })),
        createdAt: venue.createdAt,
        updatedAt: venue.updatedAt,
      },
    });
  }

  async searchVenues(query: VenueSearchQuery): Promise<VenueSearchResult> {
    const searchBody: any = {
      query: {
        bool: {
          must: [],
          filter: [],
        },
      },
      sort: [],
      size: query.limit || 20,
      from: query.offset || 0,
    };

    // Full-text search
    if (query.searchText) {
      searchBody.query.bool.must.push({
        multi_match: {
          query: query.searchText,
          fields: ['name^3', 'description^2', 'address', 'amenities'],
          fuzziness: 'AUTO',
        },
      });
    }

    // Geospatial search
    if (query.latitude && query.longitude) {
      searchBody.query.bool.filter.push({
        geo_distance: {
          distance: `${query.radius || 10}km`,
          location: {
            lat: query.latitude,
            lon: query.longitude,
          },
        },
      });

      // Add distance sorting
      searchBody.sort.push({
        _geo_distance: {
          location: {
            lat: query.latitude,
            lon: query.longitude,
          },
          order: 'asc',
          unit: 'km',
        },
      });
    }

    // Price range filter
    if (query.minPrice || query.maxPrice) {
      const priceFilter: any = {};
      if (query.minPrice) priceFilter.gte = query.minPrice;
      if (query.maxPrice) priceFilter.lte = query.maxPrice;

      searchBody.query.bool.filter.push({
        nested: {
          path: 'courts',
          query: {
            range: {
              'courts.basePrice': priceFilter,
            },
          },
        },
      });
    }

    // Amenities filter
    if (query.amenities && query.amenities.length > 0) {
      searchBody.query.bool.filter.push({
        terms: {
          amenities: query.amenities,
        },
      });
    }

    // Add aggregations for faceted search
    searchBody.aggs = {
      price_ranges: {
        range: {
          field: 'courts.basePrice',
          ranges: [
            { key: 'budget', to: 1000 },
            { key: 'mid-range', from: 1000, to: 2000 },
            { key: 'premium', from: 2000 },
          ],
        },
      },
      amenities: {
        terms: {
          field: 'amenities',
          size: 20,
        },
      },
      cities: {
        terms: {
          field: 'city.keyword',
          size: 10,
        },
      },
    };

    const response = await this.esClient.search({
      index: 'venues',
      body: searchBody,
    });

    return {
      venues: response.body.hits.hits.map(hit => ({
        ...hit._source,
        distance: hit.sort?.[0], // Distance from search location
      })),
      total: response.body.hits.total.value,
      aggregations: response.body.aggregations,
      took: response.body.took,
    };
  }
}
```

### Analytics & Business Intelligence

**ClickHouse + Apache Superset for Analytics**

- **Data Warehouse**: ClickHouse for high-performance analytics
- **Visualization**: Apache Superset for business intelligence dashboards
- **Real-time Processing**: Apache Kafka for event streaming
- **ETL Pipeline**: Apache Airflow for data orchestration

```typescript
// Analytics service with ClickHouse
import { ClickHouse } from 'clickhouse';

@Injectable()
export class AnalyticsService {
  private clickhouse: ClickHouse;

  constructor() {
    this.clickhouse = new ClickHouse({
      url: process.env.CLICKHOUSE_URL,
      port: parseInt(process.env.CLICKHOUSE_PORT || '8123'),
      debug: process.env.NODE_ENV === 'development',
      basicAuth: {
        username: process.env.CLICKHOUSE_USER,
        password: process.env.CLICKHOUSE_PASSWORD,
      },
      isUseGzip: true,
      format: 'json',
      config: {
        session_timeout: 60,
        output_format_json_quote_64bit_integers: 0,
        enable_http_compression: 1,
      },
    });
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    const eventData = {
      timestamp: new Date(),
      event_type: event.type,
      user_id: event.userId || '',
      session_id: event.sessionId || '',
      venue_id: event.venueId || '',
      booking_id: event.bookingId || '',
      properties: JSON.stringify(event.properties || {}),
      ip_address: event.ipAddress || '',
      user_agent: event.userAgent || '',
    };

    await this.clickhouse.insert('INSERT INTO events', [eventData]);
  }

  async getBookingAnalytics(
    filters: AnalyticsFilters
  ): Promise<BookingAnalytics> {
    const query = `
      SELECT 
        toStartOfDay(timestamp) as date,
        COUNT(*) as total_bookings,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(if(event_type = 'booking_completed', 1, 0)) as completed_bookings,
        SUM(if(event_type = 'booking_cancelled', 1, 0)) as cancelled_bookings,
        AVG(JSONExtractFloat(properties, 'booking_amount')) as avg_booking_amount
      FROM events 
      WHERE timestamp >= {start_date:DateTime}
        AND timestamp <= {end_date:DateTime}
        AND event_type IN ('booking_created', 'booking_completed', 'booking_cancelled')
        ${filters.venueId ? 'AND venue_id = {venue_id:String}' : ''}
      GROUP BY date
      ORDER BY date DESC
    `;

    const params = {
      start_date: filters.startDate,
      end_date: filters.endDate,
      ...(filters.venueId && { venue_id: filters.venueId }),
    };

    const result = await this.clickhouse.query(query, params);
    return result.data;
  }

  async getUserBehaviorAnalytics(userId: string): Promise<UserAnalytics> {
    const query = `
      SELECT 
        event_type,
        COUNT(*) as event_count,
        MIN(timestamp) as first_occurrence,
        MAX(timestamp) as last_occurrence,
        uniqArray(session_id) as unique_sessions
      FROM events 
      WHERE user_id = {user_id:String}
        AND timestamp >= now() - INTERVAL 30 DAY
      GROUP BY event_type
      ORDER BY event_count DESC
    `;

    const result = await this.clickhouse.query(query, { user_id: userId });
    return result.data;
  }
}
```

---

## 🔒 Security Technology Stack

### Authentication & Authorization

**JWT with OAuth 2.0 and RBAC**

- **JWT Library**: @nestjs/jwt with RSA256 signing
- **OAuth Providers**: Google, Facebook, Apple Sign-In
- **RBAC**: Role-based access control with fine-grained permissions
- **Session Management**: Redis-based session storage with refresh tokens

```typescript
// JWT authentication service
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private redisService: RedisService
  ) {}

  async generateTokens(user: User): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      algorithm: 'RS256',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d', algorithm: 'RS256' }
    );

    // Store refresh token in Redis
    await this.redisService.setex(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60, // 7 days
      refreshToken
    );

    return { accessToken, refreshToken };
  }

  async validateToken(token: string): Promise<User> {
    try {
      const payload = this.jwtService.verify(token, {
        algorithms: ['RS256'],
      });

      const user = await this.userService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        algorithms: ['RS256'],
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify token exists in Redis
      const storedToken = await this.redisService.get(
        `refresh_token:${payload.sub}`
      );
      if (storedToken !== refreshToken) {
        throw new UnauthorizedException('Refresh token not found or expired');
      }

      const user = await this.userService.findById(payload.sub);
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
```

### Data Encryption & Security

**AES-256 Encryption with Key Management**

- **Encryption**: AES-256-GCM for data at rest
- **Key Management**: AWS KMS for encryption key management
- **TLS**: TLS 1.3 for data in transit
- **Hashing**: Argon2 for password hashing

```typescript
// Encryption service with AWS KMS
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';

@Injectable()
export class EncryptionService {
  private kmsClient: KMSClient;
  private keyId = process.env.AWS_KMS_KEY_ID;

  constructor() {
    this.kmsClient = new KMSClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async encryptSensitiveData(plaintext: string): Promise<string> {
    const command = new EncryptCommand({
      KeyId: this.keyId,
      Plaintext: Buffer.from(plaintext, 'utf8'),
    });

    const response = await this.kmsClient.send(command);
    return Buffer.from(response.CiphertextBlob).toString('base64');
  }

  async decryptSensitiveData(ciphertext: string): Promise<string> {
    const command = new DecryptCommand({
      CiphertextBlob: Buffer.from(ciphertext, 'base64'),
    });

    const response = await this.kmsClient.send(command);
    return Buffer.from(response.Plaintext).toString('utf8');
  }

  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(32);
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
      salt,
    });
    return hash;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }
}
```

---

## 🚀 DevOps & Infrastructure Technology

### Containerization & Orchestration

**Docker + Kubernetes for Container Orchestration**

- **Container Runtime**: Docker 24+ with multi-stage builds
- **Orchestration**: Kubernetes 1.28+ with Helm charts
- **Service Mesh**: Istio for traffic management and security
- **Ingress**: NGINX Ingress Controller with cert-manager

```dockerfile
# Multi-stage Dockerfile for Node.js microservice
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

USER nestjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

### CI/CD Pipeline

**GitHub Actions with Multi-Environment Deployment**

- **CI/CD**: GitHub Actions with reusable workflows
- **Testing**: Automated testing with coverage reports
- **Security**: Vulnerability scanning with Snyk and CodeQL
- **Deployment**: Blue-green deployment with rollback capabilities

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  security:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: typescript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

  build-and-deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to staging
        uses: azure/k8s-deploy@v1
        with:
          manifests: |
            k8s/staging/deployment.yaml
            k8s/staging/service.yaml
            k8s/staging/ingress.yaml
          images: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          kubectl-version: '1.28'

      - name: Run smoke tests
        run: |
          npm run test:smoke
        env:
          API_URL: https://staging-api.padelplatform.pk

      - name: Deploy to production
        if: success()
        uses: azure/k8s-deploy@v1
        with:
          manifests: |
            k8s/production/deployment.yaml
            k8s/production/service.yaml
            k8s/production/ingress.yaml
          images: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          kubectl-version: '1.28'
```

### Monitoring & Observability

**Prometheus + Grafana + Jaeger Stack**

- **Metrics**: Prometheus for metrics collection and alerting
- **Visualization**: Grafana dashboards for monitoring
- **Tracing**: Jaeger for distributed tracing
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana) for centralized logging

```typescript
// Prometheus metrics configuration
import {
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';

export const metricsProviders = [
  makeCounterProvider({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  }),
  makeHistogramProvider({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  }),
  makeGaugeProvider({
    name: 'active_connections',
    help: 'Number of active connections',
    labelNames: ['type'],
  }),
  makeCounterProvider({
    name: 'booking_events_total',
    help: 'Total number of booking events',
    labelNames: ['event_type', 'venue_id'],
  }),
  makeGaugeProvider({
    name: 'revenue_total',
    help: 'Total revenue in PKR',
    labelNames: ['period'],
  }),
];
```

---

_This comprehensive technology stack provides the foundation for building a scalable, secure, and maintainable padel booking platform that can handle high traffic, complex business logic, and rapid feature development while maintaining excellent performance and user experience._
