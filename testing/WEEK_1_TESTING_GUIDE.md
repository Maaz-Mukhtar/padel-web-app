# Week 1 Complete Testing Guide - Padel Platform

This guide walks you through testing every component of Week 1 implementation step-by-step.

## 🚀 Phase 1: Environment Setup & Prerequisites

### Step 1.1: Verify Prerequisites

```bash
# Check Node.js version (should be 20+)
node --version

# Check npm version
npm --version

# Check Docker
docker --version
docker-compose --version

# Check kubectl (optional for local testing)
kubectl version --client
```

**Expected Results:**

- Node.js: v20.x.x or higher
- npm: v10.x.x or higher
- Docker: v20.x.x or higher

### Step 1.2: Install Project Dependencies

```bash
# Navigate to project root
cd /path/to/padel-web-app

# Install root dependencies
npm install

# Install service dependencies
cd services/auth && npm install
cd ../user && npm install
cd ../booking && npm install
cd ../notification && npm install
cd ../api-gateway && npm install
```

**Expected Results:**

- All dependencies installed without errors
- No security vulnerabilities reported

### Step 1.3: Environment Configuration

```bash
# Copy example environment file
cp .env.example .env.development

# Verify test environment exists
cat .env.test
```

**Expected Results:**

- Environment files are present and contain required variables

## 🧪 Phase 2: Unit & Integration Testing

### Step 2.1: Run Complete Test Suite

```bash
# Run all tests from root
npm test

# Run tests with coverage
npm run test:coverage

# Run tests for specific service
cd services/auth
npm test
```

**Expected Results:**

```
Test Suites: X passed, X total
Tests: X passed, X total
Coverage: >80% for all metrics
```

### Step 2.2: Verify Test Coverage

```bash
# Generate detailed coverage report
npm run test:coverage

# Open coverage report in browser (optional)
# open coverage/lcov-report/index.html
```

**Expected Results:**

- Overall coverage >80%
- All critical paths covered
- No failing tests

### Step 2.3: Run Service-Specific Tests

```bash
# Auth Service Tests
cd services/auth
npm test -- --verbose

# User Service Tests
cd ../user
npm test -- --verbose

# Check other services
cd ../booking && npm test
cd ../notification && npm test
```

**Expected Results:**

- All unit tests pass
- Integration tests pass
- No console errors

## 🐳 Phase 3: Infrastructure Testing

### Step 3.1: Start Infrastructure Services

```bash
# Start database and cache services
docker-compose up -d postgres redis elasticsearch

# Wait for services to be ready (30-60 seconds)
sleep 60

# Check service status
docker-compose ps
```

**Expected Results:**

```
postgres        Up      0.0.0.0:5432->5432/tcp
redis           Up      0.0.0.0:6379->6379/tcp
elasticsearch   Up      0.0.0.0:9200->9200/tcp
```

### Step 3.2: Verify Database Connection

```bash
# Test PostgreSQL connection
docker exec -it padel-web-app_postgres_1 psql -U padel_user -d padel_platform -c "SELECT version();"

# Test Redis connection
docker exec -it padel-web-app_redis_1 redis-cli ping
```

**Expected Results:**

- PostgreSQL returns version information
- Redis returns "PONG"

### Step 3.3: Check Elasticsearch

```bash
# Test Elasticsearch health
curl -X GET "localhost:9200/_cluster/health?pretty"

# Check if indices are created
curl -X GET "localhost:9200/_cat/indices?v"
```

**Expected Results:**

- Cluster status: "yellow" or "green"
- Elasticsearch responding on port 9200

## 🌐 Phase 4: Microservices Testing

### Step 4.1: Start All Microservices

```bash
# Option 1: Start all services with npm
npm run dev

# Option 2: Start services individually
cd services/auth && npm run dev &
cd ../user && npm run dev &
cd ../booking && npm run dev &
cd ../notification && npm run dev &
cd ../api-gateway && npm run dev &
```

**Wait for all services to start (2-3 minutes)**

### Step 4.2: Verify Service Health

```bash
# Check all service health endpoints
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # User Service
curl http://localhost:3003/health  # Booking Service
curl http://localhost:3004/health  # Notification Service
```

**Expected Results:**
All services return:

```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T...",
  "service": "service-name"
}
```

## 🔐 Phase 5: Authentication API Testing

### Step 5.1: Test User Registration

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+923001234567"
  }'
```

**Expected Result:**

```json
{
  "id": "uuid-string",
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User",
  "role": "player",
  "isVerified": false,
  "createdAt": "2023-12-01T...",
  "updatedAt": "2023-12-01T..."
}
```

### Step 5.2: Test User Login

```bash
# Login with registered user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

**Expected Result:**

```json
{
  "access_token": "jwt-token-string",
  "user": {
    "id": "uuid-string",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "player"
  }
}
```

**Save the access_token for next tests!**

### Step 5.3: Test Token Verification

```bash
# Replace YOUR_JWT_TOKEN with actual token from login
curl -X POST http://localhost:3000/api/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_JWT_TOKEN"
  }'
```

**Expected Result:**

```json
{
  "sub": "user-id",
  "email": "test@example.com",
  "role": "player",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Step 5.4: Test Protected Endpoint

```bash
# Get user profile (protected route)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result:**

```json
{
  "id": "user-id",
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User",
  "role": "player"
}
```

## 👤 Phase 6: User Service Testing

### Step 6.1: Create User Profile

```bash
# Create user profile (use user ID from registration)
curl -X POST http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_FROM_REGISTRATION",
    "bio": "Passionate padel player from Karachi",
    "skillLevel": "intermediate",
    "playFrequency": "weekly",
    "preferredPlayTime": "evening"
  }'
```

**Expected Result:**

```json
{
  "id": "profile-id",
  "userId": "user-id",
  "bio": "Passionate padel player from Karachi",
  "skillLevel": "intermediate",
  "playFrequency": "weekly",
  "preferredPlayTime": "evening",
  "rating": 0,
  "totalReviews": 0,
  "createdAt": "2023-12-01T...",
  "updatedAt": "2023-12-01T..."
}
```

### Step 6.2: Update User Profile

```bash
# Update profile
curl -X PUT http://localhost:3000/api/users/profile/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Updated: Advanced padel player seeking challenges!",
    "skillLevel": "advanced"
  }'
```

**Expected Result:**
Updated profile with new values

### Step 6.3: Search User Profiles

```bash
# Search profiles by skill level
curl -X GET "http://localhost:3000/api/users/search?skillLevel=intermediate&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Result:**

```json
{
  "profiles": [...],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

## 📊 Phase 7: Monitoring Stack Testing

### Step 7.1: Start Monitoring Services

```bash
# If using Docker Compose (add to docker-compose.yml)
docker-compose up -d prometheus grafana

# Or if using Kubernetes
kubectl apply -k infrastructure/kubernetes/monitoring
```

### Step 7.2: Access Monitoring Dashboards

```bash
# Port forward services (if using Kubernetes)
kubectl port-forward svc/prometheus 9090:9090 -n monitoring &
kubectl port-forward svc/grafana 3000:80 -n monitoring &
kubectl port-forward svc/kibana 5601:5601 -n elasticsearch &
```

**Test in Browser:**

1. **Prometheus**: http://localhost:9090
   - Check Status > Targets
   - Should see all services being scraped

2. **Grafana**: http://localhost:3000
   - Login: admin/admin123
   - Check dashboards are loading

3. **Kibana**: http://localhost:5601
   - Create index pattern: `fluentd-*`
   - View logs from services

### Step 7.3: Verify Metrics Collection

```bash
# Check metrics endpoints
curl http://localhost:3001/metrics  # Auth service
curl http://localhost:3002/metrics  # User service
curl http://localhost:3003/metrics  # Booking service
curl http://localhost:3004/metrics  # Notification service
```

**Expected Results:**

- Prometheus metrics format
- HTTP request metrics
- Service-specific business metrics

## 🚀 Phase 8: Performance Testing

### Step 8.1: Basic Load Testing

```bash
# Install k6 (if not installed)
# https://k6.io/docs/getting-started/installation/

# Create a simple load test
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
};

export default function() {
  let response = http.get('http://localhost:3000/health');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
  });
  sleep(1);
}
EOF

# Run load test
k6 run load-test.js
```

**Expected Results:**

- All health checks pass
- Response time < 100ms
- No failed requests

### Step 8.2: Authentication Load Test

```bash
# Create auth load test
cat > auth-load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 5 },
    { duration: '30s', target: 0 },
  ],
};

export default function() {
  // Test login
  let loginResponse = http.post('http://localhost:3000/api/auth/login',
    JSON.stringify({
      email: 'test@example.com',
      password: 'TestPass123!'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => JSON.parse(r.body).access_token !== undefined,
  });

  sleep(2);
}
EOF

# Run auth load test
k6 run auth-load-test.js
```

## 📝 Phase 9: API Documentation Testing

### Step 9.1: Verify Swagger Documentation

**Open in Browser:**

1. **Auth Service API Docs**: http://localhost:3001/api/docs
2. **User Service API Docs**: http://localhost:3002/api/docs
3. **Booking Service API Docs**: http://localhost:3003/api/docs
4. **Notification Service API Docs**: http://localhost:3004/api/docs

**Verify:**

- All endpoints documented
- Request/response schemas present
- Try "Try it out" functionality
- Authentication works with Bearer tokens

### Step 9.2: Test API Documentation Accuracy

```bash
# Test an endpoint documented in Swagger
curl -X GET http://localhost:3001/api/docs/json
```

**Expected Result:**

- Valid OpenAPI/Swagger JSON specification

## 🔄 Phase 10: End-to-End User Journey

### Step 10.1: Complete User Registration Flow

```bash
# Step 1: Register new user
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "e2e@example.com",
    "password": "TestPass123!",
    "firstName": "E2E",
    "lastName": "Test",
    "phone": "+923001234567"
  }')

echo "Registration: $REGISTER_RESPONSE"

# Extract user ID (you might need to parse JSON manually)
USER_ID=$(echo $REGISTER_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "User ID: $USER_ID"
```

### Step 10.2: Login and Create Profile

```bash
# Step 2: Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "e2e@example.com",
    "password": "TestPass123!"
  }')

echo "Login: $LOGIN_RESPONSE"

# Extract token (you might need to parse JSON manually)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"

# Step 3: Create profile
PROFILE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "bio": "E2E test user profile",
    "skillLevel": "beginner",
    "playFrequency": "occasionally",
    "preferredPlayTime": "morning"
  }')

echo "Profile Created: $PROFILE_RESPONSE"
```

### Step 10.3: Verify Data Consistency

```bash
# Step 4: Verify profile exists
PROFILE_GET=$(curl -s -X GET http://localhost:3000/api/users/profile/$USER_ID \
  -H "Authorization: Bearer $TOKEN")

echo "Profile Retrieved: $PROFILE_GET"

# Step 5: Verify in database
docker exec -it padel-web-app_postgres_1 psql -U padel_user -d user_service \
  -c "SELECT * FROM user_profiles WHERE user_id = '$USER_ID';"
```

## ✅ Phase 11: Final Verification Checklist

### Infrastructure ✅

- [ ] All Docker containers running
- [ ] Database connections working
- [ ] Redis cache accessible
- [ ] Elasticsearch responding

### Services ✅

- [ ] Auth Service health check passes
- [ ] User Service health check passes
- [ ] Booking Service health check passes
- [ ] Notification Service health check passes
- [ ] API Gateway routing works

### API Functionality ✅

- [ ] User registration works
- [ ] User login returns valid JWT
- [ ] Protected routes require authentication
- [ ] Profile creation and updates work
- [ ] Search functionality works

### Testing ✅

- [ ] All unit tests pass
- [ ] Test coverage > 80%
- [ ] Integration tests pass
- [ ] Load testing shows acceptable performance

### Monitoring ✅

- [ ] Prometheus collecting metrics
- [ ] Grafana dashboards loading
- [ ] Kibana showing logs
- [ ] Correlation IDs present in logs

### Documentation ✅

- [ ] Swagger API docs accessible
- [ ] All endpoints documented correctly
- [ ] Authentication documented
- [ ] Response schemas accurate

## 🐛 Troubleshooting Common Issues

### Services Won't Start

```bash
# Check port availability
netstat -tulpn | grep :3001

# Check Docker containers
docker-compose ps
docker-compose logs service-name

# Restart specific service
docker-compose restart postgres
```

### Database Connection Issues

```bash
# Check database logs
docker-compose logs postgres

# Verify connection string
echo $DATABASE_URL

# Test connection manually
docker exec -it container-name psql -U username -d database
```

### JWT Token Issues

```bash
# Verify token format
echo "YOUR_JWT_TOKEN" | base64 -d

# Check token expiration
curl -X POST http://localhost:3001/api/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_JWT_TOKEN"}'
```

### Monitoring Not Working

```bash
# Check if metrics endpoints are accessible
curl http://localhost:3001/metrics

# Verify Prometheus config
curl http://localhost:9090/api/v1/targets

# Check Grafana datasource
curl -u admin:admin123 http://localhost:3000/api/datasources
```

## 🎉 Success Criteria

You've successfully validated Week 1 if:

1. ✅ All services start without errors
2. ✅ User registration and login flow works
3. ✅ Profile management is functional
4. ✅ All tests pass with >80% coverage
5. ✅ Monitoring dashboards show data
6. ✅ API documentation is accessible and accurate
7. ✅ Load testing shows acceptable performance
8. ✅ Database operations work correctly
9. ✅ End-to-end user journey completes successfully

**Congratulations! Week 1 is fully validated and ready for production deployment.**

## 📞 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs for error messages
3. Verify all prerequisites are met
4. Check network connectivity and port availability

The system is now ready for Week 2 development!
