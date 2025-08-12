import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsString, ValidateNested } from "class-validator";
import { SitemapDto } from "./sitemap-dto.js";

export class ShopDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  website: string;

  @IsString()
  sitemap: string;

  @IsString()
  category: string;

  @IsString()
  protocol: string;

  @IsBoolean()
  active: true;

  @IsString()
  etag: string

  @IsNumber()
  etagCount: number

  @ValidateNested()
  @Type(() => SitemapDto)
  sitemapEntity: SitemapDto
}