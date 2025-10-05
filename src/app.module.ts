import { Module } from '@nestjs/common';
import { UtilsModule } from './utils/utils.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BrowserModule } from './browser/browser.module.js';
import { OpenaiModule } from './openai/openai.module.js';
import { ProcessModule } from './process/process.module.js';
import { EbayModule } from './ebay/ebay.module.js';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module.js';
import { LmStudioModule } from './lm-studio/lm-studio.module.js';

@Module({
  imports: [
    ProcessModule,
    BrowserModule,
    OpenaiModule,
    UtilsModule,
    EbayModule,
    RabbitmqModule,
    LmStudioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
