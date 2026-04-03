import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { EmailVerificationConsumer } from './email-verification.consumer';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), InfrastructureModule],
  providers: [EmailVerificationConsumer],
})
export class WorkerModule {}
