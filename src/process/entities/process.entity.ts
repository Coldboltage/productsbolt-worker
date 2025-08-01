export class Process {}

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
}

export interface ProductInStockWithAnalysisStripped {
  analysis: string;
  inStock: boolean;
  price: number;
  currencyCode: string;
  conciseReason: string;
  specificUrl: string;
}
