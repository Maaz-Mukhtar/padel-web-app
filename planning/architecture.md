# System Architecture - Microservices Design

## 🏗️ Architecture Overview

### Design Philosophy

The padel booking platform employs a **microservices architecture** with **event-driven communication** patterns, designed for scalability, maintainability, and fault tolerance. The system follows **Domain-Driven Design (DDD)** principles with clear service boundaries and autonomous teams.

### Architecture Principles

1. **Single Responsibility**: Each microservice handles one business domain
2. **Autonomy**: Services are independently deployable and scalable
3. **Resilience**: Built-in fault tolerance and circuit breaker patterns
4. **Event-Driven**: Asynchronous communication for loose coupling
5. **API-First**: Contract-driven development with OpenAPI specifications
6. **Security by Design**: Zero-trust security model with service mesh

## 🏛️ High-Level System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
│              (Kong/Ambassador)                          │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
┌───────▼─┐  ┌────▼────┐  ┌─▼──────┐
│Frontend │  │Mobile   │  │Admin   │
│(Next.js)│  │Apps     │  │Portal  │
└─────────┘  └─────────┘  └────────┘
                  │
        ┌─────────┼─────────┐
        │    Service Mesh   │
        │    (Istio)        │
        └─────────┼─────────┘
                  │
    ┌─────────────┼─────────────┐
    │        Microservices      │
    └─────────────┼─────────────┘
                  │
┌─────────────────┼─────────────────┐
│        Event Bus (Apache Kafka)   │
└─────────────────┼─────────────────┘
                  │
┌─────────────────┼─────────────────┐
│         Data Layer               │
│   PostgreSQL + Redis + S3        │
└───────────────────────────────────┘
```

## 🎯 Core Microservices (Phase 1 - MVP)

### 1. Authentication Service

**Responsibility**: User authentication, authorization, and session management

#### Core Features

- User registration and login
- OAuth 2.0 integration (Google, Facebook)
- JWT token generation and validation
- Password reset and recovery
- Session management
- Role-based access control (RBAC)

#### Technical Specifications

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL (Auth tables)
- **Cache**: Redis for session and token management
- **Authentication**: JWT + OAuth 2.0
- **API**: RESTful endpoints
- **Port**: 3001

#### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    skill_level VARCHAR(20),
    profile_picture_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    notification_email BOOLEAN DEFAULT TRUE,
    notification_sms BOOLEAN DEFAULT TRUE,
    notification_whatsapp BOOLEAN DEFAULT FALSE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints

```typescript
// GraphQL Schema
type User {
  id: ID!
  email: String!
  firstName: String
  lastName: String
  phone: String
  skillLevel: SkillLevel
  profilePictureUrl: String
  isVerified: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

// REST API Endpoints
@Post('/auth/register')
@Post('/auth/login')
@Post('/auth/logout')
@Post('/auth/refresh')
@Post('/auth/forgot-password')
@Post('/auth/reset-password')
@Post('/auth/verify-email')
```

### 2. User Service

**Responsibility**: User profile management, preferences, and social features

#### Core Features

- User profile management
- Player skill level tracking
- User preferences and settings
- Friend connections and groups
- Booking history and statistics

#### Technical Specifications

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL (User profiles)
- **Storage**: AWS S3 for profile pictures
- **Cache**: Redis for user data caching
- **Port**: 3002

#### Database Schema

```sql
-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    bio TEXT,
    skill_level VARCHAR(20),
    play_frequency VARCHAR(20),
    preferred_play_time VARCHAR(20),
    achievements JSONB,
    stats JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User connections
CREATE TABLE user_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    connected_user_id UUID REFERENCES users(id),
    connection_type VARCHAR(20) DEFAULT 'friend',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Booking Service

**Responsibility**: Core booking functionality, availability checking, and reservation management

#### Core Features

- Court availability checking
- Booking creation and confirmation
- Basic cancellation handling
- Booking status management
- Simple calendar integration

#### Technical Specifications

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL (Booking tables)
- **Cache**: Redis for availability caching
- **Queue**: Redis Bull for async processing
- **Port**: 3003

#### Database Schema

```sql
-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    venue_id UUID REFERENCES venues(id),
    court_id UUID REFERENCES courts(id),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_amount DECIMAL(10, 2),
    commission_amount DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending',
    booking_type VARCHAR(20) DEFAULT 'single',
    group_size INTEGER DEFAULT 1,
    special_requests TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Booking participants (for group bookings)
CREATE TABLE booking_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id),
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'invited',
    joined_at TIMESTAMP
);

-- Availability slots (for performance optimization)
CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id UUID REFERENCES courts(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    price DECIMAL(10, 2),
    UNIQUE(court_id, date, start_time)
);
```

#### Booking State Machine

```typescript
enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

// Booking workflow
const bookingStateMachine = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled', 'no_show'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
  no_show: [],
};
```

### 4. Notification Service

**Responsibility**: Multi-channel notification delivery and communication management

#### Core Features

- Email notifications (booking confirmations, reminders)
- SMS notifications for urgent updates
- WhatsApp Business API integration
- Push notifications preparation
- Notification templates and personalization

#### Technical Specifications

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL (Notification logs)
- **Queue**: Redis Bull for async delivery
- **Email**: SendGrid/AWS SES
- **SMS**: Twilio API
- **WhatsApp**: WhatsApp Business API
- **Port**: 3004

#### Database Schema

```sql
-- Notification logs
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- email, sms, whatsapp
    template VARCHAR(100),
    recipient VARCHAR(255),
    subject TEXT,
    content TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    booking_confirmation BOOLEAN DEFAULT TRUE,
    booking_reminder BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    whatsapp_notifications BOOLEAN DEFAULT FALSE
);
```

## 🚀 Extended Microservices (Phase 2-4)

### 5. Venue Management Service

**Features**: Venue registration, court management, availability configuration
**Technology**: NestJS, PostgreSQL with PostGIS, Elasticsearch

### 6. Payment Processing Service

**Features**: Payment gateway integration, transaction processing, refunds
**Technology**: NestJS, PostgreSQL, Stripe/EasyPaisa/JazzCash APIs

### 7. Tournament Management Service

**Features**: Tournament creation, bracket management, scoring
**Technology**: NestJS, PostgreSQL, Real-time updates

### 8. Social Features Service

**Features**: Friend connections, groups, social booking
**Technology**: NestJS, Graph database (Neo4j)

### 9. Analytics & Reporting Service

**Features**: Business intelligence, usage analytics, reporting
**Technology**: Apache Spark, ClickHouse, Grafana

### 10. Review & Rating Service

**Features**: Venue/player reviews, rating aggregation
**Technology**: NestJS, PostgreSQL, Sentiment analysis

### 11. Content Management Service

**Features**: CMS for marketing content, blog posts
**Technology**: Strapi/Custom CMS, S3 storage

## 🔄 Event-Driven Architecture

### Event Bus (Apache Kafka)

**Topics**:

- `user.events` - User registration, profile updates
- `booking.events` - Booking lifecycle events
- `payment.events` - Payment processing events
- `notification.events` - Notification triggers
- `venue.events` - Venue updates and availability

### Event Examples

```typescript
// User registration event
interface UserRegisteredEvent {
  eventType: 'USER_REGISTERED';
  userId: string;
  email: string;
  timestamp: string;
  metadata: {
    source: string;
    userAgent: string;
  };
}

// Booking confirmed event
interface BookingConfirmedEvent {
  eventType: 'BOOKING_CONFIRMED';
  bookingId: string;
  userId: string;
  venueId: string;
  courtId: string;
  amount: number;
  timestamp: string;
}
```

### SAGA Pattern Implementation

For complex workflows spanning multiple services:

```typescript
// Booking creation SAGA
class BookingCreationSaga {
  async execute(command: CreateBookingCommand) {
    try {
      // Step 1: Reserve time slot
      await this.venueService.reserveSlot(command.slotDetails);

      // Step 2: Process payment
      const payment = await this.paymentService.processPayment(
        command.paymentDetails
      );

      // Step 3: Confirm booking
      const booking = await this.bookingService.confirmBooking(
        command.bookingDetails
      );

      // Step 4: Send notifications
      await this.notificationService.sendConfirmation(booking);

      return booking;
    } catch (error) {
      // Compensating transactions
      await this.compensate(command, error);
      throw error;
    }
  }
}
```

## 🔒 Security Architecture

### Authentication & Authorization

- **JWT Tokens**: Short-lived access tokens (15 minutes)
- **Refresh Tokens**: Long-lived refresh tokens (7 days)
- **Service-to-Service**: mTLS with service mesh
- **API Gateway**: Rate limiting and request validation

### Data Security

- **Encryption at Rest**: AES-256 for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **PII Protection**: Data masking and tokenization
- **Audit Logging**: Comprehensive security event logging

### Network Security

```yaml
# Security policies with Istio
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT

apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: payment-service-policy
spec:
  selector:
    matchLabels:
      app: payment-service
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/booking-service"]
  - to:
    - operation:
        methods: ["POST"]
        paths: ["/api/payments/*"]
```

## 📊 Data Architecture

### Database Strategy

- **PostgreSQL**: Primary transactional database
- **Redis**: Caching and session storage
- **Elasticsearch**: Search and analytics
- **S3**: Object storage for media files

### Data Flow

```
User Request → API Gateway → Service → Database
     ↓
Event Bus ← Service Response ← Cache Check
     ↓
Other Services (Async Processing)
```

### Backup & Recovery

- **RTO**: 4 hours maximum recovery time
- **RPO**: 1 hour maximum data loss
- **Backup Strategy**: Daily full backups, hourly incremental
- **Multi-Region**: Primary-secondary database replication

## 🌍 Deployment Architecture

### Kubernetes Infrastructure

```yaml
# Production namespace configuration
apiVersion: v1
kind: Namespace
metadata:
  name: padel-production
  labels:
    environment: production
    istio-injection: enabled

---
# Microservice deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: padel-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
        version: v1
    spec:
      containers:
        - name: user-service
          image: padel/user-service:v1.0.0
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: database-secrets
                  key: user-service-db-url
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
```

### Auto-scaling Configuration

```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

## 📈 Performance & Scalability

### Performance Targets

- **API Response Time**: <200ms for 95th percentile
- **Database Query Time**: <50ms for 99th percentile
- **Page Load Time**: <2 seconds for complete page load
- **Concurrent Users**: 10,000+ simultaneous users

### Caching Strategy

```typescript
// Multi-level caching
class VenueService {
  async getVenue(venueId: string): Promise<Venue> {
    // L1: Application cache
    const cached = this.appCache.get(`venue:${venueId}`);
    if (cached) return cached;

    // L2: Redis cache
    const redisCached = await this.redis.get(`venue:${venueId}`);
    if (redisCached) {
      const venue = JSON.parse(redisCached);
      this.appCache.set(`venue:${venueId}`, venue, 300); // 5 min
      return venue;
    }

    // L3: Database
    const venue = await this.venueRepository.findById(venueId);
    await this.redis.setex(`venue:${venueId}`, 3600, JSON.stringify(venue)); // 1 hour
    this.appCache.set(`venue:${venueId}`, venue, 300);

    return venue;
  }
}
```

## 🔍 Monitoring & Observability

### Metrics Collection

- **Application Metrics**: Custom business metrics
- **Infrastructure Metrics**: CPU, memory, network, disk
- **Database Metrics**: Query performance, connection pools
- **User Experience**: Real user monitoring (RUM)

### Distributed Tracing

```typescript
// OpenTelemetry implementation
import { trace, context } from '@opentelemetry/api';

class BookingService {
  async createBooking(bookingData: CreateBookingData) {
    const span = trace.getActiveSpan();
    span?.setAttributes({
      'booking.venue_id': bookingData.venueId,
      'booking.user_id': bookingData.userId,
      'booking.amount': bookingData.amount,
    });

    try {
      const booking = await this.processBooking(bookingData);
      span?.setStatus({ code: SpanStatusCode.OK });
      return booking;
    } catch (error) {
      span?.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    }
  }
}
```

### Health Checks

```typescript
// Kubernetes health check endpoints
@Get('/health')
async healthCheck(): Promise<HealthCheckResult> {
  const dbHealth = await this.checkDatabase();
  const redisHealth = await this.checkRedis();
  const externalApiHealth = await this.checkExternalApis();

  return {
    status: dbHealth && redisHealth && externalApiHealth ? 'healthy' : 'unhealthy',
    checks: {
      database: dbHealth,
      redis: redisHealth,
      externalApis: externalApiHealth
    },
    timestamp: new Date().toISOString()
  };
}
```

---

_This architecture document provides the technical foundation for building a scalable, maintainable, and secure padel booking platform using modern microservices patterns and cloud-native technologies._
