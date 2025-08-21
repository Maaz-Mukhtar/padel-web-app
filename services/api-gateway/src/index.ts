import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createMetricsMiddleware, createMetricsHandler } from './metrics';

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(morgan('combined'));
app.use(express.json());

// Metrics middleware
app.use(createMetricsMiddleware('api-gateway'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: '1.0.0',
  });
});

// Metrics endpoint
app.get('/metrics', createMetricsHandler());

// Service routes
const services = [
  {
    route: '/api/auth',
    target: `http://localhost:${process.env.AUTH_SERVICE_PORT || 3001}`,
    name: 'Auth Service',
  },
  {
    route: '/api/users',
    target: `http://localhost:${process.env.USER_SERVICE_PORT || 3002}`,
    name: 'User Service',
  },
  {
    route: '/api/bookings',
    target: `http://localhost:${process.env.BOOKING_SERVICE_PORT || 3003}`,
    name: 'Booking Service',
  },
  {
    route: '/api/notifications',
    target: `http://localhost:${process.env.NOTIFICATION_SERVICE_PORT || 3004}`,
    name: 'Notification Service',
  },
];

// Configure proxy middleware for each service
services.forEach(({ route, target, name }) => {
  app.use(
    route,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${route}`]: '',
      },
      on: {
        error: (err: any, _req: any, res: any) => {
          console.error(`Error proxying to ${name} (${target}):`, err.message);
          if (!res.headersSent) {
            res.status(502).json({
              error: 'Service temporarily unavailable',
              service: name,
              message: `Cannot connect to ${name}`,
            });
          }
        },
        proxyReq: (_proxyReq: any, req: any, _res: any) => {
          console.log(
            `[API Gateway] Proxying ${req.method} ${req.url} to ${name} (${target})`
          );
        },
      },
      timeout: 30000, // 30 second timeout
    })
  );
});

// Service status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    gateway: 'healthy',
    services: services.map(service => ({
      name: service.name,
      route: service.route,
      target: service.target,
    })),
    timestamp: new Date().toISOString(),
  });
});

// Catch-all route for undefined endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    available_routes: services.map(s => s.route),
  });
});

// Global error handling middleware
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Gateway Error:', err.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }
);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Service status: http://localhost:${PORT}/api/status`);
  console.log('\n🔗 Available routes:');
  services.forEach(service => {
    console.log(`   ${service.route} → ${service.target} (${service.name})`);
  });
});
