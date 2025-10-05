import { Module } from '@nestjs/common';
import { LmStudioService } from './lm-studio.service.js';
import { LmStudioController } from './lm-studio.controller.js';
import { OpenaiModule } from '../openai/openai.module.js';

@Module({
  imports: [OpenaiModule],
  controllers: [LmStudioController],
  providers: [LmStudioService],
  exports: [LmStudioService],
})
export class LmStudioModule {}
