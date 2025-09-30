import { Injectable, ServiceUnavailableException } from '@nestjs/common';
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
import {
  ProductInStockWithAnalysisStripped,
  TestTwoInterface,
  UniqueShopType,
  UpdatePagePayloadInterface,
} from './entities/process.entity.js';
import { EbayService } from './../ebay/ebay.service.js';
import crypto from 'node:crypto';
import { ProductDto } from './dto/product.dto.js';
import {
  EbayProductStrip,
  EbaySoldProductStrip,
} from '../ebay/entities/ebay.entity.js';
import { text } from 'node:stream/consumers';

@Injectable()
export class ProcessService {
  constructor(
    private utilService: UtilsService,
    private browserService: BrowserService,
    private openaiService: OpenaiService,
    private ebayService: EbayService,
  ) {}

  async shopifyCollectionsTest(shopDto: ShopDto) {
    return this.utilService.collectionsTest(
      `${shopDto.protocol}${shopDto.website}`,
    );
  }

  async shopifySearch(shopDto: ShopDto) {
    const result = await this.browserService.isShopifySite(
      `${shopDto.protocol}${shopDto.website}`,
    );
    const setup = await fetch(
      `http://localhost:3000/sitemap/${shopDto.sitemapEntity.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isShopifySite: result }),
      },
    );
    if (result === true) {
      await fetch(
        `http://localhost:3000/sitemap/test-shopify-site-collection/${shopDto.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
    if (setup.ok === true) return true;
    throw new Error('update_to_server_failed');
  }

  async hasSitemapChanged(sitemapUrl: string, etag: string) {
    const headers = {};
    if (etag) headers['If-None-Match'] = etag;
    const sitemapStatus = await fetch(sitemapUrl, {
      method: 'HEAD',
      headers,
    });

    const status = sitemapStatus.status;

    let newEtag: string | null = null;
    let lastMod: string | null = null;
    let contentLength: string | null = null;
    let generatedSiteHash: string | null = null;

    if (status === 304) {
      return {
        newEtag,
        lastMod,
        contentLength,
        generatedSiteHash,
      };
    }

    if (status === 200) {
      newEtag = sitemapStatus.headers.get('etag');
      lastMod = sitemapStatus.headers.get('last-modified');
      contentLength = sitemapStatus.headers.get('content-length');
      console.log(`header change: ${newEtag} ${lastMod} ${contentLength}`);
    }

    if (!newEtag && !lastMod && !contentLength) {
      const res = await fetch(sitemapUrl);
      const body = await res.arrayBuffer();
      generatedSiteHash = crypto
        .createHash('sha256')
        .update(Buffer.from(body))
        .digest('hex');
    }

    return {
      newEtag,
      lastMod,
      contentLength,
      generatedSiteHash,
    };
  }

  async shopifySitemapSearch(shopDto: ShopDto) {
    const test = await this.browserService.shopifySitemapSearch(
      `https://${shopDto.website}`,
      shopDto.category,
    );
    // console.log(test)
    return test;
  }

  async manualSitemapSearch(shopDto: ShopDto) {
    const checkSitemapUrlsCombined: string[] = [shopDto.sitemapEntity.sitemap];
    const urls: string[] = [];

    console.log(shopDto.sitemapEntity);

    if (
      shopDto.sitemapEntity.additionalSitemaps &&
      shopDto.sitemapEntity.additionalSitemaps.length > 0
    ) {
      checkSitemapUrlsCombined.push(
        ...shopDto.sitemapEntity.additionalSitemaps,
      );
    }

    for (const sitemapUrl of checkSitemapUrlsCombined) {
      const links = await this.browserService.getLinksFromPage(sitemapUrl);
      console.log(shopDto.website);
      const cleanLinks = this.utilService.filterObviousNonPages(
        links,
        `https://${shopDto.website}`,
      );
      console.log(`Found ${cleanLinks.length} links in sitemap ${sitemapUrl}`);
      console.log(cleanLinks);
      urls.push(...cleanLinks);
    }

    return urls;
  }

  async sitemapSearch(shopDto: ShopDto) {
    console.log(shopDto.sitemapEntity);
    // await this.hasSitemapChanged(shopDto.sitemap, shopDto.etag)
    const sitemapUrls = await this.utilService.getUrlsFromSitemap(
      shopDto.sitemapEntity.sitemap,
      `https://${shopDto.website}${shopDto.category}`,
      90,
      shopDto.sitemapEntity.fast,
    );
    return sitemapUrls;
  }

  async webDiscoverySend(
    webpage: ProductInStockWithAnalysisStripped,
    createProcessDto: CreateProcessDto,
  ) {
    const webPage = {
      url: webpage.specificUrl,
      shopWebsite: createProcessDto.shopWebsite,
      inStock: webpage.inStock,
      price: webpage.price,
      currencyCode: webpage.currencyCode,
      productName: createProcessDto.name,
      reason: webpage.analysis,
      productId: createProcessDto.productId,
      shopId: createProcessDto.shopId,
    };
    console.log(webPage);
    try {
      await fetch('http://localhost:3000/webpage/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webPage),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async webpageDiscovery(createProcessDto: CreateProcessDto, mode: string) {
    const { url, category, name, type, context, crawlAmount, shopType } =
      createProcessDto;
    const {
      sitemap,
      isShopifySite: shopifySite,
      sitemapUrls,
      fast,
    } = createProcessDto.sitemapEntity;

    if (shopType === UniqueShopType.EBAY) {
      const result = await this.ebayService.getUrlsFromApiCall(
        name,
        context,
        type,
      );
      for (const webpage of result) {
        await this.webDiscoverySend(webpage, createProcessDto);
        return true;
      }
    }

    const result = await this.rotateTest(
      sitemap,
      url,
      category,
      name,
      type,
      context,
      crawlAmount,
      sitemapUrls,
      mode,
      shopifySite,
      fast,
      createProcessDto,
      createProcessDto.cloudflare,
    );
    if (result) {
      return true;
    }
    return false;
  }

  async test(
    url: string[],
    query: string,
    type: ProductType,
    mode: string,
    context: string,
    shopifySite: boolean,
    createProcessDto: CreateProcessDto,
    cloudflare: boolean,
  ): Promise<boolean> {
    // Think the router has to be added here
    let html: string;
    let mainText: string;

    console.log(`shopifySite: ${shopifySite}`);
    let title: string;
    let allText: string;
    let success = false;
    let index = 0;
    let textInformation: {
      html: string;
      mainText: string;
    };
    let info: { title: string; mainText: string };
    let specificUrl: string;

    if (shopifySite) {
      console.log('extractShopifyWebsite activated');
      while (index < url.length) {
        try {
          info = await this.utilService.extractShopifyWebsite(url[index]);
          textInformation = { html: info.title, mainText: info.mainText };
          specificUrl = url[index];
          success = true;
          break;
        } catch (error) {
          console.error(`Skipping ${url[index]}: ${error.message}`);
          index++;
        }
      }
      title = info.title;
      allText = textInformation.mainText;
    } else {
      while (index < url.length) {
        try {
          if (cloudflare) {
            textInformation = await this.browserService.getPageInfo(url[index]);
            specificUrl = url[index];
          } else {
            textInformation = await this.browserService.getPageHtml(url[index]);
            specificUrl = url[index];
          }
          success = true;
          break;
        } catch (error) {
          console.error(`Skipping ${url[index]}: ${error.message}`);
          index++;
        }
      }

      if (!success) {
        throw new ServiceUnavailableException(
          `Browser session closed early for all URLs: ${url}`,
        );
      }

      const html = textInformation.html;
      mainText = textInformation.mainText;
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
      context,
    });

    this.lmStudioWebDiscovery(
      title,
      allText,
      query,
      type,
      mode,
      context,
      createProcessDto,
      specificUrl,
    );
    return true;

    // const answer = await this.openaiService.productInStock(
    //   title,
    //   allText,
    //   query,
    //   type,
    //   mode,
    //   context
    // );

    // if (
    //   answer?.isNamedProduct === true &&
    //   answer?.productTypeMatchStrict === true &&
    //   answer?.isMainProductPage === true &&
    //   answer?.variantMatchStrict === true

    // ) {
    //   console.log(answer)
    //   return { ...answer, specificUrl: url };
    // }
    // console.error(answer)
  }

  async testTwo(
    url: string,
    query: string,
    type: ProductType,
    mode: string,
    shopifySite: boolean,
    hash: string,
    confirmed: boolean,
    count: number,
    shopWebsite: string,
    webPageId: string,
    cloudflare: boolean,
  ): Promise<boolean> {
    // Note, the html discovery part should be it's own function
    // This is for testing for now
    // Think the router has to be added here
    let html: string;
    let mainText: string;

    console.log(`shopifySite: ${shopifySite}`);
    let title: string;
    let allText: string;

    if (shopifySite) {
      console.log('extractShopifyWebsite activated');
      await new Promise((r) => setTimeout(r, 50));
      const result = await this.utilService.extractShopifyWebsite(url);
      this.updateWebpageSend({
        url,
        inStock: result.available ? result.available : false,
        price: result.price / 100,
        productName: query,
        hash: 'shopify',
        count: 0,
        shopifySite,
        shopWebsite,
        webPageId,
      });
      return true;
    } else {
      console.log('getPageInfo activated');
      let textInformation: {
        html: string;
        mainText: string;
      };
      try {
        if (cloudflare) {
          textInformation = await this.browserService.getPageInfo(url);
        } else {
          textInformation = await this.browserService.getPageHtml(url);
        }
      } catch (error) {
        throw new ServiceUnavailableException(
          `Browser session closed early for ${url}`,
        );
      }
      html = textInformation.html;
      mainText = textInformation.mainText;
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
      url,
    });

    // Create Hash from maintext. We shall assume this text must change if something has changed
    const currentHash = crypto
      .createHash('sha256')
      .update(allText)
      .digest('hex');

    if (currentHash === hash && confirmed === true) {
      console.log({
        message: 'no-need-to-continue',
        webpage: url,
      });
      throw new Error('no-need-to-continue');
    }
    hash = currentHash;

    this.lmStudioCheckProduct(
      title,
      allText,
      query,
      type,
      mode,
      url,
      hash,
      count,
      shopifySite,
      shopWebsite,
      webPageId,
    );

    return true;

    // const answer = await this.openaiService.checkProduct(
    //   title,
    //   allText,
    //   query,
    //   type,
    //   mode,
    // );

    // console.log(answer)

    // if (url.includes('games-island')) answer.price = Math.round(answer.price * 0.81)

    // return { ...answer, productName: query, specificUrl: url, url, hash, count: count, shopifySite };
  }

  async lmStudioCheckProduct(
    title: string,
    allText: string,
    query: string,
    type: ProductType,
    mode: string,
    url: string,
    hash: string,
    count: number,
    shopifySite: boolean,
    shopWebsite: string,
    webPageId: string,
  ): Promise<void> {
    const answer = await this.openaiService.checkProduct(
      title,
      allText,
      query,
      type,
      mode,
    );
    if (url.includes('games-island'))
      answer.price = Math.round(answer.price * 0.81);
    const updatePackage: UpdatePagePayloadInterface = {
      url,
      shopWebsite,
      inStock: answer.inStock,
      price: answer.price,
      productName: query,
      webPageId: webPageId,
      hash: hash,
      count,
      shopifySite,
    };
    await this.updateWebpageSend(updatePackage);
  }

  async updateWebpageSend(
    updatePackage: UpdatePagePayloadInterface,
  ): Promise<void> {
    await fetch(
      `http://localhost:3000/webpage-cache/update-single-page-and-cache/${updatePackage.webPageId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePackage),
      },
    );
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
    fast: boolean,
    createProcessDto: CreateProcessDto,
    cloudflare: boolean,
  ): Promise<boolean> {
    console.log(`https://${base}${seed}`);

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

    const reducedUrls = this.utilService.reduceSitemap(
      foundSitemapUrls.websiteUrls,
      query,
    );

    console.log(`ReducedUrls: ${reducedUrls.length}`);

    const bestSites = await this.openaiService.crawlFromSitemap(
      reducedUrls,
      query,
      mode,
      `${base}${seed}`,
      context,
    );

    const urls = bestSites.map((site) => site.url);

    console.log(urls);
    await this.test(
      urls,
      query,
      type,
      'mini',
      context,
      shopifySite,
      createProcessDto,
      cloudflare,
    );
    return true;
    // if (answer) {
    //   console.log('Product Found');
    //   // foundProducts.push({ ...answer, website: `${singleUrl.url}` });
    //   // console.log(foundProducts);
    //   return answer;
    // }

    // Temp change to see if odd websites do not get added
    throw new Error('no_site_found');
    if (shopifySite) throw new Error('nothing_else_to_do');

    const bestSitesAllLinks = [];

    console.log(bestSites.length > 0);

    if (bestSites.length > 0) {
      for (const site of bestSites) {
        if (site.score < 0.8 || shopifySite === true) continue;
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

    const reducedUrlsbestSitesAllLinks = this.utilService.reduceSitemap(
      bestSitesAllLinks,
      query,
    );

    console.log(reducedUrlsbestSitesAllLinks);

    const uniqueBestSitesAllLinks = [...new Set(reducedUrlsbestSitesAllLinks)];
    console.log(uniqueBestSitesAllLinks.length);

    if (uniqueBestSitesAllLinks.length === 0)
      throw new Error('No links found to process');

    const finalBestSites = await this.openaiService.crawlFromSitemap(
      uniqueBestSitesAllLinks,
      query,
      mode,
      `${base}${seed}`,
      context,
    );

    const mapFinalBestSites = finalBestSites.map((site) => {
      const normalisedUrl = this.utilService.normalizeUrl(
        site.url,
        `https://${base}`,
      );
      return normalisedUrl.startsWith('/')
        ? normalisedUrl.slice(1)
        : normalisedUrl;
    });

    const allUrls = this.utilService.gatherLinks(mapFinalBestSites);

    if (allUrls[0]) throw new Error('no link found');

    console.log(`https://${base}${allUrls[0]}`);
    const answer = await this.test(
      allUrls,
      query,
      type,
      'mini',
      context,
      shopifySite,
      createProcessDto,
      cloudflare,
    );
    if (answer) {
      console.log('Product Found');
      // foundProducts.push({ ...answer, website: `${base}${singleUrl}` });
      return true;
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

  async lmStudioWebDiscovery(
    title: string,
    allText: string,
    query: string,
    type: ProductType,
    mode: string,
    context: string,
    createProcessDto: CreateProcessDto,
    specificUrl: string,
  ): Promise<void> {
    let openaiAnswer: boolean;
    const answer = await this.openaiService.productInStock(
      title,
      allText,
      query,
      type,
      mode,
      context,
    );

    if (
      answer?.isNamedProduct === true &&
      answer?.productTypeMatchStrict === true &&
      answer?.isMainProductPage === true &&
      answer?.variantMatchStrict === true
    ) {
      console.log(answer);
      openaiAnswer = true;
    } else {
      console.error(answer);
      openaiAnswer = false;
    }

    if (openaiAnswer === true) {
      await this.webDiscoverySend({ ...answer, specificUrl }, createProcessDto);
    }
  }

  async updatePage(checkPageDto: CheckPageDto): Promise<boolean> {
    const result = await this.testTwo(
      checkPageDto.url,
      checkPageDto.query,
      checkPageDto.type,
      'mini',
      checkPageDto.shopifySite,
      checkPageDto.hash,
      checkPageDto.confirmed,
      checkPageDto.count,
      checkPageDto.shopWebsite,
      checkPageDto.webPageId,
      checkPageDto.cloudflare,
    );
    return result;
  }

  async ebayStatCalc(product: ProductDto) {
    const ebayProductPrices: EbayProductStrip[] =
      await this.ebayService.productPrices(product);

    // https://www.ebay.co.uk/sch/i.html?_nkw=magic+the+gathering+innistrad+remastered+play+booster+box&rt=nc&LH_Sold=1&LH_Complete=1

    const url = `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(product.name)}&rt=nc&LH_Sold=1&LH_Complete=1`;

    let soldEbayProductPrices: {
      html: string;
      mainText: string;
    };
    try {
      soldEbayProductPrices = await this.browserService.getPageInfo(url);
    } catch (error) {
      throw new ServiceUnavailableException(
        `Browser session closed early for ${url}`,
      );
    }

    console.log(soldEbayProductPrices.mainText);

    // const soldEbayProductPrices: EbaySoldProductStrip[] = await this.ebayService.soldProductPrice(product)

    const pricePoints = await this.openaiService.ebayPricePoint(
      ebayProductPrices,
      product,
    );
    console.log(pricePoints);

    const soldPricePoints = await this.openaiService.ebaySoldPricePoint(
      soldEbayProductPrices.mainText,
      product,
    );
    console.log(soldPricePoints);

    const soldPricePointsLastSevenDays = this.utilService.datesBetween(
      soldPricePoints,
      7,
    );
    const soldPricePointsLast28Days = this.utilService.datesBetween(
      soldPricePoints,
      28,
    );

    const totalQuantityFunc = (soldPricePoints: EbaySoldProductStrip[]) => {
      return soldPricePoints.reduce(
        (sum, p) => sum + p.price.estimatedSoldQuantity,
        0,
      );
    };

    const weightAvgPriceFunc = (
      soldPricePoints: EbaySoldProductStrip[],
      totalQuantity: number,
    ) => {
      return (
        soldPricePoints.reduce(
          (sum, p) => sum + p.price.value * p.price.estimatedSoldQuantity,
          0,
        ) / totalQuantity
      );
    };

    const spreadScoreFunc = (
      soldPricePoints: EbaySoldProductStrip[],
      totalQuantity: number,
      weightedAvgPrice: number,
    ) => {
      if (totalQuantity === 0 || !weightedAvgPrice) return 0; // avoid div by 0

      const variance =
        soldPricePoints.reduce(
          (sum, p) =>
            sum +
            p.price.estimatedSoldQuantity *
              Math.pow(p.price.value - weightedAvgPrice, 2),
          0,
        ) / totalQuantity;

      const spread = Math.sqrt(variance);
      return (spread / weightedAvgPrice) * 100;
    };

    const soldSevenDays = totalQuantityFunc(soldPricePointsLastSevenDays);
    const averageSevenDaysSoldPrice = weightAvgPriceFunc(
      soldPricePointsLastSevenDays,
      soldSevenDays,
    );
    const sevenDaySpreadScore = spreadScoreFunc(
      soldPricePointsLastSevenDays,
      soldSevenDays,
      averageSevenDaysSoldPrice,
    );

    const sevenDays = {
      soldSevenDays: soldSevenDays,
      averageSevenDaysSoldPrice: !averageSevenDaysSoldPrice
        ? 0
        : averageSevenDaysSoldPrice,
      sevenDaySpreadScore: !sevenDaySpreadScore ? 0 : sevenDaySpreadScore,
    };

    //

    const soldTwentyEightDays = totalQuantityFunc(soldPricePointsLast28Days);
    const averageTwentyEightDaysSoldPrice = weightAvgPriceFunc(
      soldPricePointsLast28Days,
      soldTwentyEightDays,
    );
    const twentyEightDaysSpreadScore = spreadScoreFunc(
      soldPricePointsLast28Days,
      soldTwentyEightDays,
      averageTwentyEightDaysSoldPrice,
    );

    const twentyEightDays = {
      soldTwentyEightDays: soldTwentyEightDays,
      averageTwentyEightDaysSoldPrice: !averageTwentyEightDaysSoldPrice
        ? 0
        : averageTwentyEightDaysSoldPrice,
      twentyEightDaysSpreadScore: !twentyEightDaysSpreadScore
        ? 0
        : twentyEightDaysSpreadScore,
    };

    const pricePointTest = {
      minPrice: pricePoints.minPrice,
      maxPrice: pricePoints.maxPrice,
      ...sevenDays,
      ...twentyEightDays,
    };

    console.log(soldPricePointsLastSevenDays);
    console.log(pricePointTest);

    // Temp for test
    try {
      await fetch(
        `http://localhost:3000/ebay-stats/patch-and-update-price-points/${product.ebayStat.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pricePointTest),
        },
      );
    } catch (error) {
      console.error(error);
    }
    return pricePoints;
  }

  async cloudflareTest(shopDto: ShopDto) {
    const cloudflareStatusResult = await this.browserService.cloudflareTest(
      `${shopDto.protocol}${shopDto.website}`,
    );
    await fetch(`http://localhost:3000/shop/${shopDto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cloudflare: cloudflareStatusResult }),
    });
    // Is the website able to load
    return cloudflareStatusResult;
  }

  create(createProcessDto: CreateProcessDto) {}

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
