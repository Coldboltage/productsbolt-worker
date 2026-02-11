import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from 'src/app.type';

export class LmStudioCheckProductDto {
  @ApiProperty({
    example:
      'Magic: The Gathering | Avatar: The Last Airbender Collector Booster',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Full page text content…' })
  @IsString()
  @IsNotEmpty()
  allText!: string;

  @ApiProperty({ example: 'avatar collector booster box' })
  @IsString()
  @IsNotEmpty()
  query!: string;

  @ApiProperty({ enum: ProductType })
  @IsEnum(ProductType)
  type!: ProductType;

  @ApiProperty({ example: 'fast' })
  @IsString()
  @IsNotEmpty()
  mode!: string;

  @ApiProperty({ example: 'https://example.com/products/abc' })
  @IsUrl({ require_protocol: true })
  url!: string;

  @ApiProperty({ example: 'b1946ac92492d2347c6235b4d2611184' })
  @IsString()
  @IsNotEmpty()
  hash!: string;

  @ApiProperty({ example: 42, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  count!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  shopifySite!: boolean;

  @ApiProperty({ example: 'https://shop.example.com' })
  @IsString()
  @IsNotEmpty()
  shopWebsite!: string;

  @ApiProperty({ example: '9f2c3c0f-3b0c-4e9e-a1a9-4d9f8c4c1c9a' })
  @IsString()
  @IsNotEmpty()
  webPageId!: string;
}
