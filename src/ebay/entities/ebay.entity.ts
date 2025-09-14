export class Ebay { }

export interface EbayTokenInterface {
  access_token: string;
  expires_in: number;
  token_type: string
}

export interface EbayProductStrip {
  name: any;
  price: {
    value: any;
    currency: any;
  };
}
