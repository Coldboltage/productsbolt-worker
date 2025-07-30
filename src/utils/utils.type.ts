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
