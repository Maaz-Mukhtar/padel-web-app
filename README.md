# 🏸 Padel Platform

A comprehensive microservices-based solution for sports facility booking and management.

## 🎯 Project Overview

The Padel Platform is a digital ecosystem for sports facility booking, connecting players with venues. The platform provides real-time booking capabilities, user management, and venue administration tools.

### 🚀 Planned Features

- **Real-time Court Booking** - Availability checking and reservations (Week 3)
- **User Management** - Registration, profiles, and authentication (Week 2)
- **Payment Processing** - Secure payment integration (Week 4)
- **Social Features** - Group coordination and invitations (Week 6)
- **Tournament Management** - Tournament organization tools (Week 9)
- **Venue Analytics** - Business intelligence dashboard (Week 10)
- **Mobile Application** - Native mobile apps (Week 7)

## 🏗️ Architecture

### Microservices Architecture

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Auth Service   │  │  User Service   │  │ Booking Service │  │Notification Svc │
│    Port 3001    │  │    Port 3002    │  │    Port 3003    │  │    Port 3004    │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
         │                      │                      │                      │
         └──────────────────────┼──────────────────────┼──────────────────────┘
                                │                      │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   PostgreSQL    │    │      Redis      │
                    │   Database      │    │     Cache       │
                    └─────────────────┘    └─────────────────┘
```

### Tech Stack

**Backend Services:**

- **NestJS 10** - Enterprise-grade Node.js framework
- **PostgreSQL 15** - Primary database with PostGIS for location data
- **Redis 7** - Caching and session management
- **Elasticsearch 8** - Search and analytics
- **Prisma 5** - Database ORM and migrations

**Frontend:**

- **Next.js 14** - React framework with app router
- **TypeScript** - Type safety across the stack
- **Tailwind CSS** - Utility-first styling
- **React Query** - State management and caching

**Infrastructure:**

- **Docker** - Containerization
- **Kubernetes** - Orchestration
- **Nginx** - Reverse proxy and load balancing
- **GitHub Actions** - CI/CD pipeline

## 🚦 Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js 20+**
- **npm 10+**
- **Docker & Docker Compose**
- **Git**

### Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/Maaz-Mukhtar/padel-web-app.git
cd padel-web-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment**

```bash
cp .env.example .env.development
# Edit .env.development with your configuration
```

4. **Start infrastructure services**

```bash
npm run docker:dev
```

5. **Start all microservices**

```bash
npm run dev
```

6. **Access the application**

- **Frontend**: http://localhost:3000
- **Auth Service**: http://localhost:3001/api/docs
- **User Service**: http://localhost:3002/api/docs
- **Booking Service**: http://localhost:3003/api/docs
- **Notification Service**: http://localhost:3004/api/docs
- **Database Admin**: http://localhost:5050 (admin@padelplatform.pk / admin123)
- **Redis Admin**: http://localhost:8081

## 📁 Project Structure

```
padel-platform/
├── services/                 # Microservices
│   ├── auth/                # Authentication & authorization
│   ├── user/                # User profile management
│   ├── booking/             # Court booking system
│   └── notification/        # Multi-channel notifications
├── frontend/                # Frontend applications
│   ├── web/                 # Next.js web application
│   └── mobile/              # React Native app (future)
├── shared/                  # Shared utilities and types
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Common utilities
│   └── constants/           # Application constants
├── infrastructure/          # Infrastructure as code
│   ├── docker/              # Docker configurations
│   ├── kubernetes/          # K8s manifests
│   └── terraform/           # Cloud infrastructure
├── docs/                    # Operational documentation
│   ├── DEPLOYMENT.md        # Deployment procedures
│   ├── MONITORING.md        # Monitoring setup
│   ├── TESTING.md          # Testing strategies
│   └── PERFORMANCE_BASELINE.md # Performance benchmarks
├── planning/                # Project planning & design documents
│   ├── pdfs/               # Project planning PDFs
│   ├── architecture.md     # System architecture details
│   ├── development-phases.md # Development timeline
│   ├── implementation-plan.md # Implementation roadmap
│   ├── technology-stack.md # Technology decisions
│   └── market-research.md  # Market analysis
├── testing/                 # Testing documentation
│   └── WEEK_1_TESTING_GUIDE.md # Week 1 testing procedures
├── progress-reports/        # Weekly progress reports
│   └── week-1-implementation-report.md # Week 1 comprehensive report
├── scripts/                 # Build and deployment scripts
└── tests/                   # Integration and E2E tests
```

## 🎯 Development Phases

The project follows a **vertical slicing methodology** across 14 weeks:

### Phase 1: Foundation (Weeks 1-4)

- ✅ **Week 1**: Project setup and infrastructure
- 🔄 **Week 2**: Authentication and user profiles
- ⏳ **Week 3**: Core booking system
- ⏳ **Week 4**: Payment integration

### Phase 2: Enhancement (Weeks 5-8)

- ⏳ Local payment gateways (EasyPaisa, JazzCash)
- ⏳ Social features and group booking
- ⏳ Notification system
- ⏳ Mobile optimization

### Phase 3: Scale (Weeks 9-12)

- ⏳ Tournament management
- ⏳ Advanced search and analytics
- ⏳ Performance optimization
- ⏳ Security hardening

### Phase 4: Launch (Weeks 13-14)

- ⏳ Production deployment
- ⏳ Go-to-market execution

## 🛠️ Available Scripts

### Root Level

```bash
npm run dev              # Start all services in development
npm run build            # Build all services and frontend
npm run test             # Run all tests
npm run lint             # Lint all code
npm run format           # Format all code
npm run docker:dev       # Start infrastructure services
npm run db:migrate       # Run database migrations
```

### Service Level

```bash
# From any service directory (services/auth, services/user, etc.)
npm run dev              # Start service in watch mode
npm run build            # Build service
npm run test             # Run service tests
npm run db:migrate       # Run service database migrations
```

## 🚀 Deployment

### Development Environment

```bash
npm run docker:dev       # Start with Docker Compose
npm run dev              # Start all services
```

### Production Deployment

```bash
# Using Kubernetes
kubectl apply -f infrastructure/kubernetes/production/
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📋 API Documentation

Each service provides interactive API documentation via Swagger:

- **Auth Service**: http://localhost:3001/api/docs
- **User Service**: http://localhost:3002/api/docs
- **Booking Service**: http://localhost:3003/api/docs
- **Notification Service**: http://localhost:3004/api/docs

## 🔒 Security

- **JWT-based authentication** with refresh token rotation
- **Role-based access control** (RBAC)
- **Input validation and sanitization**
- **Rate limiting** and DDoS protection
- **GDPR compliance** for data protection

## 📊 Monitoring & Analytics

- **Application Performance Monitoring** (APM)
- **Error tracking** with Sentry
- **Health monitoring** and service metrics

## 📞 Support

- **Documentation**: [docs/](docs/)
- **API Issues**: Create an issue with `api` label
- **Feature Requests**: Create an issue with `enhancement` label
- **Security Issues**: Create an issue with `security` label

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
