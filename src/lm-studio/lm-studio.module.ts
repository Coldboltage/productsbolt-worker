import { Module } from '@nestjs/common';
import { LmStudioService } from './lm-studio.service';
import { LmStudioController } from './lm-studio.controller';
import { OpenaiModule } from '../openai/openai.module';
import { UtilsModule } from 'src/utils/utils.module';

@Module({
  imports: [OpenaiModule, UtilsModule],
  controllers: [LmStudioController],
  providers: [LmStudioService],
  exports: [LmStudioService],
})
export class LmStudioModule {}
