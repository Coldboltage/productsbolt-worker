import { IsBoolean, IsString } from "class-validator";

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
}