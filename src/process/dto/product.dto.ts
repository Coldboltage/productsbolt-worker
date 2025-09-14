import { IsEnum, IsString, IsUUID } from "class-validator";

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
}

