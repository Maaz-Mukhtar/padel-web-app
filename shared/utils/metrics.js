"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
exports.createMetricsMiddleware = createMetricsMiddleware;
exports.createMetricsHandler = createMetricsHandler;
const common_1 = require("@nestjs/common");
const prom_client_1 = require("prom-client");
let MetricsService = class MetricsService {
    constructor(serviceName = 'unknown') {
        (0, prom_client_1.collectDefaultMetrics)({
            prefix: `${serviceName}_`,
            gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
        });
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code', 'service'],
            buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
        });
        this.httpRequestTotal = new prom_client_1.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code', 'service'],
        });
        this.activeConnections = new prom_client_1.Gauge({
            name: 'http_active_connections',
            help: 'Number of active HTTP connections',
            labelNames: ['service'],
        });
        this.businessMetrics = new Map([
            ['bookings_created', new prom_client_1.Counter({
                    name: 'bookings_created_total',
                    help: 'Total number of bookings created',
                    labelNames: ['venue_id', 'status', 'service'],
                })],
            ['bookings_cancelled', new prom_client_1.Counter({
                    name: 'bookings_cancelled_total',
                    help: 'Total number of bookings cancelled',
                    labelNames: ['venue_id', 'reason', 'service'],
                })],
            ['users_registered', new prom_client_1.Counter({
                    name: 'users_registered_total',
                    help: 'Total number of users registered',
                    labelNames: ['role', 'provider', 'service'],
                })],
            ['auth_attempts', new prom_client_1.Counter({
                    name: 'auth_attempts_total',
                    help: 'Total number of authentication attempts',
                    labelNames: ['result', 'method', 'service'],
                })],
            ['notifications_sent', new prom_client_1.Counter({
                    name: 'notifications_sent_total',
                    help: 'Total number of notifications sent',
                    labelNames: ['type', 'status', 'service'],
                })],
            ['database_queries', new prom_client_1.Counter({
                    name: 'database_queries_total',
                    help: 'Total number of database queries',
                    labelNames: ['operation', 'table', 'service'],
                })],
            ['cache_operations', new prom_client_1.Counter({
                    name: 'cache_operations_total',
                    help: 'Total number of cache operations',
                    labelNames: ['operation', 'result', 'service'],
                })],
        ]);
        prom_client_1.register.registerMetric(this.httpRequestDuration);
        prom_client_1.register.registerMetric(this.httpRequestTotal);
        prom_client_1.register.registerMetric(this.activeConnections);
        this.businessMetrics.forEach(metric => prom_client_1.register.registerMetric(metric));
    }
    recordHttpRequest(method, route, statusCode, duration, serviceName = 'unknown') {
        const labels = {
            method: method.toUpperCase(),
            route,
            status_code: statusCode.toString(),
            service: serviceName,
        };
        this.httpRequestDuration.observe(labels, duration);
        this.httpRequestTotal.inc(labels);
    }
    setActiveConnections(count, serviceName = 'unknown') {
        this.activeConnections.set({ service: serviceName }, count);
    }
    incrementActiveConnections(serviceName = 'unknown') {
        this.activeConnections.inc({ service: serviceName });
    }
    decrementActiveConnections(serviceName = 'unknown') {
        this.activeConnections.dec({ service: serviceName });
    }
    recordBusinessMetric(metricName, labels = {}, serviceName = 'unknown') {
        const metric = this.businessMetrics.get(metricName);
        if (metric) {
            metric.inc({ ...labels, service: serviceName });
        }
    }
    recordBookingCreated(venueId, status, serviceName = 'unknown') {
        this.recordBusinessMetric('bookings_created', { venue_id: venueId, status }, serviceName);
    }
    recordBookingCancelled(venueId, reason, serviceName = 'unknown') {
        this.recordBusinessMetric('bookings_cancelled', { venue_id: venueId, reason }, serviceName);
    }
    recordUserRegistered(role, provider = 'local', serviceName = 'unknown') {
        this.recordBusinessMetric('users_registered', { role, provider }, serviceName);
    }
    recordAuthAttempt(result, method = 'local', serviceName = 'unknown') {
        this.recordBusinessMetric('auth_attempts', { result, method }, serviceName);
    }
    recordNotificationSent(type, status, serviceName = 'unknown') {
        this.recordBusinessMetric('notifications_sent', { type, status }, serviceName);
    }
    recordDatabaseQuery(operation, table, serviceName = 'unknown') {
        this.recordBusinessMetric('database_queries', { operation, table }, serviceName);
    }
    recordCacheOperation(operation, result, serviceName = 'unknown') {
        this.recordBusinessMetric('cache_operations', { operation, result }, serviceName);
    }
    async getMetrics() {
        return prom_client_1.register.metrics();
    }
    clearMetrics() {
        prom_client_1.register.clear();
    }
    getMetric(name) {
        return prom_client_1.register.getSingleMetric(name);
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [String])
], MetricsService);
function createMetricsMiddleware(metricsService, serviceName) {
    return (req, res, next) => {
        const startTime = Date.now();
        metricsService.incrementActiveConnections(serviceName);
        const originalEnd = res.end;
        res.end = function (...args) {
            const duration = (Date.now() - startTime) / 1000;
            const route = req.route?.path || req.path || 'unknown';
            metricsService.recordHttpRequest(req.method, route, res.statusCode, duration, serviceName);
            metricsService.decrementActiveConnections(serviceName);
            originalEnd.apply(this, args);
        };
        next();
    };
}
function createMetricsHandler(metricsService) {
    return async (req, res) => {
        try {
            const metrics = await metricsService.getMetrics();
            res.set('Content-Type', prom_client_1.register.contentType);
            res.send(metrics);
        }
        catch (error) {
            res.status(500).send('Error generating metrics');
        }
    };
}
//# sourceMappingURL=metrics.js.map