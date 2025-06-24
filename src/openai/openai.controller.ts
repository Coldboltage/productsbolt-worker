import { Controller } from '@nestjs/common';
import { OpenaiService } from './openai.service.js';

@Controller()
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) { }
}
