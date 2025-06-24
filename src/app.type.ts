export interface Product {
  name: string;
  type: ProductType;
}

export enum ProductType {
  PACK = 'PACK',
  BOX = 'BOX',
  BUNDLE = "BUNDLE",
  ETB = "ETB",
  COLLECTION = "COLLECTION"
}

export interface ParsedLinks {
  url: string;
  score: number;
}

export interface BestSitesInterface {
  bestSites: ParsedLinks[];
}

export interface Product {
  name: string;
  type: ProductType;
}

export interface AnswerInterface {
  website: string;
  inStock: boolean;
  isMainProductPage: boolean;
  isNamedProduct: boolean;
  productTypeMatchStrict: boolean;
  price: number;
  currencyCode: string;
}

export interface FoundProduct {
  website: string;
  inStock: boolean;
  isMainProductPage: boolean;
  isNamedProduct: boolean;
  productTypeMatchStrict: boolean;
  price: number;
  currencyCode: string;
}
