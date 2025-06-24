import { PartialType } from '@nestjs/mapped-types';
import { CreateProcessDto } from './create-process.dto.js';

export class UpdateProcessDto extends PartialType(CreateProcessDto) {
  id: number;
}
