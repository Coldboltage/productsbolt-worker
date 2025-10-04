import { Injectable, OnModuleInit } from '@nestjs/common';
import { ProductInStockWithAnalysisStripped } from 'src/process/entities/process.entity.js';
import { CreateEbayDto } from './dto/create-ebay.dto.js';
import { UpdateEbayDto } from './dto/update-ebay.dto.js';
import 'dotenv/config';
import {
  EbayProductStrip,
  EbaySoldProductStrip,
  EbayTokenInterface,
} from './entities/ebay.entity.js';
import EbayAuthToken from 'ebay-oauth-nodejs-client';
import { ProductDto } from '../process/dto/product.dto.js';
import { EbayItem } from './entities/ebay-get-item.type.js';

@Injectable()
export class EbayService implements OnModuleInit {
  async onModuleInit() {
    // try {
    //   const test = await this.getUrlsFromApiCall('Magic: The Gathering MTG - Final Fantasy Collector Booster Box', 'Magic: The Gathering MTG - Final Fantasy Collector Booster Box', 'TCG')
    //   console.log(test)
    // } catch (error) {
    //   console.log(error)
    // }
  }
  create(createEbayDto: CreateEbayDto) {
    return 'This action adds a new ebay';
  }

  findAll() {
    return `This action returns all ebay`;
  }

  async getUrlsFromApiCall(
    productName: string,
    productContext: string,
    productType: string,
  ): Promise<ProductInStockWithAnalysisStripped[]> {
    console.log({
      appid: process.env.EBAY_APPID,
      certId: process.env.EBAY_CERTID,
    });
    const apiKeyTest = await this.getApiKey(
      process.env.EBAY_APPID,
      process.env.EBAY_CERTID,
    );
    const apiKey = {
      access_token: process.env.TEMP_EBAY_KEY,
    };
    const productEpidList = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(productName)}`,
      {
        method: 'GET',
        headers: {
          // 'Authorization': `Bearer ${process.env.EBAY_API_KEY}`, // Use the API key from the environment variable
          Authorization: `Bearer ${apiKey.access_token}`, // Use the API key from the environment variable
          'Content-Type': 'application/json',
        },
      },
    );
    const json = await productEpidList.json();
    // console.log(json)

    const test = await fetch(
      'https://api.ebay.com/buy/browse/v1/item_summary/search?q=Innistrad+Remastered+Play+Booster+Box&X-EBAY-C-MARKETPLACE-ID=EBAY_GB',
      {
        headers: {
          // 'Authorization': `Bearer ${process.env.EBAY_API_KEY}`, // Use the API key from the environment variable
          Authorization: `Bearer ${apiKey.access_token}`, // Use the API key from the environment variable
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
        },
      },
    );
    const epidTest = await test.json();

    // console.log(epidTest)

    const stripedProducts = [];

    for (const product of epidTest.itemSummaries) {
      const strippedItem = {
        name: product.title,
        price: {
          value: product.price.value,
          currency: product.price.currency,
        },
      };

      stripedProducts.push(strippedItem);
    }

    console.log(stripedProducts);
    return Promise.resolve([
      {
        analysis: 'Looks genuine and available.',
        inStock: true,
        price: 29.99,
        currencyCode: 'EUR',
        conciseReason: 'Verified in stock from supplier website.',
        specificUrl: 'https://example.com/product/123',
        pageAllText: 'Full text content of the product page...',
        pageTitle: 'Example Product Page Title',
        count: 1,
        hash: 'abc123',
        shopifySite: false,
      },
    ]);
  }

  async getApiKey(appId: string, certId: string) {
    const credentials = Buffer.from(
      `${appId.trim()}:${certId.trim()}`,
    ).toString('base64');
    console.log(credentials);

    const ebayAuthToken = new EbayAuthToken({
      clientId: process.env.EBAY_APPID,
      clientSecret: process.env.EBAY_CERTID,
      redirectUri: 'Alan_Reid-AlanReid-Produc-ycbszzu', // from your Dev Portal RuName
    });

    const appToken = await ebayAuthToken.getApplicationToken('PRODUCTION');
    console.log(appToken);

    return appToken;
  }

  async productPrices(product: ProductDto): Promise<EbayProductStrip[]> {
    // const apiKey = await this.getApiKey(process.env.EBAY_APPID, process.env.EBAY_CERTID)
    const apiKey = {
      access_token: process.env.TEMP_EBAY_KEY,
    };

    let searchResults;
    try {
      searchResults = await fetch(
        `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(product.name)}&X-EBAY-C-MARKETPLACE-ID=EBAY_GB`,
        {
          headers: {
            Authorization: `Bearer ${apiKey.access_token}`, // Use the API key from the environment variable
            'Content-Type': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
          },
        },
      );
    } catch (error) {
      console.error('Error fetching eBay data:', error);
    }

    const searchJson = await searchResults.json();
    // console.log(searchJson)
    const stripedProducts: EbayProductStrip[] = [];

    for (const product of searchJson.itemSummaries) {
      const strippedItem = {
        name: product.title,
        price: {
          value: product.price.value,
          currency: product.price.currency,
        },
      };

      stripedProducts.push(strippedItem);
    }

    // console.log(stripedProducts)
    return stripedProducts;
  }

  async soldProductPrice(product: ProductDto): Promise<EbaySoldProductStrip[]> {
    // const apiKey = await this.getApiKey(process.env.EBAY_APPID, process.env.EBAY_CERTID)
    const apiKey = {
      access_token: process.env.TEMP_EBAY_KEY,
    };

    const now = new Date(); // current time
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const nowIso = now.toISOString();
    const sevenDaysAgoIso = sevenDaysAgo.toISOString();

    let searchResults;
    try {
      searchResults = await fetch(
        `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(product.name)}&X-EBAY-C-MARKETPLACE-ID=EBAY_GB&filter=soldItems:true,itemEndDate:[${sevenDaysAgoIso}..${nowIso}]`,
        {
          headers: {
            Authorization: `Bearer ${apiKey.access_token}`, // Use the API key from the environment variable
            'Content-Type': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
          },
        },
      );
    } catch (error) {
      console.error('Error fetching eBay data:', error);
    }

    const searchJson = await searchResults.json();
    // console.log(searchJson)
    const stripedProducts: EbaySoldProductStrip[] = [];

    for (const product of searchJson.itemSummaries) {
      // console.log(product)

      const itemListing = await fetch(
        `https://api.ebay.com/buy/browse/v1/item/${encodeURIComponent(product.itemId)}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey.access_token}`, // Use the API key from the environment variable
            'Content-Type': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
          },
        },
      );

      const itemListingJson: EbayItem = await itemListing.json();

      console.log(itemListingJson);

      const strippedItem: EbaySoldProductStrip = {
        name: product.title,
        price: {
          value: product.price.value,
          currency: product.price.currency,
          estimatedSoldQuantity:
            itemListingJson.estimatedAvailabilities[0].estimatedSoldQuantity ===
            0
              ? 1
              : itemListingJson.estimatedAvailabilities[0]
                  .estimatedSoldQuantity,
          soldDate: product.price.soldDate,
        },
      };

      stripedProducts.push(strippedItem);
    }

    console.log(stripedProducts);
    return stripedProducts;
  }

  findOne(id: number) {
    return `This action returns a #${id} ebay`;
  }

  update(id: number, updateEbayDto: UpdateEbayDto) {
    return `This action updates a #${id} ebay`;
  }

  remove(id: number) {
    return `This action removes a #${id} ebay`;
  }
}
