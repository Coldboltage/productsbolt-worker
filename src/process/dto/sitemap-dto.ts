import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";

export class SitemapDto {
  @IsString()
  id: string;

  @IsString()
  sitemap: string;

  @IsArray()
  @IsString()
  sitemapUrls: string[];

  @IsBoolean()
  isShopifySite: boolean;

  @IsBoolean()
  errored: boolean;

  @IsBoolean()
  fast: boolean;

  @IsOptional()
  @IsArray()
  @IsString()
  additionalSitemaps: string[];
}