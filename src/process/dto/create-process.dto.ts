import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUrl, IsUUID, ValidateNested } from 'class-validator';
import { ProductType } from '../../app.type.js';
import { UniqueShopType } from '../entities/process.entity.js';
import { EbayProductDetailDto } from './ebay-product-detail.dto.js';
import { Type } from 'class-transformer';
import { SitemapDto } from './sitemap-dto.js';


export class CreateProcessDto {
  @IsUrl()
  sitemap: string;

  @IsUrl()
  url: string;

  @IsString()
  category: string;

  @IsString()
  name: string;

  @IsUUID()
  shopProductId: string

  @IsString()
  shopWebsite: string;

  @IsEnum(ProductType)
  type: ProductType;

  @IsString()
  context: string;

  @IsNumber()
  crawlAmount: number;

  @IsUUID()
  productId: string;

  @IsUUID()
  shopId: string;

  @IsBoolean()
  shopifySite: boolean

  @IsEnum(UniqueShopType)
  shopType: UniqueShopType

  @IsArray()
  @IsString({ each: true })
  sitemapUrls: string[];

  @ValidateNested()
  @Type(() => EbayProductDetailDto)
  @IsOptional()
  ebayProductDetail?: EbayProductDetailDto

  @ValidateNested()
  @Type(() => SitemapDto)
  sitemapEntity: SitemapDto
}
