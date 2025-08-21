import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    appService = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getServiceInfo', () => {
    it('should return booking service info', () => {
      const result = appService.getServiceInfo();

      expect(result).toHaveProperty('service', 'Booking Service');
      expect(result).toHaveProperty('version', '1.0.0');
    });
  });

  describe('getHealth', () => {
    it('should return service health status', () => {
      const result = appService.getHealth();

      expect(result).toEqual({
        status: 'healthy',
        service: 'booking-service',
        timestamp: expect.any(String),
        version: '1.0.0',
      });
    });

    it('should return current timestamp in health check', () => {
      const beforeCall = new Date().toISOString();
      const result = appService.getHealth();
      const afterCall = new Date().toISOString();

      expect(result.timestamp >= beforeCall).toBe(true);
      expect(result.timestamp <= afterCall).toBe(true);
    });
  });

  describe('validateBusinessHours', () => {
    it('should validate booking time within business hours', () => {
      const validTime = new Date();
      validTime.setHours(10, 0, 0, 0); // 10:00 AM

      const result = appService.validateBusinessHours(validTime);

      expect(result).toBe(true);
    });

    it('should reject booking time outside business hours', () => {
      const invalidTime = new Date();
      invalidTime.setHours(23, 0, 0, 0); // 11:00 PM

      const result = appService.validateBusinessHours(invalidTime);

      expect(result).toBe(false);
    });
  });

  describe('calculateBookingDuration', () => {
    it('should calculate duration between start and end times', () => {
      const startTime = new Date('2023-01-01T10:00:00Z');
      const endTime = new Date('2023-01-01T11:30:00Z');

      const duration = appService.calculateBookingDuration(startTime, endTime);

      expect(duration).toBe(90); // 1.5 hours = 90 minutes
    });

    it('should handle same start and end times', () => {
      const time = new Date('2023-01-01T10:00:00Z');

      const duration = appService.calculateBookingDuration(time, time);

      expect(duration).toBe(0);
    });
  });

  describe('generateBookingReference', () => {
    it('should generate unique booking reference', () => {
      const ref1 = appService.generateBookingReference();
      const ref2 = appService.generateBookingReference();

      expect(ref1).toMatch(/^BK-\d{8}-[A-Z0-9]{6}$/);
      expect(ref2).toMatch(/^BK-\d{8}-[A-Z0-9]{6}$/);
      expect(ref1).not.toBe(ref2);
    });

    it('should include current date in reference', () => {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const reference = appService.generateBookingReference();

      expect(reference).toContain(today);
    });
  });
});
