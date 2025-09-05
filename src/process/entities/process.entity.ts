export class Process { }

export enum UniqueShopType {
  TIKTOK = "TIKTOK",
  EBAY = "EBAY",
  AMAZON = "AMAZON"
}

export interface ProductInStockWithAnalysis {
  analysis: string;
  inStock: boolean;
  isMainProductPage: boolean;
  isNamedProduct: boolean;
  productTypeMatchStrict: boolean;
  price: number;
  currencyCode: string;
  conciseReason: string;
  detectedVariant: string;
  detectedFullName: string;
  variantMatchStrict: boolean;
  justifications: Justification
}

export interface ProductInStockWithAnalysisStripped {
  analysis: string;
  inStock: boolean;
  price: number;
  currencyCode: string;
  conciseReason: string;
  specificUrl: string;
}

export interface Justification {
  inStock: string;
  price: string;
  currencyCode: string;
  isMainProductPage: string;
  isNamedProduct: string;
  productTypeMatchStrict: string;
  variantMatchStrict: string;
}

export interface TestTwoInterface {
  url: string;
    inStock: boolean;
    price: number;
    productName: string;
    specificUrl: string;
    hash: string;
    count: number;
}
