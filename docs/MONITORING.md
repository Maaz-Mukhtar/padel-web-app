# Monitoring Guide - Padel Platform

Comprehensive monitoring and observability guide for the Padel Platform microservices.

## Table of Contents

- [Overview](#overview)
- [Monitoring Stack](#monitoring-stack)
- [Metrics Collection](#metrics-collection)
- [Logging](#logging)
- [Dashboards](#dashboards)
- [Alerting](#alerting)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)

## Overview

The Padel Platform uses a comprehensive monitoring strategy based on the three pillars of observability:

1. **Metrics**: Prometheus + Grafana
2. **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
3. **Traces**: Distributed tracing with correlation IDs

### Monitoring Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Microservices │    │   API Gateway   │    │   Frontend      │
│                 │    │                 │    │                 │
│ /metrics        │────│ /metrics        │────│ User Actions    │
│ Structured Logs │    │ Structured Logs │    │ Error Tracking  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prometheus    │    │    Fluentd      │    │   Grafana       │
│                 │    │                 │    │                 │
│ Metrics Storage │    │ Log Collection  │    │ Visualization   │
│ Alerting Rules  │    │ Log Parsing     │    │ Dashboards      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  AlertManager   │    │ Elasticsearch   │    │     Kibana      │
│                 │    │                 │    │                 │
│ Alert Routing   │    │ Log Storage     │    │ Log Analysis    │
│ Notifications   │    │ Full-text Search│    │ Log Dashboards  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Monitoring Stack

### Core Components

| Component         | Purpose                              | Port | Access                                             |
| ----------------- | ------------------------------------ | ---- | -------------------------------------------------- |
| **Prometheus**    | Metrics collection and storage       | 9090 | `kubectl port-forward svc/prometheus 9090:9090`    |
| **Grafana**       | Metrics visualization and dashboards | 3000 | `kubectl port-forward svc/grafana 3000:80`         |
| **Elasticsearch** | Log storage and indexing             | 9200 | `kubectl port-forward svc/elasticsearch 9200:9200` |
| **Kibana**        | Log analysis and visualization       | 5601 | `kubectl port-forward svc/kibana 5601:5601`        |
| **Fluentd**       | Log collection and forwarding        | -    | DaemonSet on all nodes                             |

### Access Credentials

```bash
# Grafana
Username: admin
Password: admin123

# Kibana
No authentication required (development)

# Prometheus
No authentication required (development)
```

## Metrics Collection

### Service Metrics

Each microservice exposes metrics at `/metrics` endpoint using Prometheus client:

```typescript
// Example metrics from auth service
http_requests_total{method="POST",route="/auth/login",status_code="200",service="auth-service"} 1234
http_request_duration_seconds{method="POST",route="/auth/login",status_code="200",service="auth-service"} 0.125

// Business metrics
user_registrations_total{role="player",service="auth-service"} 567
login_attempts_total{status="success",service="auth-service"} 890
```

### Infrastructure Metrics

Kubernetes and system metrics collected automatically:

```bash
# Node metrics
node_cpu_usage_percent
node_memory_usage_bytes
node_filesystem_usage_bytes

# Pod metrics
pod_cpu_usage_percent
pod_memory_usage_bytes
pod_restart_count

# Service metrics
service_up
service_response_time
service_error_rate
```

### Custom Business Metrics

Application-specific metrics for business insights:

```typescript
// Booking metrics
bookings_created_total{venue_id="venue-123",status="confirmed"}
booking_cancellations_total{reason="user_cancelled"}
booking_duration_minutes{venue_id="venue-123"}

// User engagement metrics
user_sessions_total{device_type="mobile"}
page_views_total{page="/venues"}
user_retention_days{cohort="2023-12"}
```

### Metrics Configuration

Services automatically discovered via Kubernetes annotations:

```yaml
# Service annotation for Prometheus scraping
metadata:
  annotations:
    prometheus.io/scrape: 'true'
    prometheus.io/port: '3001'
    prometheus.io/path: '/metrics'
```

## Logging

### Structured Logging

All services use structured JSON logging:

```json
{
  "timestamp": "2023-12-01T10:00:00.000Z",
  "level": "info",
  "message": "User login successful",
  "service": "auth-service",
  "correlationId": "req-123-456",
  "userId": "user-789",
  "context": "AuthController",
  "metadata": {
    "method": "POST",
    "path": "/auth/login",
    "statusCode": 200,
    "duration": 125
  }
}
```

### Log Levels

| Level     | Usage                                    | Example                              |
| --------- | ---------------------------------------- | ------------------------------------ |
| **ERROR** | System errors, exceptions                | Database connection failures         |
| **WARN**  | Recoverable issues, degraded performance | High response times, retry attempts  |
| **INFO**  | Important business events                | User registration, booking creation  |
| **DEBUG** | Detailed execution information           | Function entry/exit, variable values |

### Log Collection Flow

```
Microservices → stdout/stderr → Fluentd → Elasticsearch → Kibana
```

### Correlation IDs

Request tracing across services using correlation IDs:

```typescript
// Request headers
X-Correlation-ID: req-20231201-123456-789

// Log entries across services
auth-service: {"correlationId": "req-20231201-123456-789", "message": "User authenticated"}
user-service: {"correlationId": "req-20231201-123456-789", "message": "Profile retrieved"}
```

### Log Retention

| Environment | Retention Period | Storage Size |
| ----------- | ---------------- | ------------ |
| Development | 7 days           | 10 GB        |
| Staging     | 30 days          | 100 GB       |
| Production  | 90 days          | 1 TB         |

## Dashboards

### Grafana Dashboards

#### 1. Padel Platform Overview

**URL**: `http://localhost:3000/d/padel-overview`

**Panels**:

- Service health status
- Request rate and error rate
- Response time percentiles
- Active users and sessions

#### 2. Service Details

**URL**: `http://localhost:3000/d/service-details`

**Panels**:

- Per-service metrics
- Database connection pools
- Cache hit rates
- Memory and CPU usage

#### 3. Business Metrics

**URL**: `http://localhost:3000/d/business-metrics`

**Panels**:

- User registrations
- Booking conversion rates
- Revenue metrics
- User engagement

#### 4. Infrastructure Overview

**URL**: `http://localhost:3000/d/infrastructure`

**Panels**:

- Kubernetes cluster health
- Node resource usage
- Pod status and restarts
- Storage usage

### Kibana Dashboards

#### 1. Application Logs

**Index Pattern**: `fluentd-*`

**Visualizations**:

- Log volume over time
- Error rate by service
- Top error messages
- Request/response correlation

#### 2. Performance Analysis

**Filters**:

- Slow queries (> 1 second)
- High memory usage alerts
- Error patterns
- User journey analysis

### Dashboard Alerts

Key alerts configured in Grafana:

```yaml
# High error rate alert
- alert: HighErrorRate
  expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
  for: 1m
  labels:
    severity: warning
  annotations:
    summary: 'High error rate detected on {{ $labels.service }}'

# High response time alert
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: '95th percentile response time > 500ms on {{ $labels.service }}'
```

## Alerting

### Alert Rules

#### Critical Alerts (Immediate Response)

```yaml
# Service down
- alert: ServiceDown
  expr: up == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: 'Service {{ $labels.instance }} is down'

# Database down
- alert: DatabaseDown
  expr: postgresql_up == 0
  for: 30s
  labels:
    severity: critical
  annotations:
    summary: 'PostgreSQL database is down'

# High error rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: 'Error rate > 10% on {{ $labels.service }}'
```

#### Warning Alerts (Monitor Closely)

```yaml
# High memory usage
- alert: HighMemoryUsage
  expr: (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.8
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: 'Memory usage > 80% on {{ $labels.pod }}'

# High CPU usage
- alert: HighCPUUsage
  expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: 'CPU usage > 80% on {{ $labels.pod }}'
```

### Alert Channels

#### Development Environment

```yaml
# Slack integration
- name: 'dev-alerts'
  slack_configs:
    - api_url: 'YOUR_SLACK_WEBHOOK_URL'
      channel: '#dev-alerts'
      title: 'Padel Platform Alert'
      text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

#### Production Environment

```yaml
# Multiple channels
- name: 'prod-alerts'
  email_configs:
    - to: 'ops-team@padelplatform.pk'
      subject: 'URGENT: {{ .GroupLabels.alertname }}'
  slack_configs:
    - api_url: 'YOUR_SLACK_WEBHOOK_URL'
      channel: '#production-alerts'
  pagerduty_configs:
    - routing_key: 'YOUR_PAGERDUTY_KEY'
```

### Alert Escalation

| Severity     | Response Time | Escalation                      |
| ------------ | ------------- | ------------------------------- |
| **Critical** | 5 minutes     | Immediate → Team Lead → Manager |
| **Warning**  | 30 minutes    | Developer → Team Lead           |
| **Info**     | Best effort   | Log only                        |

## Health Checks

### Service Health Endpoints

All services expose standardized health endpoints:

```bash
# Basic health check
GET /health
Response: {"status": "healthy", "timestamp": "...", "service": "auth-service"}

# Detailed health check
GET /health/detailed
Response: {
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "external_api": "degraded"
  },
  "dependencies": {...}
}
```

### Kubernetes Probes

```yaml
# Liveness probe - restart if fails
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

# Readiness probe - remove from load balancer if fails
readinessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

### Health Check Monitoring

Health checks are monitored and alerted on:

```bash
# Failed health checks
probe_http_status_code{instance="auth-service:3001",job="kubernetes-pods"} 200

# Health check duration
probe_duration_seconds{instance="auth-service:3001",job="kubernetes-pods"} 0.025
```

## Accessing Monitoring Services

### Local Development

```bash
# Start monitoring stack
kubectl apply -k infrastructure/kubernetes/monitoring

# Port forward services
kubectl port-forward svc/prometheus 9090:9090 -n monitoring &
kubectl port-forward svc/grafana 3000:80 -n monitoring &
kubectl port-forward svc/kibana 5601:5601 -n elasticsearch &

# Access dashboards
open http://localhost:9090    # Prometheus
open http://localhost:3000    # Grafana (admin/admin123)
open http://localhost:5601    # Kibana
```

### Production Access

```bash
# VPN required for production access
# Access via secure tunnels only

# Grafana: https://grafana.padelplatform.pk
# Kibana: https://kibana.padelplatform.pk
# Prometheus: Internal access only
```

## Performance Monitoring

### Key Performance Indicators (KPIs)

#### Technical KPIs

| Metric                  | Target  | Alert Threshold |
| ----------------------- | ------- | --------------- |
| **Response Time (P95)** | < 200ms | > 500ms         |
| **Error Rate**          | < 0.1%  | > 1%            |
| **Availability**        | > 99.9% | < 99%           |
| **CPU Usage**           | < 70%   | > 80%           |
| **Memory Usage**        | < 80%   | > 90%           |

#### Business KPIs

| Metric                     | Target       | Tracking |
| -------------------------- | ------------ | -------- |
| **User Registration Rate** | +10% monthly | Daily    |
| **Booking Conversion**     | > 15%        | Weekly   |
| **User Retention (7-day)** | > 40%        | Weekly   |
| **API Usage Growth**       | +20% monthly | Daily    |

### Performance Dashboards

```bash
# View performance metrics
open http://localhost:3000/d/performance-overview

# Key panels
- Response time trends
- Error rate by endpoint
- Throughput (requests/second)
- Resource utilization
- Database performance
```

## Troubleshooting

### Common Monitoring Issues

#### Metrics Not Appearing

```bash
# Check service annotations
kubectl describe pod <pod-name> -n padel-platform-dev

# Verify metrics endpoint
curl http://<pod-ip>:3001/metrics

# Check Prometheus targets
open http://localhost:9090/targets

# Common fixes
- Verify prometheus.io annotations
- Check firewall rules
- Ensure /metrics endpoint is working
- Verify service discovery configuration
```

#### Logs Not Flowing

```bash
# Check Fluentd status
kubectl get pods -n kube-system | grep fluentd

# View Fluentd logs
kubectl logs daemonset/fluentd -n kube-system

# Check Elasticsearch status
curl http://localhost:9200/_cluster/health

# Common fixes
- Restart Fluentd DaemonSet
- Check Elasticsearch storage
- Verify log format configuration
- Check index patterns in Kibana
```

#### Dashboard Not Loading

```bash
# Check Grafana status
kubectl get pods -n monitoring | grep grafana

# View Grafana logs
kubectl logs deployment/grafana -n monitoring

# Reset Grafana password
kubectl exec -it deployment/grafana -n monitoring -- \
  grafana-cli admin reset-admin-password newpassword

# Common fixes
- Verify Grafana configuration
- Check datasource connections
- Import missing dashboards
- Clear browser cache
```

### Performance Troubleshooting

#### High Response Times

```bash
# Check service metrics
curl http://localhost:9090/api/v1/query?query=http_request_duration_seconds_bucket

# Identify slow endpoints
# Check database performance
# Review cache hit rates
# Analyze resource usage
```

#### High Error Rates

```bash
# Check error logs in Kibana
# Filter by error level: ERROR
# Group by service and error message
# Check correlation IDs for request tracing
```

#### Resource Issues

```bash
# Check resource usage
kubectl top pods -n padel-platform-dev

# View resource limits
kubectl describe pod <pod-name> -n padel-platform-dev

# Check for OOMKilled pods
kubectl get events --sort-by='.lastTimestamp' -n padel-platform-dev
```

### Monitoring Best Practices

1. **Set up baseline metrics** before major deployments
2. **Create runbooks** for common alerts
3. **Test alerting channels** regularly
4. **Review and tune** alert thresholds quarterly
5. **Document troubleshooting steps** for each alert
6. **Monitor the monitors** - ensure monitoring stack is healthy
7. **Regular dashboard reviews** with stakeholders
8. **Keep monitoring overhead low** (< 5% of system resources)

For advanced monitoring topics, refer to the [Observability Playbook](./OBSERVABILITY.md).
