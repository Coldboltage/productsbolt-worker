import { Module, OnModuleInit } from '@nestjs/common';
import { UtilsModule } from './utils/utils.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BrowserModule } from './browser/browser.module.js';
import { OpenaiModule } from './openai/openai.module.js';
import { ProcessModule } from './process/process.module.js';
import { EbayModule } from './ebay/ebay.module.js';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module.js';
import { LmStudioModule } from './lm-studio/lm-studio.module.js';
import { ApiModule } from './api/api.module';
import { SentryModule } from '@sentry/nestjs/setup';
import * as Sentry from '@sentry/nestjs';

@Module({
  imports: [
    SentryModule.forRoot(),
    ProcessModule,
    BrowserModule,
    OpenaiModule,
    UtilsModule,
    EbayModule,
    RabbitmqModule,
    LmStudioModule,
    ApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    if (process.env.SENTRY_BOOT_CHECK === 'false') return;
    const id = Sentry.captureException('Test Error', {
      tags: { check: 'boot' },
    });
    console.log(`sentry boot check sent: ${id}`);
    throw new Error('worker sentry boot check');
  }
}
