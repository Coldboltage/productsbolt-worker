import { Injectable } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import { promises as fs } from 'fs';
import { htmlToText } from 'html-to-text';
import { ProductType } from '../app.type.js';
import { BrowserService } from '../browser/browser.service.js';
import { OpenaiService } from '../openai/openai.service.js';
import { UtilsService } from '../utils/utils.service.js';
import { CreateProcessDto } from './dto/create-process.dto.js';
import { UpdateProcessDto } from './dto/update-process.dto.js';
import { CheckPageDto } from './dto/check-page.dto.js';
import { encoding_for_model } from '@dqbd/tiktoken';
import { ShopDto } from './dto/shop.dto.js';
import { ProductInStockWithAnalysisStripped, UniqueShopType } from './entities/process.entity.js';
import { EbayService } from './../ebay/ebay.service.js';


@Injectable()
export class ProcessService {
  constructor(
    private utilService: UtilsService,
    private browserService: BrowserService,
    private openaiService: OpenaiService,
    private ebayService: EbayService
  ) { }


  async shopifySearch(shopDto: ShopDto) {
    const result = await this.browserService.isShopifySite(`${shopDto.protocol}${shopDto.website}`)
    const setup = await fetch(`http://localhost:3000/shop/${shopDto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isShopifySite: result }),
    });
    if (setup.ok === true) return true
    throw new Error('update_to_server_failed')
  }

  async sitemapSearch(shopDto: ShopDto) {
    const sitemapUrls = await this.utilService.getUrlsFromSitemap(
      shopDto.sitemap,
      `https://${shopDto.website}${shopDto.category}`,
      90
    );
    return sitemapUrls
  }

  async webDiscoverySend(webpage: ProductInStockWithAnalysisStripped, createProcessDto: CreateProcessDto) {
    const webPage = {
      url: webpage.specificUrl,
      shopWebsite: createProcessDto.shopWebsite,
      inStock: webpage.inStock,
      price: webpage.price,
      currencyCode: webpage.currencyCode,
      productName: createProcessDto.name,
      reason: webpage.analysis,
      productId: createProcessDto.productId,
      shopId: createProcessDto.shopId
    };
    console.log(webPage);
    await fetch('http://localhost:3000/webpage/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webPage),
    });
  }

  async webpageDiscovery(createProcessDto: CreateProcessDto, mode: string) {
    const { sitemap, url, category, name, type, context, crawlAmount, sitemapUrls, shopifySite, shopType } = createProcessDto;

    if (shopType === UniqueShopType.EBAY) {
      const result = await this.ebayService.getUrlsFromApiCall(name, context, type)
      for (const webpage of result) {
        await this.webDiscoverySend(webpage, createProcessDto)
        return true
      }
    }

    const result = await this.rotateTest(sitemap, url, category, name, type, context, crawlAmount, sitemapUrls, mode, shopifySite);
    if (result) {
      await this.webDiscoverySend(result, createProcessDto)
      return true
    }
    return false
  }

  async test(url: string, query: string, type: ProductType, mode: string, context: string, shopifySite: boolean): Promise<ProductInStockWithAnalysisStripped> {
    // Think the router has to be added here
    let html: string
    let mainText: string

    console.log(`shopifySite: ${shopifySite}`)
    let title: string
    let allText: string

    if (shopifySite) {
      console.log('extractShopifyWebsite activated')
      const textInformation = await this.utilService.extractShopifyWebsite(url)
      title = textInformation.title
      allText = textInformation.mainText
    } else {
      console.log('getPageInfo activated')
      const textInformation = await this.browserService.getPageInfo(url)
      html = textInformation.html
      mainText = textInformation.mainText
      const dom = new JSDOM(html);
      const document = dom.window.document;
      title = document.title;
      console.log('Page title:', title);

      const allText = htmlToText(mainText, {
        wordwrap: false,
      });
    }

    console.log({
      title,
      allText,
      query,
      type,
      mode,
      context
    })


    // console.log(allText)

    const answer = await this.openaiService.productInStock(
      title,
      allText,
      query,
      type,
      mode,
      context
    );

    if (
      answer?.isNamedProduct === true &&
      answer?.productTypeMatchStrict === true &&
      answer?.isMainProductPage === true &&
      answer?.variantMatchStrict === true

    ) {
      console.log(answer)
      return { ...answer, specificUrl: url };
    }
    console.error(answer)
  }

  async testTwo(url: string, query: string, type: ProductType, mode: string, shopifySite) {
    // Note, the html discovery part should be it's own function
    // This is for testing for now
    // Think the router has to be added here
    let html: string
    let mainText: string

    console.log(`shopifySite: ${shopifySite}`)
    let title: string
    let allText: string

    if (shopifySite) {
      console.log('extractShopifyWebsite activated')
      const result = await this.utilService.extractShopifyWebsite(url)
      return {
        url,
        inStock: result.available,
        price: result.price / 100,
        productName: query,
        specificUrl: url,
      }
    } else {
      console.log('getPageInfo activated')
      const textInformation = await this.browserService.getPageInfo(url)
      html = textInformation.html
      mainText = textInformation.mainText
      const dom = new JSDOM(html);
      const document = dom.window.document;
      title = document.title;
      console.log('Page title:', title);

      allText = htmlToText(mainText, {
        wordwrap: false,
      });
    }

    console.log({
      title,
      allText,
      query,
      type,
      mode
    })

    const answer = await this.openaiService.checkProduct(
      title,
      allText,
      query,
      type,
      mode
    );

    console.log(answer)

    const enc = encoding_for_model(`gpt-4.1-nano`); // or 'gpt-4', 'gpt-3.5-turbo', etc.

    const text = "Your prompt or content here";
    const tokens = enc.encode(allText);

    console.log(`Token count: ${tokens.length}`);

    if (answer?.price !== 0) {

      return { ...answer, specificUrl: url };
    }
  }

  async rotateTest(
    sitemap: string,
    base: string,
    seed: string,
    query: string,
    type: ProductType,
    context: string,
    crawlAmount: number,
    sitemapUrls: string[],
    mode: string,
    shopifySite: boolean,
  ): Promise<ProductInStockWithAnalysisStripped> {
    console.log(`https://${base}${seed}`)

    let foundSitemapUrls: string[] = []

    foundSitemapUrls = await this.utilService.getUrlsFromSitemap(
      sitemap,
      `https://${base}${seed}`,
      crawlAmount,
      sitemapUrls,
    );

    const reducedUrls = this.utilService.reduceSitemap(foundSitemapUrls, query)

    console.log(`ReducedUrls: ${reducedUrls.length}`)
    // console.log(reducedUrls)

    await fs.writeFile('urls.txt', reducedUrls.join('\n'));

    const { bestSites } = await this.openaiService.crawlFromSitemap(
      reducedUrls,
      query,
      mode,
      `${base}${seed}`
    );

    for (const singleUrl of bestSites) {
      console.log(`${singleUrl.url}`);
      const answer = await this.test(`${singleUrl.url}`, query, type, "mini", context, shopifySite);
      if (answer) {
        console.log('Product Found');
        // foundProducts.push({ ...answer, website: `${singleUrl.url}` });
        // console.log(foundProducts);
        return answer;
      }
    }

    const bestSitesAllLinks = [];

    for (const site of bestSites) {
      if (site.score < 0.8) continue
      bestSitesAllLinks.push(
        ...(await this.browserService.getLinksFromPage(site.url)),
      );
      console.log(bestSitesAllLinks.length);
    }

    const reducedUrlsbestSitesAllLinks = this.utilService.reduceSitemap(foundSitemapUrls, query)

    const uniqueBestSitesAllLinks = [...new Set(reducedUrlsbestSitesAllLinks)];
    console.log(uniqueBestSitesAllLinks.length);

    if (uniqueBestSitesAllLinks.length === 0) throw new Error('No links found to process');

    const { bestSites: finalBestSites } =
      await this.openaiService.crawlFromSitemap(
        uniqueBestSitesAllLinks,
        query,
        mode,
        `${base}${seed}`
      );

    const mapFinalBestSites = finalBestSites.map((site) => {
      const normalisedUrl = this.utilService.normalizeUrl(site.url, `https://${base}`);
      return normalisedUrl.startsWith('/')
        ? normalisedUrl.slice(1)
        : normalisedUrl;
    });

    const allUrls = this.utilService.gatherLinks(mapFinalBestSites);

    console.log(`https://${base}${allUrls[0]}`);
    const answer = await this.test(`https://${base}${allUrls[0]}`, query, type, "mini", context, shopifySite);
    if (answer) {
      console.log('Product Found');
      // foundProducts.push({ ...answer, website: `${base}${singleUrl}` });
      return answer;
    }

    // for (const singleUrl of allUrls) {
    //   console.log(`https://${base}${singleUrl}`);
    //   const answer = await this.test(`https://${base}${singleUrl}`, query, type);
    //   if (answer) {
    //     console.log('Product Found');
    //     // foundProducts.push({ ...answer, website: `${base}${singleUrl}` });
    //     return answer;
    //   }
    // }

    // console.log(foundProducts);
  }

  async updatePage(checkPageDto: CheckPageDto) {
    const result = await this.testTwo(checkPageDto.url, checkPageDto.query, checkPageDto.type, "mini", checkPageDto.shopifySite)
    return result
  }

  create(createProcessDto: CreateProcessDto) { }

  findAll() {
    return `This action returns all process`;
  }

  findOne(id: number) {
    return `This action returns a #${id} process`;
  }

  update(id: number, updateProcessDto: UpdateProcessDto) {
    return `This action updates a #${id} process`;
  }

  remove(id: number) {
    return `This action removes a #${id} process`;
  }
}
