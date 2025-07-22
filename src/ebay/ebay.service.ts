import { Injectable, OnModuleInit } from '@nestjs/common';
import { ProductInStockWithAnalysisStripped } from 'src/process/entities/process.entity.js';
import { CreateEbayDto } from './dto/create-ebay.dto.js';
import { UpdateEbayDto } from './dto/update-ebay.dto.js';
import 'dotenv/config';
import { EbayTokenInterface } from './entities/ebay.entity.js';

@Injectable()
export class EbayService implements OnModuleInit {
   async onModuleInit() {
    try {
      const test = await this.getUrlsFromApiCall('Magic The Gathering Final Fantasy Collector', 'It is an old amp, from the 1960s', 'AMP')
      console.log(test)
    } catch (error) {
      console.log(error)
    }
  }
  create(createEbayDto: CreateEbayDto) {
    return 'This action adds a new ebay';
  }

  findAll() {
    return `This action returns all ebay`;
  }

  async getUrlsFromApiCall(productName: string, productContext: string, productType: string): Promise<ProductInStockWithAnalysisStripped[]> {
    const apiKey = await this.getApiKey(process.env.EBAY_APPID, process.env.EBAY_CERTID)
    console.log(apiKey)
    const productEpidList = await fetch(`https://api.ebay.com/commerce/catalog/v1_beta/product_summary/search?q=${encodeURIComponent(productName)}`, {
      method: "GET",
      headers: {
        // 'Authorization': `Bearer ${process.env.EBAY_API_KEY}`, // Use the API key from the environment variable
        'Authorization': `Bearer ${apiKey.access_token}`, // Use the API key from the environment variable
        'Content-Type': 'application/json',
      }
    })
    const json = await productEpidList.json()
    console.log(json)
    // Loop through all of the epIds and get a description of each epid.
    // Use OpenAI nano and sanity check for the best epid
    // Loop through all listings of best epId
    // Use the existing openai search thing I have
    // create a list of correct listings

    // NOTE. We don't want to nano anything already checked. 
    return Promise.resolve([{
      analysis: "Looks genuine and available.",
      inStock: true,
      price: 29.99,
      currencyCode: "EUR",
      conciseReason: "Verified in stock from supplier website.",
      specificUrl: "https://example.com/product/123",
    } ] )
  }

  async getApiKey(appId: string, certId: string): Promise<EbayTokenInterface> {
    const credentials =  Buffer.from(`${appId}:${certId}`).toString('base64')
    const refreshToken = 'v^1.1#i^1#r^1#I^3#f^0#p^3#t^Ul4xMF8yOjQ3MTY2NThBMDNENDVBM0RCNTYxNjExOTUzNkQ5QzBBXzFfMSNFXjI2MA==';
    const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        scope: 'https://api.ebay.com/oauth/api_scope/sell.inventory'
      })
    });
    const json: EbayTokenInterface = await response.json()
    return json
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
