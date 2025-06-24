import { Controller } from '@nestjs/common';
import { BrowserService } from './browser.service.js';

@Controller()
export class BrowserController {
  constructor(private readonly browserService: BrowserService) { }
}
