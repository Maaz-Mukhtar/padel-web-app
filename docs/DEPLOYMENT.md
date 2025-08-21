# Deployment Guide - Padel Platform

Complete guide for deploying the Padel Platform microservices to various environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Docker Deployment](#docker-deployment)
- [Monitoring Setup](#monitoring-setup)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The Padel Platform consists of 4 core microservices with supporting infrastructure:

### Core Services
- **API Gateway** (Port 3000): Main entry point and request routing
- **Auth Service** (Port 3001): User authentication and authorization
- **User Service** (Port 3002): User profiles and social features
- **Booking Service** (Port 3003): Venue and booking management
- **Notification Service** (Port 3004): Email, SMS, and push notifications

### Infrastructure
- **PostgreSQL**: Primary database for all services
- **Redis**: Caching and session storage
- **Elasticsearch**: Logging and search functionality
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards
- **Kibana**: Log analysis and visualization

## Prerequisites

### Required Software

```bash
# Node.js 20+ LTS
node --version  # Should be >= 20.0.0

# Docker and Docker Compose
docker --version
docker-compose --version

# Kubernetes CLI (for K8s deployment)
kubectl version --client

# Helm (for K8s deployment)
helm version
```

### Development Tools

```bash
# Install development dependencies
npm install -g @nestjs/cli typescript ts-node

# Verify installations
nest --version
tsc --version
ts-node --version
```

## Local Development

### Quick Start

```bash
# Clone repository
git clone https://github.com/Maaz-Mukhtar/padel-web-app.git
cd padel-web-app

# Install dependencies
npm install

# Start infrastructure services
docker-compose up -d postgres redis elasticsearch

# Start all microservices
npm run dev
```

### Manual Service Startup

```bash
# Start services individually for debugging
cd services/auth && npm run dev &
cd services/user && npm run dev &
cd services/booking && npm run dev &
cd services/notification && npm run dev &
cd services/api-gateway && npm run dev &
```

### Environment Configuration

Create `.env.development` file:

```bash
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=padel_user
POSTGRES_PASSWORD=your_password_here
POSTGRES_DB=padel_platform

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Service Ports
AUTH_SERVICE_PORT=3001
USER_SERVICE_PORT=3002
BOOKING_SERVICE_PORT=3003
NOTIFICATION_SERVICE_PORT=3004
API_GATEWAY_PORT=3000

# External Services
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Elasticsearch
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200

# Frontend URLs (for CORS)
FRONTEND_URLS=http://localhost:3000,http://localhost:3001
```

### Database Setup

```bash
# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Reset database (if needed)
npm run db:reset
```

### Verification

```bash
# Check service health
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # User Service
curl http://localhost:3003/health  # Booking Service
curl http://localhost:3004/health  # Notification Service

# View API documentation
open http://localhost:3001/api/docs  # Auth Service docs
open http://localhost:3002/api/docs  # User Service docs
```

## Kubernetes Deployment

### Prerequisites

```bash
# Ensure Kubernetes cluster is running
kubectl cluster-info

# Verify cluster access
kubectl get nodes
```

### Deployment Options

#### Option 1: Using Kustomize (Recommended)

```bash
# Deploy to development environment
kubectl apply -k infrastructure/kubernetes/base

# Deploy to staging environment
kubectl apply -k infrastructure/kubernetes/overlays/staging

# Deploy to production environment
kubectl apply -k infrastructure/kubernetes/overlays/prod
```

#### Option 2: Using Helm Charts

```bash
# Add required Helm repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install infrastructure dependencies
helm install postgresql bitnami/postgresql -f infrastructure/helm/values/postgresql.yaml
helm install redis bitnami/redis -f infrastructure/helm/values/redis.yaml

# Deploy Padel Platform
helm install padel-platform ./infrastructure/helm/padel-platform \
  -f infrastructure/helm/values/development.yaml
```

### Step-by-Step Kubernetes Deployment

#### 1. Create Namespace

```bash
kubectl apply -f infrastructure/kubernetes/base/namespace.yaml
```

#### 2. Apply ConfigMaps and Secrets

```bash
# Create secrets (update with actual values)
kubectl create secret generic database-secret \
  --from-literal=username=padel_user \
  --from-literal=password=your_secure_password \
  -n padel-platform-dev

kubectl create secret generic redis-secret \
  --from-literal=password=your_redis_password \
  -n padel-platform-dev

kubectl create secret generic jwt-secret \
  --from-literal=secret=your_jwt_secret_key \
  -n padel-platform-dev

# Apply ConfigMaps
kubectl apply -f infrastructure/kubernetes/base/configmap.yaml
```

#### 3. Deploy Infrastructure

```bash
# Deploy PostgreSQL
kubectl apply -f infrastructure/kubernetes/base/postgres-statefulset.yaml

# Deploy Redis
kubectl apply -f infrastructure/kubernetes/base/redis-deployment.yaml

# Deploy Elasticsearch
kubectl apply -f infrastructure/kubernetes/base/elasticsearch-statefulset.yaml

# Wait for infrastructure to be ready
kubectl wait --for=condition=ready pod -l app=postgresql -n padel-platform-dev --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n padel-platform-dev --timeout=300s
```

#### 4. Deploy Microservices

```bash
# Deploy all microservices
kubectl apply -f infrastructure/kubernetes/base/auth-service.yaml
kubectl apply -f infrastructure/kubernetes/base/user-service.yaml
kubectl apply -f infrastructure/kubernetes/base/booking-service.yaml
kubectl apply -f infrastructure/kubernetes/base/notification-service.yaml
kubectl apply -f infrastructure/kubernetes/base/api-gateway.yaml

# Wait for services to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=auth-service -n padel-platform-dev --timeout=300s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=user-service -n padel-platform-dev --timeout=300s
```

#### 5. Deploy Monitoring Stack

```bash
# Deploy Prometheus and Grafana
kubectl apply -k infrastructure/kubernetes/monitoring

# Wait for monitoring to be ready
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s
```

### Verification

```bash
# Check all pods are running
kubectl get pods -n padel-platform-dev

# Check services
kubectl get services -n padel-platform-dev

# Check ingress (if configured)
kubectl get ingress -n padel-platform-dev

# View logs
kubectl logs -f deployment/auth-service -n padel-platform-dev
```

### Accessing Services

```bash
# Port forward for local access
kubectl port-forward svc/api-gateway-service 3000:3000 -n padel-platform-dev &
kubectl port-forward svc/prometheus 9090:9090 -n monitoring &
kubectl port-forward svc/grafana 3001:80 -n monitoring &

# Access services
curl http://localhost:3000/health
open http://localhost:9090    # Prometheus
open http://localhost:3001    # Grafana (admin/admin123)
```

## Docker Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale specific services
docker-compose up -d --scale auth-service=3

# Stop all services
docker-compose down

# Remove volumes (careful - this deletes data)
docker-compose down -v
```

### Custom Docker Compose Override

Create `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  api-gateway:
    environment:
      - LOG_LEVEL=debug
    ports:
      - "3000:3000"
      
  auth-service:
    environment:
      - LOG_LEVEL=debug
    ports:
      - "3001:3001"
      
  postgres:
    ports:
      - "5432:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
```

### Building Custom Images

```bash
# Build all service images
docker-compose build

# Build specific service
docker-compose build auth-service

# Build with no cache
docker-compose build --no-cache auth-service

# Push images to registry
docker-compose push
```

## Monitoring Setup

### Prometheus Configuration

Prometheus automatically discovers services with annotations:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3001"
  prometheus.io/path: "/metrics"
```

### Grafana Dashboards

Access Grafana at `http://localhost:3000` (admin/admin123):

1. **Padel Platform Overview**: Service health and performance
2. **Kubernetes Cluster**: Node and pod metrics
3. **PostgreSQL**: Database performance
4. **Redis**: Cache metrics
5. **Elasticsearch**: Search and logging metrics

### Alerting Rules

Key alerts configured:

- Service down for > 1 minute
- High error rate (> 5%)
- High response time (> 500ms)
- Database connection failures
- High memory usage (> 80%)
- Disk space low (< 10%)

### Log Aggregation

Fluentd collects logs from all services:

```bash
# View logs in Kibana
kubectl port-forward svc/kibana 5601:5601 -n elasticsearch
open http://localhost:5601

# Create index pattern: fluentd-*
# View logs with correlation IDs
```

## Environment Configuration

### Development Environment

```bash
# Characteristics
- Single replica per service
- Local storage volumes
- Debug logging enabled
- Hot reload enabled
- Mock external services

# Access
- API Gateway: http://localhost:3000
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090
- Kibana: http://localhost:5601
```

### Staging Environment

```bash
# Characteristics
- 2 replicas per service
- Persistent volumes
- Info level logging
- SSL termination
- Real external services (test environment)

# Access
- API Gateway: https://api-staging.padelplatform.pk
- Grafana: https://grafana-staging.padelplatform.pk
- Kibana: https://kibana-staging.padelplatform.pk
```

### Production Environment

```bash
# Characteristics
- 3+ replicas per service
- High availability storage
- Error level logging
- SSL termination with real certificates
- Production external services
- Resource limits and requests
- Pod disruption budgets
- Network policies

# Access
- API Gateway: https://api.padelplatform.pk
- Admin access via VPN only
```

## Environment Variables

### Required Variables

```bash
# Database
POSTGRES_HOST=required
POSTGRES_PORT=required
POSTGRES_USER=required
POSTGRES_PASSWORD=required (secret)
POSTGRES_DB=required

# Redis
REDIS_HOST=required
REDIS_PORT=required
REDIS_PASSWORD=optional (secret)

# JWT
JWT_SECRET=required (secret)
JWT_EXPIRY=optional (default: 15m)

# External Services
SMTP_HOST=required
SMTP_PORT=required
SMTP_USER=required (secret)
SMTP_PASSWORD=required (secret)

# Feature Flags
ENABLE_SWAGGER=optional (default: true in dev)
ENABLE_METRICS=optional (default: true)
ENABLE_LOGGING=optional (default: true)
```

### Security Best Practices

1. **Never commit secrets** to version control
2. **Use Kubernetes secrets** for sensitive data
3. **Rotate secrets regularly** (quarterly)
4. **Limit secret access** to necessary services only
5. **Use separate secrets** per environment

## Troubleshooting

### Common Issues

#### Service Won't Start

```bash
# Check pod status
kubectl describe pod <pod-name> -n padel-platform-dev

# View logs
kubectl logs <pod-name> -n padel-platform-dev

# Check resource limits
kubectl top pod <pod-name> -n padel-platform-dev

# Common fixes
- Verify environment variables
- Check database connectivity
- Ensure sufficient resources
- Verify image pull secrets
```

#### Database Connection Issues

```bash
# Test database connectivity
kubectl exec -it <pod-name> -n padel-platform-dev -- \
  psql -h postgres-service -U padel_user -d padel_platform

# Check database logs
kubectl logs statefulset/postgresql -n padel-platform-dev

# Common fixes
- Verify database credentials
- Check network policies
- Ensure database is ready
- Verify service DNS resolution
```

#### Memory/CPU Issues

```bash
# Check resource usage
kubectl top pods -n padel-platform-dev

# Check resource limits
kubectl describe pod <pod-name> -n padel-platform-dev

# Solutions
- Increase resource limits
- Add horizontal pod autoscaling
- Optimize application code
- Add resource requests
```

### Performance Issues

#### High Response Times

```bash
# Check service metrics
curl http://localhost:9090/api/v1/query?query=http_request_duration_seconds

# Check database performance
kubectl exec -it postgresql-0 -n padel-platform-dev -- \
  psql -U padel_user -d padel_platform -c "SELECT * FROM pg_stat_activity;"

# Solutions
- Add database indexes
- Implement caching
- Scale horizontally
- Optimize queries
```

#### High Error Rates

```bash
# Check error logs
kubectl logs deployment/auth-service -n padel-platform-dev | grep ERROR

# Check Grafana error rate dashboard
open http://localhost:3001/d/padel-overview

# Solutions
- Fix application bugs
- Improve error handling
- Add circuit breakers
- Scale services
```

### Networking Issues

#### Service Discovery Problems

```bash
# Test DNS resolution
kubectl exec -it <pod-name> -n padel-platform-dev -- \
  nslookup auth-service.padel-platform-dev.svc.cluster.local

# Check service endpoints
kubectl get endpoints -n padel-platform-dev

# Solutions
- Verify service selectors
- Check pod labels
- Ensure DNS is working
- Verify network policies
```

### Rolling Updates

```bash
# Update service image
kubectl set image deployment/auth-service \
  auth-service=ghcr.io/maaz-mukhtar/padel-web-app/auth-service:v1.1.0 \
  -n padel-platform-dev

# Check rollout status
kubectl rollout status deployment/auth-service -n padel-platform-dev

# Rollback if needed
kubectl rollout undo deployment/auth-service -n padel-platform-dev

# View rollout history
kubectl rollout history deployment/auth-service -n padel-platform-dev
```

### Backup and Recovery

#### Database Backup

```bash
# Create backup
kubectl exec postgresql-0 -n padel-platform-dev -- \
  pg_dump -U padel_user padel_platform > backup-$(date +%Y%m%d).sql

# Restore backup
kubectl exec -i postgresql-0 -n padel-platform-dev -- \
  psql -U padel_user padel_platform < backup-20231201.sql
```

#### Configuration Backup

```bash
# Backup ConfigMaps and Secrets
kubectl get configmap -n padel-platform-dev -o yaml > configmaps-backup.yaml
kubectl get secret -n padel-platform-dev -o yaml > secrets-backup.yaml

# Restore
kubectl apply -f configmaps-backup.yaml
kubectl apply -f secrets-backup.yaml
```

For additional support, refer to the [Operations Manual](./OPERATIONS.md) or contact the DevOps team.