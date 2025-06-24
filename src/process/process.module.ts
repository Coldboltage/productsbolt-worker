import { Module } from '@nestjs/common';
import { BrowserModule } from '../browser/browser.module.js';
import { OpenaiModule } from '../openai/openai.module.js';
import { UtilsModule } from '../utils/utils.module.js';
import { ProcessController } from './process.controller.js';
import { ProcessService } from './process.service.js';


@Module({
  imports: [UtilsModule, BrowserModule, OpenaiModule],
  controllers: [ProcessController],
  providers: [ProcessService],
})
export class ProcessModule { }
