import { Module } from '@nestjs/common';
import { UtilsModule } from './utils/utils.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BrowserModule } from './browser/browser.module.js';
import { OpenaiModule } from './openai/openai.module.js';
import { ProcessModule } from './process/process.module.js';
import { EbayModule } from './ebay/ebay.module.js';

@Module({
  imports: [ProcessModule, BrowserModule, OpenaiModule, UtilsModule, EbayModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
