import { PartialType } from '@nestjs/mapped-types';
import { CreateLmStudioDto } from './create-lm-studio.dto.js';

export class UpdateLmStudioDto extends PartialType(CreateLmStudioDto) {
  id: number;
}
