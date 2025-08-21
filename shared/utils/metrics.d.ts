export declare class MetricsService {
    private readonly httpRequestDuration;
    private readonly httpRequestTotal;
    private readonly activeConnections;
    private readonly businessMetrics;
    constructor(serviceName?: string);
    recordHttpRequest(method: string, route: string, statusCode: number, duration: number, serviceName?: string): void;
    setActiveConnections(count: number, serviceName?: string): void;
    incrementActiveConnections(serviceName?: string): void;
    decrementActiveConnections(serviceName?: string): void;
    recordBusinessMetric(metricName: string, labels?: Record<string, string>, serviceName?: string): void;
    recordBookingCreated(venueId: string, status: string, serviceName?: string): void;
    recordBookingCancelled(venueId: string, reason: string, serviceName?: string): void;
    recordUserRegistered(role: string, provider?: string, serviceName?: string): void;
    recordAuthAttempt(result: 'success' | 'failure', method?: string, serviceName?: string): void;
    recordNotificationSent(type: string, status: string, serviceName?: string): void;
    recordDatabaseQuery(operation: string, table: string, serviceName?: string): void;
    recordCacheOperation(operation: 'get' | 'set' | 'del', result: 'hit' | 'miss' | 'success' | 'error', serviceName?: string): void;
    getMetrics(): Promise<string>;
    clearMetrics(): void;
    getMetric(name: string): import("prom-client").Metric<string> | undefined;
}
export declare function createMetricsMiddleware(metricsService: MetricsService, serviceName: string): (req: any, res: any, next: any) => void;
export declare function createMetricsHandler(metricsService: MetricsService): (req: any, res: any) => Promise<void>;
//# sourceMappingURL=metrics.d.ts.map