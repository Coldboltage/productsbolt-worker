import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JSDOM } from 'jsdom';
import { htmlToText } from 'html-to-text';
import { ParsedLinks, ProductType } from '../app.type.js';
import { BrowserService } from '../browser/browser.service.js';
import { UtilsService } from '../utils/utils.service.js';
import { CreateProcessDto } from './dto/create-process.dto.js';
import { UpdateProcessDto } from './dto/update-process.dto.js';
import { CheckPageDto } from './dto/check-page.dto.js';
import { ShopDto } from './dto/shop.dto.js';
import {
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
import { ClientProxy } from '@nestjs/microservices';
import {
  LmStudioReduceLinksPayload,
  LmStudioWebDiscoveryPayload,
} from 'src/lm-studio/entities/lm-studio.entity.js';
import { OpenaiService } from '../openai/openai.service.js';
import * as cheerio from 'cheerio';
import { ProductListingsCheckDto } from './dto/product-listings-check.dto.js';
import { FullCandidatePageDto } from './dto/candidate-page.dto.js';
import { ShopifyProduct } from 'src/utils/utils.type.js';
import { LmStudioCheckProductDto } from './dto/lm-studio-check-product.dto.js';
import { ShopifyMetaDto } from './dto/shopify-meta.dto.js';

@Injectable()
export class ProcessService implements OnModuleInit {
  private readonly logger = new Logger(ProcessService.name);

  constructor(
    @Inject('LM_STUDIO_CLIENT') private lmStudioClient: ClientProxy,
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
    this.logger.log(`shopifySearch Result: ${result}`);
    const setup = await fetch(
      `http://${process.env.API_IP}:3000/sitemap/shopify-or-not/${shopDto.sitemapEntity.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.JWT_TOKEN}`,
        },
        body: JSON.stringify({ isShopifySite: result }),
      },
    );
    // if (result === true) {
    //   await fetch(
    //     `http://${process.env.API_IP}:3000/sitemap/test-shopify-site-collection/${shopDto.id}`,
    //     {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //     },
    //   );
    // }
    if (setup.ok === true) return true;
    throw new Error('update_to_server_failed');
  }

  async hasSitemapChanged(sitemapUrl: string, etag: string) {
    const headers = {};
    if (etag) headers['If-None-Match'] = etag;
    const sitemapStatus = await fetch(sitemapUrl, {
      method: 'HEAD',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.JWT_TOKEN}`,
      },
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
      this.logger.log(`header change: ${newEtag} ${lastMod} ${contentLength}`);
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
    // this.logger.log(test)
    return test;
  }

  async manualSitemapSearch(shopDto: ShopDto) {
    const checkSitemapUrlsCombined: string[] = [shopDto.sitemapEntity.sitemap];
    const urls: string[] = [];

    this.logger.log(shopDto.sitemapEntity);

    if (
      shopDto.sitemapEntity.additionalSitemaps &&
      shopDto.sitemapEntity.additionalSitemaps.length > 0
    ) {
      checkSitemapUrlsCombined.push(
        ...shopDto.sitemapEntity.additionalSitemaps,
      );
    }

    for (const sitemapUrl of checkSitemapUrlsCombined) {
      const links = await this.browserService.getLinksFromPage(
        sitemapUrl,
        shopDto.country,
        shopDto.currency,
        false,
      );
      this.logger.log(shopDto.website);
      const cleanLinks = this.utilService.filterObviousNonPages(
        links,
        `https://${shopDto.website}`,
      );
      this.logger.log(
        `Found ${cleanLinks.length} links in sitemap ${sitemapUrl}`,
      );
      this.logger.log(cleanLinks);
      urls.push(...cleanLinks);
    }

    return urls;
  }

  async sitemapSearch(shopDto: ShopDto) {
    this.logger.log(shopDto.sitemapEntity);
    // await this.hasSitemapChanged(shopDto.sitemap, shopDto.etag)
    let sitemapUrls: {
      websiteUrls: string[];
      fast: boolean;
    };
    try {
      sitemapUrls = await this.utilService.getUrlsFromSitemap(
        shopDto.sitemapEntity.sitemap,
        `https://${shopDto.website}${shopDto.category}`,
        90,
        shopDto.sitemapEntity.fast,
        shopDto.cloudflare,
      );
    } catch (error) {
      this.logger.log(error);
      sitemapUrls = {
        websiteUrls: [''],
        fast: true,
      };
    }
    return sitemapUrls;
  }

  async findLinks(createProcessDto: CreateProcessDto, mode: string) {
    const { url, category, name, type, context, crawlAmount, shopType } =
      createProcessDto;
    const {
      sitemap,
      isShopifySite: shopifySite,
      sitemapUrls,
      fast,
    } = createProcessDto.sitemapEntity;

    // if (shopType === UniqueShopType.EBAY) {
    //   const result = await this.ebayService.getUrlsFromApiCall(
    //     name,
    //     context,
    //     type,
    //   );
    //   for (const webpage of result) {
    //     await this.webDiscoverySend(webpage, createProcessDto);
    //     return true;
    //   }
    // }

    const result = await this.reduceLinks(
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
        await this.utilService.webDiscoverySend(webpage, createProcessDto);
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
      createProcessDto.links,
      createProcessDto.hash,
      createProcessDto.confirmed,
      createProcessDto.count,
      createProcessDto.candidatePages,
      createProcessDto.expectedPrice,
      createProcessDto.headless,
      createProcessDto.country,
      createProcessDto.currency,
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
    hash: string,
    confirmed: boolean,
    count: number,
    candidatePages: FullCandidatePageDto[],
    expectedPrice: number,
    headless: boolean,
    country: string,
    currency: string,
  ): Promise<boolean> {
    // Think the router has to be added here
    let html: string;
    let mainText: string;

    this.logger.log(`shopifySite: ${shopifySite}`);
    let title: string;
    let allText: string;
    let success = false;
    let index = 0;
    let textInformation: {
      html: string;
      mainText: string;
      base64Image: string;
    };
    let info: {
      title: string;
      mainText: string;
      shopifyProduct?: ShopifyProduct;
    };
    let specificUrl: string;
    let candidatePage;
    let variantId: null | string = null;
    let imageData: string;

    if (shopifySite && cloudflare === false) {
      this.logger.log('extractShopifyWebsite activated');
      while (index < url.length) {
        try {
          info = await this.utilService.extractShopifyWebsite(
            url[index],
            country,
            currency,
          );
          textInformation = {
            html: info.title,
            mainText: info.mainText,
            base64Image: '',
          };
          specificUrl = url[index];
          success = true;

          if (info.shopifyProduct.variants.length === 1) {
            title = info.title;
            allText = `${textInformation.mainText}. Price is ${info.shopifyProduct.price / 100}, InStock Status: ${info.shopifyProduct.available}`;
            variantId = String(info.shopifyProduct.variants[0].id);
            imageData = '';
          } else {
            // We need to make an immediate LLM Call and we need the state.
            const test = await this.openaiService.whichVariant(
              query,
              context,
              info.shopifyProduct.variants,
              type,
            );
            title = info.title;
            allText = `${textInformation.mainText}. Price is ${info.shopifyProduct.variants[test.index].price / 100}, InStock Status: ${info.shopifyProduct.variants[test.index].available}`;
            variantId = String(info.shopifyProduct.variants[test.index].id);

            const featuredImageUrl = (
              shopifyProduct: ShopifyProduct,
            ): string | null => {
              // Check if variant even has a featured image
              if (shopifyProduct.variants[test.index].featured_image === null) {
                // Check featured image is a string or null
                if (shopifyProduct.featured_image) {
                  if (typeof shopifyProduct.featured_image === 'string') {
                    // return string
                    return `https:${info.shopifyProduct.featured_image}`;
                  } else {
                    return `https:${info.shopifyProduct.featured_image['src']}`;
                  }
                } else {
                  // return null
                  return null;
                }
                // We're using variant featured image.
                // Check if featured_image a string
              } else if (
                typeof shopifyProduct.variants[test.index].featured_image ===
                'string'
              ) {
                // Return string
                return shopifyProduct.variants[test.index]
                  .featured_image as string;
              } else {
                // It's an object, get the src url from the object
                return shopifyProduct.variants[test.index].featured_image[
                  'src'
                ];
              }
            };

            // imageData = await this.utilService.imageUrlToDataUrl(
            //   info.shopifyProduct.variants[test.index].featured_image['src']
            //     ? info.shopifyProduct.variants[test.index].featured_image['src']
            //     : `https:${info.shopifyProduct.featured_image}`,
            // );

            const determinedImageUrl = featuredImageUrl(info.shopifyProduct);

            imageData = '';
          }

          candidatePage = candidatePages.find(
            (page) => page.url === specificUrl,
          );
          this.logger.log(candidatePage);

          break;
        } catch (error) {
          console.error(`Skipping ${url[index]}: ${error.message}`);
          index++;
        }
      }
      this.logger.log(variantId);
    } else {
      while (index < url.length) {
        try {
          if (cloudflare && headless === false) {
            this.logger.log('getPageInfo activated');
            // throw new Error('testing');
            textInformation = await this.browserService.getPageInfo(
              url[index],
              headless,
              country,
              currency,
              shopifySite,
            );
            specificUrl = url[index];
            imageData = ``;
          } else if (headless === true) {
            this.logger.log('getPageInfo activated');
            const testInformation = await this.browserService.getPageHtml(
              url[index],
              country,
              currency,
            );
            textInformation = { ...testInformation, base64Image: '' };
            imageData = ``;
            specificUrl = url[index];
          }
          success = true;
          break;
        } catch (error) {
          if (error instanceof HttpException) {
            if (error.getStatus() === 403) throw new Error('cloudflare block');
          }
          console.error(`Skipping ${url[index]}: ${error.message}`);
          index++;
        }
        throw new Error('no_get_page_method_avaiable');
      }

      if (!success) {
        throw new ServiceUnavailableException(
          `Browser session closed early for all URLs: ${url}`,
        );
      }

      candidatePage = candidatePages.find((page) => page.url === specificUrl);
      this.logger.log(candidatePage);

      const html = textInformation.html;
      mainText = textInformation.mainText;
      const dom = new JSDOM(html);
      const document = dom.window.document;
      title = document.title;
      this.logger.log('Page title:', title);

      allText = htmlToText(mainText, {
        wordwrap: false,
      });
    }

    this.logger.log({
      title,
      allText,
      query,
      type,
      mode,
      context,
    });

    // Create Hash from maintext. We shall assume this text must change if something has changed
    const currentHash = crypto
      .createHash('sha256')
      .update(allText)
      .digest('hex');

    if (
      currentHash === candidatePage?.candidatePageCache?.hash &&
      candidatePage?.candidatePageCache?.confirmed === true
    ) {
      this.logger.log({
        message: 'no-need-to-continue',
        webpage: url,
      });
      throw new Error('no-need-to-continue');
    }
    hash = currentHash;
    const countIteration = candidatePage?.candidatePageCache?.count || 0;

    this.logger.log(`countIteration = ${countIteration}`);

    const lmStudioWebDiscoveryPayload: LmStudioWebDiscoveryPayload = {
      title,
      allText,
      query,
      type,
      mode,
      context,
      createProcessDto,
      specificUrl,
      hash,
      countIteration,
      shopifySite,
      candidatePage,
      variantId,
      imageData,
      expectedPrice,
      cloudflare,
    };

    this.lmStudioClient.emit(
      'lmStudioWebDiscovery',
      lmStudioWebDiscoveryPayload,
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
    //   answer?.packagingTypeMatch === true &&
    //   answer?.isMainProductPage === true &&
    //   answer?.editionMatch === true

    // ) {
    //   this.logger.log(answer)
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
    variantId: null | string,
    headless: boolean,
    country: string,
    currency: string,
  ): Promise<boolean> {
    // Note, the html discovery part should be it's own function
    // This is for testing for now
    // Think the router has to be added here
    let html: string;
    let mainText: string;

    this.logger.log(`shopifySite: ${shopifySite}`);
    let title: string;
    let allText: string;

    if (shopifySite && cloudflare === false) {
      this.logger.log('extractShopifyWebsite activated');
      this.logger.log(`extractShopifyWebsite activated`);
      await new Promise((r) => setTimeout(r, 50));
      try {
        const result = await this.utilService.extractShopifyWebsite(
          url,
          country,
          currency,
        );
        this.logger.log('before variantProduct');
        const variantProduct = result.shopifyProduct.variants.find(
          (v) => String(v.id) === variantId,
        );

        this.logger.log(variantProduct);
        this.logger.log(
          `http://${process.env.API_IP}:3000/webpage-cache/update-single-page-and-cache/${webPageId}`,
        );
        this.logger.log({
          url,
          inStock: variantProduct.available ? variantProduct.available : false,
          price: variantProduct.price / 100,
          productName: query,
          hash: 'shopify',
          count: 0,
          shopifySite,
          shopWebsite,
          webPageId,
          pageAllText: result.mainText,
          pageTitle: result.title,
          lastScanned: new Date(),
        });

        await this.updateWebpageSend({
          url,
          inStock: variantProduct.available ? variantProduct.available : false,
          price: variantProduct.price / 100,
          productName: query,
          hash: 'shopify',
          count: 0,
          shopifySite,
          shopWebsite,
          webPageId,
          pageAllText: result.mainText,
          pageTitle: result.title,
          lastScanned: new Date(),
        });
      } catch (error) {
        this.logger.log('extractShopifyWebsite failed');
        if (
          error instanceof NotFoundException ||
          error instanceof UnauthorizedException
        ) {
          try {
            const response = await fetch(
              `http://${process.env.API_IP}:3000/webpage-cache/update-single-page-and-cache/${webPageId}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${process.env.JWT_TOKEN}`,
                },
                body: JSON.stringify({ price: 0, inStock: false }),
              },
            );
            this.logger.log({
              responseCode: response.status,
              url: url,
            });
          } catch (error) {
            this.logger.error({ error, url: url });
          }
        } else {
          throw new Error(`could_not_fetch_shopify_product: ${url}`);
        }
      }

      return true;
    } else {
      this.logger.log('getPageInfo activated');
      let textInformation: {
        html: string;
        mainText: string;
      };
      try {
        if (cloudflare || headless) {
          textInformation = await this.browserService.getPageInfo(
            url,
            headless,
            country,
            currency,
            shopifySite,
          );
        } else {
          textInformation = await this.browserService.getPageHtml(
            url,
            country,
            currency,
          );
        }
      } catch (error) {
        if (
          error instanceof NotFoundException ||
          error instanceof UnauthorizedException
        ) {
          try {
            const response = await fetch(
              `http://${process.env.API_IP}:3000/webpage-cache/update-single-page-and-cache/${webPageId}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${process.env.JWT_TOKEN}`,
                },
                body: JSON.stringify({ price: 0, inStock: false }),
              },
            );
            this.logger.log({
              responseCode: response.status,
              url: url,
            });
          } catch (error) {
            this.logger.error({ error, url: url });
          }
        }

        throw new ServiceUnavailableException(
          `Browser session closed early for ${url}`,
        );
      }
      html = textInformation.html;
      mainText = textInformation.mainText;
      const dom = new JSDOM(html);
      const document = dom.window.document;
      title = document.title;
      this.logger.log('Page title:', title);

      allText = htmlToText(mainText, {
        wordwrap: false,
      });
    }

    this.logger.log({
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
      this.logger.log({
        message: 'no-need-to-continue',
        webpage: url,
      });
      throw new Error('no-need-to-continue');
    }
    hash = currentHash;

    const payload: LmStudioCheckProductDto = {
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
      cloudflare,
    };

    this.lmStudioClient.emit('lmStudioCheckProduct', payload);

    return true;

    // const answer = await this.openaiService.checkProduct(
    //   title,
    //   allText,
    //   query,
    //   type,
    //   mode,
    // );

    // this.logger.log(answer)

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
    cloudflare: boolean,
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

    let price: number;

    if (shopifySite && cloudflare === true) {
      price = answer.price / 100;
    } else {
      price = answer.price;
    }

    const updatePackage: UpdatePagePayloadInterface = {
      url,
      shopWebsite,
      inStock: answer.inStock,
      price: shopifySite && cloudflare === true ? price : answer.price,
      productName: query,
      webPageId: webPageId,
      hash: hash,
      count,
      shopifySite,
      pageAllText: allText,
      pageTitle: title,
      lastScanned: new Date(),
    };
    this.logger.log(`firing updateWebpageSend`);
    await this.updateWebpageSend(updatePackage);
  }

  async updateWebpageSend(
    updatePackage: UpdatePagePayloadInterface,
  ): Promise<void> {
    this.logger.log(
      `fired updateWebpageSend going to: http://${process.env.API_IP}:3000/webpage-cache/update-single-page-and-cache/${updatePackage.webPageId}`,
    );
    this.logger.log(updatePackage);
    try {
      const response = await fetch(
        `http://${process.env.API_IP}:3000/webpage-cache/update-single-page-and-cache/${updatePackage.webPageId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.JWT_TOKEN}`,
          },
          body: JSON.stringify(updatePackage),
        },
      );
      this.logger.log({
        responseCode: response.status,
        url: updatePackage.url,
      });
    } catch (error) {
      this.logger.error({ error, url: updatePackage.url });
    }
  }

  async reduceLinks(
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
    this.logger.log(`https://${base}${seed}`);

    let foundSitemapUrls: {
      websiteUrls: string[];
      fast: boolean;
    } = { websiteUrls: [], fast: false };

    foundSitemapUrls = await this.utilService.getUrlsFromSitemap(
      sitemap,
      `https://${base}${seed}`,
      crawlAmount,
      fast,
      cloudflare,
      sitemapUrls,
    );

    const reducedUrls = this.utilService.reduceSitemap(
      foundSitemapUrls.websiteUrls,
      query,
    );

    this.logger.log(`ReducedUrls: ${reducedUrls.length}`);

    // const momentOfTruth = foundSitemapUrls.websiteUrls.includes(
    //   'https://bossminis.co.uk/products/magic-the-gathering-edge-of-eternities-collector-booster-pack-releases-01-08-20205',
    // );

    // this.logger.log(momentOfTruth);

    // await new Promise((r) => setTimeout(r, 20000000));

    const lmStudioReduceLinksPayload: LmStudioReduceLinksPayload = {
      reducedUrls: reducedUrls,
      query: query,
      mode: mode,
      url: `${base}${seed}`,
      context: context,
      shopProductId: createProcessDto.shopProductId,
    };

    this.logger.log(
      `Sending to LM Studio Reduce Links: ${lmStudioReduceLinksPayload.shopProductId}}`,
    );

    this.lmStudioClient.emit('lmStudioReduceLinks', lmStudioReduceLinksPayload);

    return true;
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
    links: string[],
    hash: string,
    confirmed: boolean,
    count: number,
    candidatePages: FullCandidatePageDto[],
    expectedPrice: number,
    headless: boolean,
    country: string,
    currency: string,
  ): Promise<boolean> {
    this.logger.log(`https://${base}${seed}`);

    const urls = links;
    let bestSites: ParsedLinks[];

    if (links.length === 0) {
      throw new Error(`No Link Provided: ${query} - ${base}${seed}`);
      // let foundSitemapUrls: {
      //   websiteUrls: string[];
      //   fast: boolean;
      // } = { websiteUrls: [], fast: false };

      // foundSitemapUrls = await this.utilService.getUrlsFromSitemap(
      //   sitemap,
      //   `https://${base}${seed}`,
      //   crawlAmount,
      //   fast,
      //   sitemapUrls,
      // );

      // const reducedUrls = this.utilService.reduceSitemap(
      //   foundSitemapUrls.websiteUrls,
      //   query,
      // );

      // this.logger.log(`ReducedUrls: ${reducedUrls.length}`);

      // bestSites = await this.openaiService.crawlFromSitemap(
      //   reducedUrls,
      //   query,
      //   mode,
      //   `${base}${seed}`,
      //   context,
      // );

      // urls = bestSites.map((site) => site.url);
    }

    this.logger.log(urls);
    await this.test(
      urls,
      query,
      type,
      'mini',
      context,
      shopifySite,
      createProcessDto,
      cloudflare,
      hash,
      confirmed,
      count,
      candidatePages,
      expectedPrice,
      headless,
      country,
      currency,
    );
    return true;
    // if (answer) {
    //   this.logger.log('Product Found');
    //   // foundProducts.push({ ...answer, website: `${singleUrl.url}` });
    //   // this.logger.log(foundProducts);
    //   return answer;
    // }

    // Temp change to see if odd websites do not get added
    throw new Error('no_site_found');
    if (shopifySite) throw new Error('nothing_else_to_do');

    const bestSitesAllLinks = [];

    this.logger.log(bestSites.length > 0);

    if (bestSites.length > 0) {
      for (const site of bestSites) {
        if (site.score < 0.8 || shopifySite === true) continue;
        bestSitesAllLinks.push(
          ...(await this.browserService.getLinksFromPage(
            site.url,
            country,
            currency,
            shopifySite,
          )),
        );
        this.logger.log(bestSitesAllLinks.length);
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

    this.logger.log(reducedUrlsbestSitesAllLinks);

    const uniqueBestSitesAllLinks = [...new Set(reducedUrlsbestSitesAllLinks)];
    this.logger.log(uniqueBestSitesAllLinks.length);

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

    this.logger.log(`https://${base}${allUrls[0]}`);
    const answer = await this.test(
      allUrls,
      query,
      type,
      'mini',
      context,
      shopifySite,
      createProcessDto,
      cloudflare,
      createProcessDto.hash,
      createProcessDto.confirmed,
      createProcessDto.count,
      createProcessDto.candidatePages,
      createProcessDto.expectedPrice,
      false,
      'abc',
      'abc',
    );
    if (answer) {
      this.logger.log('Product Found');
      // foundProducts.push({ ...answer, website: `${base}${singleUrl}` });
      return true;
    }

    // for (const singleUrl of allUrls) {
    //   this.logger.log(`https://${base}${singleUrl}`);
    //   const answer = await this.test(`https://${base}${singleUrl}`, query, type);
    //   if (answer) {
    //     this.logger.log('Product Found');
    //     // foundProducts.push({ ...answer, website: `${base}${singleUrl}` });
    //     return answer;
    //   }
    // }

    // this.logger.log(foundProducts);
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
      checkPageDto.variantId,
      checkPageDto.headless,
      checkPageDto.country,
      checkPageDto.currency,
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
      soldEbayProductPrices = await this.browserService.getPageInfo(
        url,
        false,
        'fix',
        'fix',
        false,
      );
    } catch (error) {
      throw new ServiceUnavailableException(
        `Browser session closed early for ${url}`,
      );
    }

    this.logger.log(soldEbayProductPrices.mainText);

    // const soldEbayProductPrices: EbaySoldProductStrip[] = await this.ebayService.soldProductPrice(product)

    const pricePoints = await this.openaiService.ebayPricePoint(
      ebayProductPrices,
      product,
    );
    this.logger.log(pricePoints);

    const soldPricePoints = await this.openaiService.ebaySoldPricePoint(
      soldEbayProductPrices.mainText,
      product,
    );
    this.logger.log(soldPricePoints);

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

    this.logger.log(soldPricePointsLastSevenDays);
    this.logger.log(pricePointTest);

    // Temp for test
    try {
      await fetch(
        `http://${process.env.API_IP}:3000/ebay-stats/patch-and-update-price-points/${product.ebayStat.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.JWT_TOKEN}`,
          },
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
    await fetch(`http://${process.env.API_IP}:3000/shop/${shopDto.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.JWT_TOKEN}`,
      },
      body: JSON.stringify({ cloudflare: cloudflareStatusResult }),
    });
    // Is the website able to load
    return cloudflareStatusResult;
  }

  onModuleInit() {
    const selectors: {
      listSelector: string;
      listItemNameSelector: string;
      listItemHrefSelector: string;
      priceSelector: string;
    } = {
      listSelector: '#p-l > .col-12',
      listItemNameSelector: '.title ',
      listItemHrefSelector: '.title',
      priceSelector: '.price-row',
    };

    const productListingsCheckDto: ProductListingsCheckDto = {
      urls: [
        'https://games-island.eu/en/c/Magic-The-Gathering/MtG-Booster-Boxes-English',
      ],
      existingUrls: [],
      selectors,
      shopId: '84b97a74-2303-4004-8721-f5680ad03d32',
      urlStructure: 'https://games-island.eu/',
    };

    // this.checkShopProductListings(productListingsCheckDto);
  }

  async checkShopProductListings(
    productListingsCheckDto: ProductListingsCheckDto,
  ): Promise<void> {
    // Setup
    const { urls, selectors, existingUrls, shopId, urlStructure } =
      productListingsCheckDto;

    // We need to identify what type of shop it is. We will do this later

    // Non Cloudflare protected, let's use a normal get request.
    const shopListings: {
      listingName: string;
      listingPrice: string;
      linkListing: string;
    }[] = [];

    this.logger.log(urls);
    for (const url of urls) {
      let response: Response;

      try {
        response = await fetch(url);
      } catch (error) {
        throw new Error('fetch_failed');
      }

      const html = await response.text();

      this.logger.log('Fetched HTML length:', html.length);

      const $ = cheerio.load(html);
      const items = $(selectors.listSelector);
      this.logger.log(selectors.listSelector);
      this.logger.log(`Found ${items.length} items`);
      for (const el of items) {
        const listingName = $(el).find(selectors.listItemNameSelector).text();
        const listingPrice = $(el)
          .find(selectors.priceSelector)
          .text()
          .replace(/\s+/g, ' ') // collapse all whitespace to single spaces
          .trim();
        let linkListing = $(el)
          .find(selectors.listItemHrefSelector)
          .attr('href');

        try {
          new URL(linkListing);
        } catch {
          linkListing = urlStructure + linkListing;
        }

        shopListings.push({ listingName, listingPrice, linkListing });
      }
    }

    const newListing = shopListings.filter((listing) => {
      return !existingUrls.includes(listing.linkListing);
    });

    this.logger.log(newListing);

    if (newListing.length > 0) {
      await fetch(
        `http://${process.env.API_IP}:3000/shop-listing/add-product-listing/${shopId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.JWT_TOKEN}`,
          },
          body: JSON.stringify({ newListing }),
        },
      );
    }
  }

  async shopifyMeta(shopifyMetaDto: ShopifyMetaDto) {
    try {
      const metaInformation = await this.utilService.extractShopifyMeta(
        shopifyMetaDto.url,
      );
      this.logger.log({ ...metaInformation });
      await fetch(
        `http://${process.env.API_IP}:3000/shop/${shopifyMetaDto.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.JWT_TOKEN}`,
          },
          body: JSON.stringify({ ...metaInformation, id: shopifyMetaDto.id }),
        },
      );
    } catch (error) {
      this.logger.error(error);
    }
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
