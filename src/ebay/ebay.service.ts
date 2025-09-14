import { Injectable, OnModuleInit } from '@nestjs/common';
import { ProductInStockWithAnalysisStripped } from 'src/process/entities/process.entity.js';
import { CreateEbayDto } from './dto/create-ebay.dto.js';
import { UpdateEbayDto } from './dto/update-ebay.dto.js';
import 'dotenv/config';
import { EbayProductStrip, EbayTokenInterface } from './entities/ebay.entity.js';
import EbayAuthToken from 'ebay-oauth-nodejs-client';
import { ProductDto } from '../process/dto/product.dto.js';


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

  async getUrlsFromApiCall(productName: string, productContext: string, productType: string): Promise<ProductInStockWithAnalysisStripped[]> {
    console.log({
      appid: process.env.EBAY_APPID,
      certId: process.env.EBAY_CERTID
    })
    const apiKeyTest = await this.getApiKey(process.env.EBAY_APPID, process.env.EBAY_CERTID)
    const apiKey = {
      access_token: process.env.TEMP_EBAY_KEY
    }
    const productEpidList = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(productName)}`, {
      method: "GET",
      headers: {
        // 'Authorization': `Bearer ${process.env.EBAY_API_KEY}`, // Use the API key from the environment variable
        'Authorization': `Bearer ${apiKey.access_token}`, // Use the API key from the environment variable
        'Content-Type': 'application/json',
      }
    })
    const json = await productEpidList.json()
    // console.log(json)

    const test = await fetch("https://api.ebay.com/buy/browse/v1/item_summary/search?q=Innistrad+Remastered+Play+Booster+Box&X-EBAY-C-MARKETPLACE-ID=EBAY_GB", {
      headers: {
        // 'Authorization': `Bearer ${process.env.EBAY_API_KEY}`, // Use the API key from the environment variable
        'Authorization': `Bearer ${apiKey.access_token}`, // Use the API key from the environment variable
        'Content-Type': 'application/json',
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB"

      }
    })
    const epidTest = await test.json()

    // console.log(epidTest)


    const stripedProducts = []

    for (const product of epidTest.itemSummaries) {
      const strippedItem = {
        name: product.title,
        price: {
          value: product.price.value,
          currency: product.price.currency
        }
      }

      stripedProducts.push(strippedItem)
    }

    console.log(stripedProducts)
    return Promise.resolve([{
      analysis: "Looks genuine and available.",
      inStock: true,
      price: 29.99,
      currencyCode: "EUR",
      conciseReason: "Verified in stock from supplier website.",
      specificUrl: "https://example.com/product/123",
    }])
  }

  async getApiKey(appId: string, certId: string) {
    const credentials = Buffer.from(`${appId.trim()}:${certId.trim()}`).toString('base64')
    console.log(credentials)

    const ebayAuthToken = new EbayAuthToken({
      clientId: process.env.EBAY_APPID,
      clientSecret: process.env.EBAY_CERTID,
      redirectUri: 'Alan_Reid-AlanReid-Produc-ycbszzu' // from your Dev Portal RuName
    });

    const appToken = await ebayAuthToken.getApplicationToken('PRODUCTION');
    console.log(appToken);

    return appToken
  }

  async productPrices(product: ProductDto): Promise<EbayProductStrip[]> {
    // const apiKey = await this.getApiKey(process.env.EBAY_APPID, process.env.EBAY_CERTID)
    const apiKey = {
      access_token: process.env.TEMP_EBAY_KEY
    }

    const searchResults = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(product.name)}&X-EBAY-C-MARKETPLACE-ID=EBAY_GB`, {
      headers: {
        'Authorization': `Bearer ${apiKey.access_token}`, // Use the API key from the environment variable
        'Content-Type': 'application/json',
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB"

      }
    })
    const searchJson = await searchResults.json()
    const stripedProducts: EbayProductStrip[] = []

    for (const product of searchJson.itemSummaries) {
      const strippedItem = {
        name: product.title,
        price: {
          value: product.price.value,
          currency: product.price.currency
        }
      }

      stripedProducts.push(strippedItem)
    }

    console.log(stripedProducts)
    return stripedProducts
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
