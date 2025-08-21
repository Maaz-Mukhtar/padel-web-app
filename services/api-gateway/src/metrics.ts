import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Initialize default metrics collection
collectDefaultMetrics({
  prefix: 'api_gateway_',
});

// HTTP Request Duration Histogram
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

// HTTP Request Counter
const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
});

// Active Connections Gauge
const activeConnections = new Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
  labelNames: ['service'],
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);

export const metricsService = {
  recordHttpRequest: (
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    serviceName: string = 'api-gateway'
  ) => {
    const labels = {
      method: method.toUpperCase(),
      route,
      status_code: statusCode.toString(),
      service: serviceName,
    };
    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  },

  incrementActiveConnections: (serviceName: string = 'api-gateway') => {
    activeConnections.inc({ service: serviceName });
  },

  decrementActiveConnections: (serviceName: string = 'api-gateway') => {
    activeConnections.dec({ service: serviceName });
  },

  getMetrics: async (): Promise<string> => {
    return register.metrics();
  }
};

export function createMetricsMiddleware(serviceName: string) {
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

export function createMetricsHandler() {
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