import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from '../../../../../shared/utils/metrics';

@Module({
  controllers: [MetricsController],
  providers: [
    {
      provide: MetricsService,
      useFactory: () => new MetricsService('user-service'),
    },
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
