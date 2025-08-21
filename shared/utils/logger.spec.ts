import { CustomLogger } from './logger';

// Mock winston
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      errors: jest.fn(),
      json: jest.fn(),
      colorize: jest.fn(),
      simple: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
    },
  };
});

import * as winston from 'winston';

describe('CustomLogger', () => {
  let customLogger: CustomLogger;
  let mockWinstonLogger: jest.Mocked<winston.Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockWinstonLogger = winston.createLogger() as jest.Mocked<winston.Logger>;
    customLogger = new CustomLogger('test-service', 'TestContext');
  });

  describe('constructor', () => {
    it('should create winston logger with correct configuration', () => {
      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: process.env.LOG_LEVEL || 'info',
          defaultMeta: expect.objectContaining({
            service: 'test-service',
            environment: process.env.NODE_ENV,
          }),
        })
      );
    });

    it('should use default log level if not specified in environment', () => {
      const originalLogLevel = process.env.LOG_LEVEL;
      delete process.env.LOG_LEVEL;

      new CustomLogger('test-service', 'TestContext');

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
        })
      );

      process.env.LOG_LEVEL = originalLogLevel;
    });
  });

  describe('log', () => {
    it('should log info message with context', () => {
      const message = 'Test info message';
      const context = 'TestContext';

      customLogger.log(message, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, { context });
    });

    it('should log info message without context', () => {
      const message = 'Test info message without context';

      customLogger.log(message);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, { context: undefined });
    });
  });

  describe('error', () => {
    it('should log error message with trace and context', () => {
      const message = 'Test error message';
      const trace = 'Error stack trace';
      const context = 'ErrorContext';

      customLogger.error(message, trace, context);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, { 
        trace, 
        context 
      });
    });

    it('should log error message without trace and context', () => {
      const message = 'Test error message';

      customLogger.error(message);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, { 
        trace: undefined, 
        context: undefined 
      });
    });
  });

  describe('warn', () => {
    it('should log warning message with context', () => {
      const message = 'Test warning message';
      const context = 'WarnContext';

      customLogger.warn(message, context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(message, { context });
    });
  });

  describe('debug', () => {
    it('should log debug message with context', () => {
      const message = 'Test debug message';
      const context = 'DebugContext';

      customLogger.debug(message, context);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(message, { context });
    });
  });

  describe('verbose', () => {
    it('should log verbose message with context', () => {
      const message = 'Test verbose message';
      const context = 'VerboseContext';

      customLogger.verbose(message, context);

      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith(message, { context });
    });
  });

  describe('logRequest', () => {
    it('should log request with correlation ID and user info', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test',
        headers: {
          'x-correlation-id': 'correlation-123',
        },
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      const metadata = {
        additionalInfo: 'test info',
      };

      customLogger.logRequest(mockReq as any, metadata);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'HTTP Request',
        expect.objectContaining({
          method: 'GET',
          path: '/api/test',
          correlationId: 'correlation-123',
          userId: 'user-123',
          additionalInfo: 'test info',
        })
      );
    });

    it('should log request without user info when not authenticated', () => {
      const mockReq = {
        method: 'POST',
        path: '/api/public',
        headers: {},
      };

      customLogger.logRequest(mockReq as any);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'HTTP Request',
        expect.objectContaining({
          method: 'POST',
          path: '/api/public',
          correlationId: undefined,
          userId: undefined,
        })
      );
    });
  });

  describe('logResponse', () => {
    it('should log response with status code and duration', () => {
      const mockRes = {
        statusCode: 200,
      };

      const startTime = Date.now() - 100; // 100ms ago
      const metadata = {
        requestId: 'req-123',
      };

      customLogger.logResponse(mockRes as any, startTime, metadata);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'HTTP Response',
        expect.objectContaining({
          statusCode: 200,
          duration: expect.any(Number),
          requestId: 'req-123',
        })
      );
    });
  });

  describe('logBusinessEvent', () => {
    it('should log business event with event type and data', () => {
      const eventType = 'USER_REGISTERED';
      const eventData = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'player',
      };
      const context = 'AuthService';

      customLogger.logBusinessEvent(eventType, eventData, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Business Event: ${eventType}`,
        expect.objectContaining({
          eventType,
          eventData,
          context,
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle winston logger errors gracefully', () => {
      mockWinstonLogger.info.mockImplementation(() => {
        throw new Error('Winston error');
      });

      // Should not throw error
      expect(() => {
        customLogger.log('test message');
      }).not.toThrow();
    });
  });

  describe('correlation ID handling', () => {
    it('should extract correlation ID from different header formats', () => {
      const testCases = [
        { header: 'x-correlation-id', value: 'corr-123' },
        { header: 'X-Correlation-ID', value: 'CORR-456' },
        { header: 'correlation-id', value: 'corr-789' },
      ];

      testCases.forEach(({ header, value }) => {
        const mockReq = {
          method: 'GET',
          path: '/test',
          headers: {
            [header]: value,
          },
        };

        customLogger.logRequest(mockReq as any);

        expect(mockWinstonLogger.info).toHaveBeenCalledWith(
          'HTTP Request',
          expect.objectContaining({
            correlationId: value,
          })
        );
      });
    });
  });
});