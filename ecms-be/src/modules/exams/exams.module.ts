import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { ExamsService } from './exams.service.js';
import { ExamsController } from './exams.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [ExamsService],
  controllers: [ExamsController],
  exports: [ExamsService],
})
export class ExamsModule {}
