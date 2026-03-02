import { ProductType } from 'src/app.type';
import { ShopifyVariant } from 'src/utils/utils.type';

export interface VariantDto {
  query: string;
  context: string;
  variants: ShopifyVariant[];
  type: ProductType;
}
