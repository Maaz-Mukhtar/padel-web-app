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

  describe('getHello', () => {
    it('should return notification service greeting', () => {
      const result = appService.getHello();

      expect(result).toBe('Hello from Notification Service!');
    });
  });

  describe('getHealth', () => {
    it('should return service health status', () => {
      const result = appService.getHealth();

      expect(result).toEqual({
        status: 'healthy',
        service: 'notification-service',
        timestamp: expect.any(String),
        version: '1.0.0',
        queues: {
          email: 'connected',
          sms: 'connected',
          whatsapp: 'pending',
        },
      });
    });
  });

  describe('validateEmailTemplate', () => {
    it('should validate correct email template', () => {
      const template = {
        subject: 'Booking Confirmation',
        body: 'Your booking for {{venue}} on {{date}} is confirmed.',
        variables: ['venue', 'date'],
      };

      const result = appService.validateEmailTemplate(template);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const template = {
        body: 'Your booking is confirmed.',
        // missing subject
      };

      const result = appService.validateEmailTemplate(template);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Subject is required');
    });

    it('should detect unused variables in template', () => {
      const template = {
        subject: 'Booking Confirmation',
        body: 'Your booking is confirmed.',
        variables: ['venue', 'date'], // variables defined but not used
      };

      const result = appService.validateEmailTemplate(template);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unused variables: venue, date');
    });
  });

  describe('formatNotificationMessage', () => {
    it('should replace template variables with actual values', () => {
      const template =
        'Hello {{name}}, your booking at {{venue}} on {{date}} is confirmed.';
      const variables = {
        name: 'John Doe',
        venue: 'Karachi Padel Club',
        date: '2023-12-25',
      };

      const result = appService.formatNotificationMessage(template, variables);

      expect(result).toBe(
        'Hello John Doe, your booking at Karachi Padel Club on 2023-12-25 is confirmed.'
      );
    });

    it('should handle missing variables gracefully', () => {
      const template =
        'Hello {{name}}, your booking at {{venue}} is confirmed.';
      const variables = {
        name: 'John Doe',
        // venue is missing
      };

      const result = appService.formatNotificationMessage(template, variables);

      expect(result).toBe(
        'Hello John Doe, your booking at {{venue}} is confirmed.'
      );
    });

    it('should handle empty template', () => {
      const result = appService.formatNotificationMessage('', {});

      expect(result).toBe('');
    });
  });

  describe('generateNotificationId', () => {
    it('should generate unique notification IDs', () => {
      const id1 = appService.generateNotificationId('email');
      const id2 = appService.generateNotificationId('email');

      expect(id1).toMatch(/^EMAIL-\d{13}-[A-Z0-9]{8}$/);
      expect(id2).toMatch(/^EMAIL-\d{13}-[A-Z0-9]{8}$/);
      expect(id1).not.toBe(id2);
    });

    it('should include notification type in ID', () => {
      const emailId = appService.generateNotificationId('email');
      const smsId = appService.generateNotificationId('sms');
      const whatsappId = appService.generateNotificationId('whatsapp');

      expect(emailId).toStartWith('EMAIL-');
      expect(smsId).toStartWith('SMS-');
      expect(whatsappId).toStartWith('WHATSAPP-');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate Pakistani phone numbers', () => {
      const validNumbers = ['+923001234567', '+923331234567', '+923451234567'];

      validNumbers.forEach(number => {
        const result = appService.validatePhoneNumber(number);
        expect(result).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidNumbers = [
        '123456789',
        '+1234567890',
        '+923001234', // too short
        '+9230012345678', // too long
        'invalid-number',
      ];

      invalidNumbers.forEach(number => {
        const result = appService.validatePhoneNumber(number);
        expect(result).toBe(false);
      });
    });
  });

  describe('getNotificationPreferences', () => {
    it('should return default notification preferences', () => {
      const preferences = appService.getNotificationPreferences();

      expect(preferences).toEqual({
        email: true,
        sms: true,
        whatsapp: false,
        marketing: false,
        bookingReminders: true,
        paymentNotifications: true,
      });
    });
  });
});
