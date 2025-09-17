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
import { ProductInStockWithAnalysisStripped, TestTwoInterface, UniqueShopType } from './entities/process.entity.js';
import { EbayService } from './../ebay/ebay.service.js';
import crypto from 'node:crypto';
import { ProductDto } from './dto/product.dto.js';
import { EbayProductStrip, EbaySoldProductStrip } from '../ebay/entities/ebay.entity.js';


@Injectable()
export class ProcessService {
  constructor(
    private utilService: UtilsService,
    private browserService: BrowserService,
    private openaiService: OpenaiService,
    private ebayService: EbayService
  ) { }

  async shopifyCollectionsTest(shopDto: ShopDto) {
    return this.utilService.collectionsTest(`${shopDto.protocol}${shopDto.website}`)
  }


  async shopifySearch(shopDto: ShopDto) {
    const result = await this.browserService.isShopifySite(`${shopDto.protocol}${shopDto.website}`)
    const setup = await fetch(`http://localhost:3000/sitemap/${shopDto.sitemapEntity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isShopifySite: result }),
    });
    if (result === true) {
      await fetch(`http://localhost:3000/sitemap/test-shopify-site-collection/${shopDto.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (setup.ok === true) return true
    throw new Error('update_to_server_failed')
  }

  async hasSitemapChanged(sitemapUrl: string, etag: string) {
    const headers = {}
    if (etag) headers['If-None-Match'] = etag
    const sitemapStatus = await fetch(sitemapUrl, {
      method: 'HEAD',
      headers
    })

    const status = sitemapStatus.status

    let newEtag: string | null = null;
    let lastMod: string | null = null;
    let contentLength: string | null = null;
    let generatedSiteHash: string | null = null;


    if (status === 304) {
      return {
        newEtag, lastMod, contentLength, generatedSiteHash
      }
    }

    if (status === 200) {
      newEtag = sitemapStatus.headers.get('etag')
      lastMod = sitemapStatus.headers.get('last-modified')
      contentLength = sitemapStatus.headers.get('content-length')
      console.log(`header change: ${newEtag} ${lastMod} ${contentLength}`)
    }


    if (!newEtag && !lastMod && !contentLength) {
      const res = await fetch(sitemapUrl)
      const body = await res.arrayBuffer();
      generatedSiteHash = crypto.createHash('sha256').update(Buffer.from(body)).digest('hex')
    }

    return {
      newEtag, lastMod, contentLength, generatedSiteHash
    }

  }

  async shopifySitemapSearch(shopDto: ShopDto) {
    const test = await this.browserService.shopifySitemapSearch(`https://${shopDto.website}`, shopDto.category)
    // console.log(test)
    return test
  }

  async manualSitemapSearch(shopDto: ShopDto) {
    const checkSitemapUrlsCombined: string[] = [shopDto.sitemapEntity.sitemap]
    const urls: string[] = []

    console.log(shopDto.sitemapEntity)

    if (shopDto.sitemapEntity.additionalSitemaps && shopDto.sitemapEntity.additionalSitemaps.length > 0) {
      checkSitemapUrlsCombined.push(...shopDto.sitemapEntity.additionalSitemaps)
    }

    for (const sitemapUrl of checkSitemapUrlsCombined) {
      const links = await this.browserService.getLinksFromPage(sitemapUrl)
      console.log(shopDto.website)
      const cleanLinks = this.utilService.filterObviousNonPages(links, `https://${shopDto.website}`)
      console.log(`Found ${cleanLinks.length} links in sitemap ${sitemapUrl}`)
      console.log(cleanLinks)
      urls.push(...cleanLinks)
    }

    return urls
  }

  async sitemapSearch(shopDto: ShopDto) {
    console.log(shopDto.sitemapEntity)
    // await this.hasSitemapChanged(shopDto.sitemap, shopDto.etag)
    const sitemapUrls = await this.utilService.getUrlsFromSitemap(
      shopDto.sitemapEntity.sitemap,
      `https://${shopDto.website}${shopDto.category}`,
      90,
      shopDto.sitemapEntity.fast
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
    const { url, category, name, type, context, crawlAmount, shopType } = createProcessDto;
    const { sitemap, isShopifySite: shopifySite, sitemapUrls, fast } = createProcessDto.sitemapEntity

    if (shopType === UniqueShopType.EBAY) {
      const result = await this.ebayService.getUrlsFromApiCall(name, context, type)
      for (const webpage of result) {
        await this.webDiscoverySend(webpage, createProcessDto)
        return true
      }
    }

    const result = await this.rotateTest(sitemap, url, category, name, type, context, crawlAmount, sitemapUrls, mode, shopifySite, fast);
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
      // console.log('getPageInfo activated')
      // console.log({
      //   url,
      //   shopifySite
      // })
      // await new Promise(r => setTimeout(() => r, 10000000))
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

  async testTwo(url: string, query: string, type: ProductType, mode: string, shopifySite: boolean, hash: string, confirmed: boolean, count: number,): Promise<TestTwoInterface> {
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
      await new Promise(r => setTimeout(r, 50))
      const result = await this.utilService.extractShopifyWebsite(url)
      return {
        url,
        inStock: result.available ? result.available : false,
        price: result.price / 100,
        productName: query,
        specificUrl: url,
        hash: "shopify",
        count: 0,
        shopifySite
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

    // Create Hash from maintext. We shall assume this text must change if something has changed
    const currentHash = crypto.createHash('sha256').update(allText).digest('hex')

    if (currentHash === hash && confirmed === true) {
      console.log({
        message: 'no-need-to-continue',
        webpage: url
      })
      throw new Error('no-need-to-continue')
    }
    hash = currentHash

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

    if (url.includes('games-island')) answer.price = Math.round(answer.price * 0.81)

    return { ...answer, productName: query, specificUrl: url, url, hash, count: count, shopifySite };

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
    fast: boolean
  ): Promise<ProductInStockWithAnalysisStripped> {
    console.log(`https://${base}${seed}`)

    let foundSitemapUrls: {
      websiteUrls: string[];
      fast: boolean;
    } = { websiteUrls: [], fast: false };

    foundSitemapUrls = await this.utilService.getUrlsFromSitemap(
      sitemap,
      `https://${base}${seed}`,
      crawlAmount,
      fast,
      sitemapUrls,
    );

    const reducedUrls = this.utilService.reduceSitemap(foundSitemapUrls.websiteUrls, query)

    console.log(`ReducedUrls: ${reducedUrls.length}`)

    const { bestSites } = await this.openaiService.crawlFromSitemap(
      reducedUrls,
      query,
      mode,
      `${base}${seed}`
    );

    for (const singleUrl of bestSites) {
      if (singleUrl.score <= 0.9) continue
      console.log(`${singleUrl.url}`);
      const answer = await this.test(`${singleUrl.url}`, query, type, "mini", context, shopifySite);
      if (answer) {
        console.log('Product Found');
        // foundProducts.push({ ...answer, website: `${singleUrl.url}` });
        // console.log(foundProducts);
        return answer;
      }
    }

    // Temp change to see if odd websites do not get added
    throw new Error('no_site_found')
    if (shopifySite) throw new Error('nothing_else_to_do')

    const bestSitesAllLinks = [];

    console.log(bestSites.length > 0)


    if (bestSites.length > 0) {
      for (const site of bestSites) {
        if (site.score < 0.8 || shopifySite === true) continue
        bestSitesAllLinks.push(
          ...(await this.browserService.getLinksFromPage(site.url)),
        );
        console.log(bestSitesAllLinks.length);
      }
    }
    // else {
    //   for (const [index, site] of reducedUrls.entries()) {
    //     if (index < 2) {
    //       bestSitesAllLinks.push(
    //         ...(await this.browserService.getLinksFromPage(site)),
    //       );
    //     }

    //   }
    // }

    const reducedUrlsbestSitesAllLinks = this.utilService.reduceSitemap(bestSitesAllLinks, query)

    console.log(reducedUrlsbestSitesAllLinks)

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

    if (allUrls[0]) throw new Error('no link found')

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
    const result = await this.testTwo(checkPageDto.url, checkPageDto.query, checkPageDto.type, "mini", checkPageDto.shopifySite, checkPageDto.hash, checkPageDto.confirmed, checkPageDto.count)
    return result
  }

  async ebayStatCalc(product: ProductDto) {
    const ebayProductPrices: EbayProductStrip[] = await this.ebayService.productPrices(product)

    // https://www.ebay.co.uk/sch/i.html?_nkw=magic+the+gathering+innistrad+remastered+play+booster+box&rt=nc&LH_Sold=1&LH_Complete=1

    const url = `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(product.name)}&rt=nc&LH_Sold=1&LH_Complete=1`
    const soldEbayProductPrices = await this.browserService.getPageInfo(url)

    console.log(soldEbayProductPrices.mainText)

    await new Promise(r => setTimeout(() => r, 2000000))

    // const soldEbayProductPrices: EbaySoldProductStrip[] = await this.ebayService.soldProductPrice(product)

    const pricePoints = await this.openaiService.ebayPricePoint(ebayProductPrices, product.name)
    const soldPricePoints = await this.openaiService.ebaySoldPricePoint(soldEbayProductPrices.mainText, product)

    const soldPricePointsLastSevenDays = soldPricePoints.filter(product => {
      const todayDate = new Date()
      const soldListingDate = new Date(product.price.soldDate)

      const differenceMs = todayDate.getTime() - soldListingDate.getTime()
      const diffDays = differenceMs / (1000 * 60 * 60 * 24);

      return diffDays <= 7
    })


    const totalQuantity = soldPricePointsLastSevenDays.reduce((sum, p) => sum + p.price.estimatedSoldQuantity, 0);
    const weightedAvgPrice = soldPricePointsLastSevenDays.reduce(
      (sum, p) => sum + p.price.value * p.price.estimatedSoldQuantity,
      0
    ) / totalQuantity;

    // 2. Weighted spread (variance)
    const variance =
      soldPricePointsLastSevenDays.reduce(
        (sum, p) =>
          sum +
          p.price.estimatedSoldQuantity *
          Math.pow(p.price.value - weightedAvgPrice, 2),
        0
      ) / totalQuantity;

    // 3. Standard deviation = spread
    const spread = Math.sqrt(variance);

    // 4. Spread score as a %
    const spreadScorePct = (spread / weightedAvgPrice) * 100;

    console.log({
      weightedAvgPrice,
      spread,
      spreadScorePct: spreadScorePct.toFixed(2) + "%"
    });

    const pricePointTest = {
      minPrice: pricePoints.minPrice,
      averagePrice: pricePoints.averagePrice,
      maxPrice: pricePoints.maxPrice,
      soldSevenDays: totalQuantity,
      averageSoldPrice: !weightedAvgPrice ? 0 : weightedAvgPrice,
      spreadScore: !spreadScorePct ? 0 : spreadScorePct
    }

    console.log(soldPricePointsLastSevenDays)
    console.log(pricePointTest)

    // Temp for test
    try {
      await fetch(`http://localhost:3000/ebay-stats/patch-and-update-price-points/${product.ebayStat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricePointTest),
      })
    } catch (error) {
      console.error(error)
    }
    return pricePoints
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
