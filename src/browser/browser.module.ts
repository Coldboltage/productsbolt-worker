import { Module } from '@nestjs/common';
import { UtilsModule } from '../utils/utils.module.js';
import { BrowserController } from './browser.controller.js';
import { BrowserService } from './browser.service.js';


@Module({
  imports: [UtilsModule],
  controllers: [BrowserController],
  providers: [BrowserService],
  exports: [BrowserService]
})
export class BrowserModule { }
