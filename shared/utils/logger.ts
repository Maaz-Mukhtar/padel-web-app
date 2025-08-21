import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import { Request } from 'express';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  service?: string;
  method?: string;
  path?: string;
  userAgent?: string;
  ip?: string;
  requestId?: string;
  sessionId?: string;
  operation?: string;
  duration?: number;
  statusCode?: number;
  error?: any;
  metadata?: Record<string, any>;
}

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;
  private serviceName: string;
  private context: string;

  constructor(
    serviceName: string = 'unknown',
    context: string = 'Application'
  ) {
    this.serviceName = serviceName;
    this.context = context;

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(info => {
          const logObject = {
            timestamp: info.timestamp,
            level: info.level.toUpperCase(),
            service: this.serviceName,
            context: this.context,
            message: info.message,
            ...info.metadata,
          };

          // Add stack trace for errors
          if (info.stack) {
            logObject.stack = info.stack;
          }

          return JSON.stringify(logObject);
        })
      ),
      defaultMeta: {
        service: this.serviceName,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
        pod: process.env.HOSTNAME || 'localhost',
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({
              format: 'HH:mm:ss.SSS',
            }),
            winston.format.printf(info => {
              const contextStr = this.context ? `[${this.context}] ` : '';
              const correlationStr = info.correlationId
                ? `[${info.correlationId}] `
                : '';
              return `${info.timestamp} ${info.level} ${contextStr}${correlationStr}${info.message}`;
            })
          ),
        }),
      ],
    });

    // Add file transport for production
    if (process.env.NODE_ENV === 'production') {
      this.logger.add(
        new winston.transports.File({
          filename: '/var/log/app/error.log',
          level: 'error',
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 5,
          tailable: true,
        })
      );

      this.logger.add(
        new winston.transports.File({
          filename: '/var/log/app/combined.log',
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 10,
          tailable: true,
        })
      );
    }
  }

  log(message: string, context?: string | LogContext, metadata?: LogContext) {
    this.logWithLevel('info', message, context, metadata);
  }

  error(
    message: string,
    trace?: string | Error,
    context?: string | LogContext,
    metadata?: LogContext
  ) {
    const errorMetadata = this.prepareMetadata(context, metadata);

    if (trace instanceof Error) {
      errorMetadata.error = {
        name: trace.name,
        message: trace.message,
        stack: trace.stack,
      };
    } else if (trace) {
      errorMetadata.stack = trace;
    }

    this.logger.error(message, { metadata: errorMetadata });
  }

  warn(message: string, context?: string | LogContext, metadata?: LogContext) {
    this.logWithLevel('warn', message, context, metadata);
  }

  debug(message: string, context?: string | LogContext, metadata?: LogContext) {
    this.logWithLevel('debug', message, context, metadata);
  }

  verbose(
    message: string,
    context?: string | LogContext,
    metadata?: LogContext
  ) {
    this.logWithLevel('verbose', message, context, metadata);
  }

  private logWithLevel(
    level: string,
    message: string,
    context?: string | LogContext,
    metadata?: LogContext
  ) {
    const logMetadata = this.prepareMetadata(context, metadata);
    this.logger.log(level, message, { metadata: logMetadata });
  }

  private prepareMetadata(
    context?: string | LogContext,
    metadata?: LogContext
  ): LogContext {
    let logMetadata: LogContext = {};

    if (typeof context === 'string') {
      logMetadata.context = context;
    } else if (context) {
      logMetadata = { ...context };
    }

    if (metadata) {
      logMetadata = { ...logMetadata, ...metadata };
    }

    return logMetadata;
  }

  /**
   * Log HTTP request
   */
  logRequest(req: Request, metadata?: LogContext) {
    const requestMetadata: LogContext = {
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      correlationId: req.headers['x-correlation-id'] as string,
      requestId: req.headers['x-request-id'] as string,
      userId: (req as any).user?.id,
      ...metadata,
    };

    this.log(`${req.method} ${req.path}`, requestMetadata);
  }

  /**
   * Log HTTP response
   */
  logResponse(
    req: Request,
    statusCode: number,
    duration: number,
    metadata?: LogContext
  ) {
    const responseMetadata: LogContext = {
      method: req.method,
      path: req.path,
      statusCode,
      duration,
      correlationId: req.headers['x-correlation-id'] as string,
      requestId: req.headers['x-request-id'] as string,
      userId: (req as any).user?.id,
      ...metadata,
    };

    const level = statusCode >= 400 ? 'warn' : 'info';
    this.logWithLevel(
      level,
      `${req.method} ${req.path} ${statusCode} ${duration}ms`,
      responseMetadata
    );
  }

  /**
   * Log business event
   */
  logBusinessEvent(
    event: string,
    data?: Record<string, any>,
    context?: LogContext
  ) {
    const eventMetadata: LogContext = {
      event,
      ...data,
      ...context,
    };

    this.log(`Business Event: ${event}`, eventMetadata);
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    duration?: number,
    context?: LogContext
  ) {
    const dbMetadata: LogContext = {
      operation: 'database',
      dbOperation: operation,
      table,
      duration,
      ...context,
    };

    this.debug(
      `Database ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`,
      dbMetadata
    );
  }

  /**
   * Log cache operation
   */
  logCacheOperation(
    operation: string,
    key: string,
    hit: boolean,
    duration?: number,
    context?: LogContext
  ) {
    const cacheMetadata: LogContext = {
      operation: 'cache',
      cacheOperation: operation,
      key,
      hit,
      duration,
      ...context,
    };

    this.debug(
      `Cache ${operation} for ${key} (${hit ? 'HIT' : 'MISS'})${duration ? ` (${duration}ms)` : ''}`,
      cacheMetadata
    );
  }

  /**
   * Log authentication event
   */
  logAuthEvent(
    event: 'login' | 'logout' | 'register' | 'failed_login',
    userId?: string,
    context?: LogContext
  ) {
    const authMetadata: LogContext = {
      operation: 'authentication',
      authEvent: event,
      userId,
      ...context,
    };

    this.log(
      `Auth Event: ${event}${userId ? ` for user ${userId}` : ''}`,
      authMetadata
    );
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: LogContext
  ) {
    const securityMetadata: LogContext = {
      operation: 'security',
      securityEvent: event,
      severity,
      ...context,
    };

    const level =
      severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
    this.logWithLevel(level, `Security Event: ${event}`, securityMetadata);
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: LogContext): CustomLogger {
    const childLogger = new CustomLogger(this.serviceName, this.context);
    // Add the additional context to all logs from this child logger
    childLogger.logger = childLogger.logger.child(additionalContext);
    return childLogger;
  }

  /**
   * Set context for this logger instance
   */
  setContext(context: string) {
    this.context = context;
  }
}

/**
 * Express middleware for logging requests/responses
 */
export function createLoggingMiddleware(logger: CustomLogger) {
  return (req: Request, res: any, next: any) => {
    const startTime = Date.now();

    // Generate correlation ID if not present
    if (!req.headers['x-correlation-id']) {
      req.headers['x-correlation-id'] = generateCorrelationId();
    }

    // Log incoming request
    logger.logRequest(req);

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (...args: any[]) {
      const duration = Date.now() - startTime;
      logger.logResponse(req, res.statusCode, duration);
      originalEnd.apply(this, args);
    };

    next();
  };
}

/**
 * Generate correlation ID
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Error logging utility
 */
export function logError(
  logger: CustomLogger,
  error: Error,
  context?: LogContext
) {
  logger.error(error.message, error, {
    operation: 'error_handler',
    errorName: error.name,
    ...context,
  });
}

/**
 * Performance logging utility
 */
export function logPerformance(
  logger: CustomLogger,
  operation: string,
  startTime: number,
  context?: LogContext
) {
  const duration = Date.now() - startTime;
  logger.debug(`Performance: ${operation} completed in ${duration}ms`, {
    operation: 'performance',
    performanceOperation: operation,
    duration,
    ...context,
  });
}
