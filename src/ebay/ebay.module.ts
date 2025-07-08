import { Module } from '@nestjs/common';
import { EbayController } from './ebay.controller.js';
import { EbayService } from './ebay.service.js';

@Module({
  controllers: [EbayController],
  providers: [EbayService],
  exports: [EbayService]
})
export class EbayModule {}
