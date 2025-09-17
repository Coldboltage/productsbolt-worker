export class Ebay { }

export interface EbayTokenInterface {
  access_token: string;
  expires_in: number;
  token_type: string
}

export interface EbayProductStrip {
  name: any;
  price: {
    value: number;
    currency: string;
  };
}

export interface EbaySoldProductStrip {
  name: string;
  price: {
    value: number;
    currency: string;
    estimatedSoldQuantity: number
    soldDate: Date
  };
}
