import { Module } from '@nestjs/common';
import { OpenaiController } from './openai.controller.js';
import { OpenaiService } from './openai.service.js';


@Module({
  controllers: [OpenaiController],
  providers: [OpenaiService],
  exports: [OpenaiService]
})
export class OpenaiModule { }
