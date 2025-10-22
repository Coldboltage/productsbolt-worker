import { IsArray, IsJSON, IsString, IsUUID } from 'class-validator';

export class ProductListingsCheckDto {
  @IsArray()
  @IsString({ each: true })
  urls: string[];

  @IsArray()
  @IsString({ each: true })
  existingUrls: string[];

  @IsJSON()
  selectors: {
    listItemNameSelector: string;
    listItemHrefSelector: string;
    priceSelector: string;
    listSelector: string;
  };

  @IsUUID()
  shopId: string;

  @IsString()
  urlStructure: string;
}
