import { IsUUID, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductDto } from './product.dto.js';

export class EbayStatDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  averagePrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  minActivePrice?: number;

  @IsOptional()
  @IsNumber()
  jitPrice?: number;

  @IsOptional()
  @IsNumber()
  clearPrice?: number;

  @IsOptional()
  @IsNumber()
  maximisedPrice?: number;
}