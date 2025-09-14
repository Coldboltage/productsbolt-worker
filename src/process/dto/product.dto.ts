import { IsEnum, IsString, IsUUID, ValidateNested } from "class-validator";
import { Type } from 'class-transformer';
import { EbayStatDto } from "./ebayStat.dto.js";

export enum ProductType {
  PACK = 'PACK',
  BOX = 'BOX',
  BUNDLE = 'BUNDLE',
  ETB = 'ETB',
  COLLECTION = 'COLLECTION',
}

export class ProductDto {
  @IsUUID('4')
  id: string

  @IsString()
  name: string

  @IsEnum(ProductType)
  type: ProductType

  @IsString()
  context: string

  @ValidateNested()
  @Type(() => EbayStatDto)
  ebayStat: EbayStatDto
}

