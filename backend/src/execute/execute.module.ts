import { Module } from '@nestjs/common';
import { ExecuteController } from './execute.controller.js';
import { ExecuteService } from './execute.service.js';

@Module({
  controllers: [ExecuteController],
  providers: [ExecuteService],
})
export class ExecuteModule {}
