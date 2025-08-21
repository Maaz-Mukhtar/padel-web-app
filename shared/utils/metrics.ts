import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, register, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestTotal: Counter<string>;
  private readonly activeConnections: Gauge<string>;
  private readonly businessMetrics: Map<string, Counter<string>>;

  constructor(serviceName: string = 'unknown') {
    // Enable default metrics collection (CPU, memory, etc.)
    collectDefaultMetrics({
      prefix: `${serviceName}_`,
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });

    // HTTP Request Duration Histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code', 'service'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    // HTTP Request Counter
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'service'],
    });

    // Active Connections Gauge
    this.activeConnections = new Gauge({
      name: 'http_active_connections',
      help: 'Number of active HTTP connections',
      labelNames: ['service'],
    });

    // Business Metrics
    this.businessMetrics = new Map([
      ['bookings_created', new Counter({
        name: 'bookings_created_total',
        help: 'Total number of bookings created',
        labelNames: ['venue_id', 'status', 'service'],
      })],
      ['bookings_cancelled', new Counter({
        name: 'bookings_cancelled_total',
        help: 'Total number of bookings cancelled',
        labelNames: ['venue_id', 'reason', 'service'],
      })],
      ['users_registered', new Counter({
        name: 'users_registered_total',
        help: 'Total number of users registered',
        labelNames: ['role', 'provider', 'service'],
      })],
      ['auth_attempts', new Counter({
        name: 'auth_attempts_total',
        help: 'Total number of authentication attempts',
        labelNames: ['result', 'method', 'service'],
      })],
      ['notifications_sent', new Counter({
        name: 'notifications_sent_total',
        help: 'Total number of notifications sent',
        labelNames: ['type', 'status', 'service'],
      })],
      ['database_queries', new Counter({
        name: 'database_queries_total',
        help: 'Total number of database queries',
        labelNames: ['operation', 'table', 'service'],
      })],
      ['cache_operations', new Counter({
        name: 'cache_operations_total',
        help: 'Total number of cache operations',
        labelNames: ['operation', 'result', 'service'],
      })],
    ]);

    // Register all metrics
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.httpRequestTotal);
    register.registerMetric(this.activeConnections);
    this.businessMetrics.forEach(metric => register.registerMetric(metric));
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    serviceName: string = 'unknown'
  ) {
    const labels = {
      method: method.toUpperCase(),
      route,
      status_code: statusCode.toString(),
      service: serviceName,
    };

    this.httpRequestDuration.observe(labels, duration);
    this.httpRequestTotal.inc(labels);
  }

  /**
   * Update active connections count
   */
  setActiveConnections(count: number, serviceName: string = 'unknown') {
    this.activeConnections.set({ service: serviceName }, count);
  }

  /**
   * Increment active connections
   */
  incrementActiveConnections(serviceName: string = 'unknown') {
    this.activeConnections.inc({ service: serviceName });
  }

  /**
   * Decrement active connections
   */
  decrementActiveConnections(serviceName: string = 'unknown') {
    this.activeConnections.dec({ service: serviceName });
  }

  /**
   * Record business metric
   */
  recordBusinessMetric(
    metricName: string,
    labels: Record<string, string> = {},
    serviceName: string = 'unknown'
  ) {
    const metric = this.businessMetrics.get(metricName);
    if (metric) {
      metric.inc({ ...labels, service: serviceName });
    }
  }

  /**
   * Record booking creation
   */
  recordBookingCreated(venueId: string, status: string, serviceName: string = 'unknown') {
    this.recordBusinessMetric('bookings_created', { venue_id: venueId, status }, serviceName);
  }

  /**
   * Record booking cancellation
   */
  recordBookingCancelled(venueId: string, reason: string, serviceName: string = 'unknown') {
    this.recordBusinessMetric('bookings_cancelled', { venue_id: venueId, reason }, serviceName);
  }

  /**
   * Record user registration
   */
  recordUserRegistered(role: string, provider: string = 'local', serviceName: string = 'unknown') {
    this.recordBusinessMetric('users_registered', { role, provider }, serviceName);
  }

  /**
   * Record authentication attempt
   */
  recordAuthAttempt(result: 'success' | 'failure', method: string = 'local', serviceName: string = 'unknown') {
    this.recordBusinessMetric('auth_attempts', { result, method }, serviceName);
  }

  /**
   * Record notification sent
   */
  recordNotificationSent(type: string, status: string, serviceName: string = 'unknown') {
    this.recordBusinessMetric('notifications_sent', { type, status }, serviceName);
  }

  /**
   * Record database query
   */
  recordDatabaseQuery(operation: string, table: string, serviceName: string = 'unknown') {
    this.recordBusinessMetric('database_queries', { operation, table }, serviceName);
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(operation: 'get' | 'set' | 'del', result: 'hit' | 'miss' | 'success' | 'error', serviceName: string = 'unknown') {
    this.recordBusinessMetric('cache_operations', { operation, result }, serviceName);
  }

  /**
   * Get all metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clearMetrics() {
    register.clear();
  }

  /**
   * Get metric by name
   */
  getMetric(name: string) {
    return register.getSingleMetric(name);
  }
}

/**
 * Middleware for Express/NestJS to automatically record HTTP metrics
 */
export function createMetricsMiddleware(metricsService: MetricsService, serviceName: string) {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Increment active connections
    metricsService.incrementActiveConnections(serviceName);

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = (Date.now() - startTime) / 1000;
      const route = req.route?.path || req.path || 'unknown';
      
      metricsService.recordHttpRequest(
        req.method,
        route,
        res.statusCode,
        duration,
        serviceName
      );
      
      // Decrement active connections
      metricsService.decrementActiveConnections(serviceName);
      
      originalEnd.apply(this, args);
    };

    next();
  };
}

/**
 * Express route handler for metrics endpoint
 */
export function createMetricsHandler(metricsService: MetricsService) {
  return async (req: any, res: any) => {
    try {
      const metrics = await metricsService.getMetrics();
      res.set('Content-Type', register.contentType);
      res.send(metrics);
    } catch (error) {
      res.status(500).send('Error generating metrics');
    }
  };
}