import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  MetricsService,
  createMetricsMiddleware,
  createMetricsHandler,
} from '../../../shared/utils/metrics';
import {
  CustomLogger,
  createLoggingMiddleware,
} from '../../../shared/utils/logger';

async function bootstrap() {
  const serviceName = 'user-service';

  // Initialize monitoring and logging
  const metricsService = new MetricsService(serviceName);
  const logger = new CustomLogger(serviceName, 'Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: logger,
  });

  // Add correlation ID and logging middleware
  app.use(createLoggingMiddleware(logger));

  // Add metrics middleware
  app.use(createMetricsMiddleware(metricsService, serviceName));

  // Add metrics endpoint
  app.use('/metrics', createMetricsHandler(metricsService));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URLS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Padel Platform - User Management Service')
    .setDescription(
      "User profile and social features API for Pakistan's premier padel booking platform"
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('profiles', 'User profile management and customization')
    .addTag('social', 'User connections and social features')
    .addTag('search', 'User search and discovery')
    .addTag('health', 'Service health checks')
    .addTag('metrics', 'Prometheus metrics endpoint')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.USER_SERVICE_PORT || 3002;
  await app.listen(port);

  logger.log(`🚀 User Management Service running on port ${port}`);
  logger.log(`📖 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`📊 Metrics endpoint: http://localhost:${port}/metrics`);
}

bootstrap().catch(err => {
  console.error('Failed to start User Management Service:', err);
  process.exit(1);
});
