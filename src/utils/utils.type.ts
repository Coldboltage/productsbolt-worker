export interface ShopifyProduct {
  id: number;
  title: string;
  description: string;
  published_at: Date;
  created_at: Date;
  vendor: string;
  type: string;
  price: number;
  price_min: number;
  price_max: number;
  available: boolean;
  variants: ShopifyVariant[];
  featured_image: string | null;
}

export interface ShopifyShopMeta {
  id: number;
  name: string;
  city: string;
  province: string;
  country: string; // ISO 2-letter (e.g. "GB")
  currency: string; // ISO 3-letter (e.g. "GBP")
  domain: string;
  url: string;
  myshopify_domain: string;
  description: string;

  ships_to_countries: string[]; // ISO 2-letter codes or "*"

  money_format: string; // e.g. "£{{amount}}"

  published_collections_count: number;
  published_products_count: number;

  shopify_pay_enabled_card_brands: string[];

  offers_shop_pay_installments: boolean;
}

export interface ShopifyVariant {
  id: number;
  title: string;
  available: boolean;
  name: string;
  price: number;
  featured_image: null | string | ShopVariantFeatureImageObject;
}

export interface ShopVariantFeatureImageObject {
  src: string;
}

export interface ShopifyProductCollections {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  vendor: string;
  product_type: string;
}

export interface ShopifyProductCollectionsFullCall {
  products: ShopifyProductCollections[];
}

export interface Variant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  compare_at_price: string;
  fulfillment_service: string;
  inventory_management: string;
  option1: string;
  option2: string | null;
  option3: string | null;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string;
  grams: number;
  image_id: number | null;
  weight: number;
  weight_unit: string;
  requires_shipping: boolean;
  price_currency: string;
  compare_at_price_currency: string;
}

export interface Option {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

export interface ProductImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string | null;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
}
