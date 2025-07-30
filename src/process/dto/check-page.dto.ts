import { IsBoolean, IsEnum, IsString, IsUrl, IsUUID } from "class-validator";
import { ProductType } from "../../app.type.js";

export class CheckPageDto {
  @IsUrl()
  url: string;

  @IsString()
  query: string

  @IsEnum(ProductType)
  type: ProductType

  @IsString()
  shopWebsite: string

  @IsUUID()
  webPageId: string

  @IsBoolean()
  shopifySite: boolean
}