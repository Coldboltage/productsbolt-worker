import { IsArray, IsEnum, IsNumber, IsString, IsUrl, IsUUID } from 'class-validator';
import { ProductType } from '../../app.type.js';

export class CreateProcessDto {
  @IsUrl()
  sitemap: string;

  @IsUrl()
  url: string;

  @IsString()
  category: string;

  @IsString()
  name: string;

  @IsString()
  context: string;

  @IsString()
  shopWebsite: string

  @IsEnum(ProductType)
  type: ProductType;

  @IsNumber()
  crawlAmount: number;

  @IsUUID()
  productId: string;

  @IsUUID()
  shopId: string;


  @IsArray()
  @IsString({ each: true })
  sitemapUrls: string[]
}
