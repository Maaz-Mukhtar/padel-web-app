# Testing Guide - Padel Platform

This guide covers the comprehensive testing strategy for the Padel Platform microservices architecture.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

The Padel Platform uses a comprehensive testing strategy with multiple layers:

- **Unit Tests**: Individual component testing
- **Integration Tests**: Service-to-service communication
- **End-to-End Tests**: Complete user workflows
- **Performance Tests**: Load and stress testing

### Test Stack

- **Jest**: Primary testing framework
- **Supertest**: HTTP endpoint testing
- **TypeORM**: Database testing utilities
- **Docker**: Test environment isolation

## Test Structure

```
├── test/                          # Global test utilities
│   ├── setup.ts                   # Global test configuration
│   └── integration/               # Cross-service integration tests
├── services/
│   ├── auth/
│   │   ├── src/**/*.spec.ts      # Unit tests
│   │   ├── test/                 # Service-specific test utilities
│   │   └── jest.config.js        # Jest configuration
│   ├── user/
│   │   ├── src/**/*.spec.ts      # Unit tests
│   │   └── test/
│   └── ...
└── shared/
    └── utils/**/*.spec.ts         # Shared utility tests
```

## Running Tests

### All Tests

```bash
# Run all tests across all services
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Service-Specific Tests

```bash
# Auth service tests
cd services/auth && npm test

# User service tests
cd services/user && npm test

# API Gateway tests
cd services/api-gateway && npm test
```

### Test Types

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e
```

### CI/CD Tests

```bash
# Run tests in CI environment
npm run test:ci

# Debug mode for troubleshooting
npm run test:debug
```

## Test Types

### Unit Tests

Unit tests focus on individual components, services, and utilities.

**Location**: `src/**/*.spec.ts` in each service

**Naming Convention**: `{component}.spec.ts`

**Example**:

```typescript
// services/auth/src/modules/auth/auth.service.spec.ts
describe('AuthService', () => {
  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests

Integration tests verify service-to-service communication and database interactions.

**Location**: `test/integration/`

**Example**:

```typescript
// test/integration/auth-service.integration.ts
describe('Auth Service Integration', () => {
  it('should register and login user end-to-end', async () => {
    // Full registration and login flow
  });
});
```

### End-to-End Tests

E2E tests simulate complete user journeys through the API Gateway.

**Example Flows**:

- User registration → Email verification → Profile creation
- Login → Book venue → Receive notification
- Admin panel → Venue management → Booking approval

### Performance Tests

Performance tests establish baselines and identify bottlenecks.

**Metrics Tracked**:

- Response time (< 200ms for most endpoints)
- Throughput (1000+ requests/second)
- Error rate (< 0.1%)
- Resource usage (CPU, Memory)

## Coverage Requirements

### Global Requirements

- **Minimum Coverage**: 80% across all metrics
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Service-Specific Requirements

| Service              | Unit Tests | Integration Tests  | E2E Coverage       |
| -------------------- | ---------- | ------------------ | ------------------ |
| Auth Service         | 90%+       | Critical paths     | Login flow         |
| User Service         | 85%+       | Profile operations | Profile management |
| Booking Service      | 85%+       | Booking flows      | Complete booking   |
| Notification Service | 80%+       | Message delivery   | Notifications      |
| API Gateway          | 80%+       | Routing            | All endpoints      |

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html

# Coverage summary
npm run test:coverage -- --coverageReporters=text-summary
```

## Test Environment Setup

### Database Setup

Tests use isolated test databases to ensure consistency:

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d postgres-test

# Run migrations
npm run db:migrate:test

# Seed test data
npm run db:seed:test
```

### Environment Variables

Test environment uses `.env.test`:

```bash
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=padel_platform_test
DB_USERNAME=test_user
DB_PASSWORD=test_password
JWT_SECRET=test_jwt_secret
LOG_LEVEL=error
```

### Mock Services

Integration tests use mock external services:

- **Email Service**: Mock SMTP server
- **SMS Service**: Mock SMS provider
- **Payment Gateway**: Mock payment processor

## Test Data Management

### Test Fixtures

```typescript
// test/fixtures/users.ts
export const testUsers = {
  player: {
    email: 'player@test.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'Player',
    role: 'player',
  },
  venueOwner: {
    email: 'owner@test.com',
    password: 'TestPass123!',
    firstName: 'Venue',
    lastName: 'Owner',
    role: 'venue_owner',
  },
};
```

### Database Cleanup

```typescript
beforeEach(async () => {
  // Clean database before each test
  await dataSource.query('DELETE FROM users');
  await dataSource.query('DELETE FROM user_profiles');
});
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:

- Pull requests
- Pushes to main/develop branches
- Scheduled daily runs

### Test Pipeline

```yaml
# .github/workflows/test.yml
name: Test Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Run linting
        run: npm run lint
      - name: Run unit tests
        run: npm run test:unit
      - name: Run integration tests
        run: npm run test:integration
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Quality Gates

Tests must pass before merging:

- All unit tests pass
- Integration tests pass
- Coverage thresholds met
- No linting errors
- No type errors

## Best Practices

### Writing Tests

1. **Descriptive Names**: Use clear, descriptive test names
2. **Single Responsibility**: One assertion per test
3. **AAA Pattern**: Arrange, Act, Assert
4. **Mock External Dependencies**: Isolate units under test
5. **Test Edge Cases**: Include error conditions and boundary values

### Test Organization

1. **Group Related Tests**: Use `describe` blocks logically
2. **Setup and Teardown**: Use `beforeEach`/`afterEach` for clean state
3. **Shared Utilities**: Extract common test helpers
4. **Test Data**: Use factories for consistent test data

### Performance

1. **Parallel Execution**: Tests run in parallel where possible
2. **Fast Feedback**: Unit tests complete in < 10 seconds
3. **Selective Testing**: Run affected tests during development
4. **Resource Cleanup**: Properly dispose of test resources

## Troubleshooting

### Common Issues

**Tests Hanging**

```bash
# Check for open handles
npm test -- --detectOpenHandles

# Force exit after timeout
npm test -- --forceExit
```

**Database Connection Issues**

```bash
# Check database status
docker-compose ps postgres-test

# Reset test database
npm run db:reset:test
```

**Memory Issues**

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

**Debugging Tests**

```bash
# Debug specific test
npm run test:debug -- --testNamePattern="should login user"

# Use VS Code debugger
# Set breakpoint and run "Jest: Debug" configuration
```

### Performance Issues

**Slow Tests**

```bash
# Identify slow tests
npm test -- --verbose

# Profile test execution
npm test -- --logHeapUsage

# Run tests serially for debugging
npm test -- --runInBand
```

### Coverage Issues

**Low Coverage**

```bash
# Detailed coverage report
npm run test:coverage -- --verbose

# Uncovered lines
npm run test:coverage -- --coverage --coverageReporters=text

# Coverage threshold enforcement
npm run test:coverage -- --coverageThreshold='{}'
```

## Test Monitoring

### Metrics Tracked

- Test execution time
- Test success/failure rates
- Coverage trends
- Flaky test identification
- Resource usage during tests

### Reporting

- Daily coverage reports
- Weekly test health summaries
- Monthly performance trend analysis
- Quarterly test strategy reviews

## Contributing

### Adding New Tests

1. Follow naming conventions
2. Include appropriate tags
3. Update coverage requirements if needed
4. Document complex test scenarios
5. Ensure tests are deterministic

### Modifying Existing Tests

1. Understand existing test coverage
2. Update related tests when changing code
3. Maintain backward compatibility where possible
4. Update documentation for significant changes

For questions about testing, please refer to the [Testing Standards](./TESTING_STANDARDS.md) or contact the development team.
