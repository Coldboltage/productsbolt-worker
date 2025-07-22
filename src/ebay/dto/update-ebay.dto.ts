import { PartialType } from '@nestjs/mapped-types';
import { CreateEbayDto } from './create-ebay.dto.js';

export class UpdateEbayDto extends PartialType(CreateEbayDto) {
  id: number;
}
