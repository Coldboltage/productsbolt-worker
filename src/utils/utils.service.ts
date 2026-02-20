import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HttpsProxyAgent } from 'hpagent';
import {
  ShopifyProduct,
  ShopifyProductCollectionsFullCall,
} from './utils.type.js';
// import { stripHtml } from 'string-strip-html';
import { EbaySoldProductStrip } from '../ebay/entities/ebay.entity.js';
import { CreateCandidatePageDto } from 'src/process/dto/create-candidate-page.dto.js';
import { CreateProcessDto } from 'src/process/dto/create-process.dto.js';
import { ProductInStockWithAnalysisStripped } from 'src/process/entities/process.entity.js';
import { connect } from 'puppeteer-real-browser';
import { XMLParser } from 'fast-xml-parser';

@Injectable()
export class UtilsService {
  private readonly logger = new Logger(UtilsService.name);
  constructor() {}
  gatherLinks = (urls: string[]): string[] => {
    // Remove duplicates
    return [...new Set(urls)];
  };

  normalizeUrl = (url: string, domain: string): string => {
    // Remove protocol and www from domain for flexibility
    const domainPattern = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '');

    // Create regex to match domain with optional protocol and www
    const regex = new RegExp(`^(https?:\\/\\/)?(www\\.)?${domainPattern}`, 'i');

    if (regex.test(url)) {
      // Remove domain from start, keep rest (including leading slash)
      return url.replace(regex, '');
    }

    // Otherwise return as is (likely relative)
    return url;
  };

  reduceSitemap(urls: string[], query: string) {
    type Product = { url: string; keywords: string[] };

    const extractKeywords = (rawUrl: string): string[] => {
      const noQuery = rawUrl.split(/[?#]/)[0].replace(/\/+$/, '');
      const parts = noQuery.split('/').filter(Boolean);

      // grab last non-ID segment (slug)
      let name = decodeURIComponent(parts.pop() || '');
      const looksLikeId = (s: string) =>
        /^[0-9]+$/.test(s) || // numeric
        /^[a-f0-9]{24}$/i.test(s) || // Mongo ObjectId
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          s,
        ) || // UUID
        (!s.includes('-') && /^[A-Za-z0-9_]{6,64}$/.test(s)); // opaque hash-like

      while (name && looksLikeId(name) && parts.length) {
        name = decodeURIComponent(parts.pop() || '');
      }

      if (!name) return [];

      const cleaned = name
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’'`]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

      return cleaned ? cleaned.split(/\s+/) : [];
    };

    const requiredMatches = (n: number) => Math.max(1, Math.floor(0.65 * n));

    const countMatches = (productKeys: string[], queryKeys: string[]) =>
      queryKeys.filter((k) => productKeys.includes(k)).length;

    const filterProducts = (urls: string[], query: string): string[] => {
      const products = urls.map((url) => ({
        url,
        keywords: extractKeywords(url),
      }));
      const queryKeys = extractKeywords(query);
      const minMatches = requiredMatches(queryKeys.length);
      this.logger.log(queryKeys);
      this.logger.log(minMatches);
      return products
        .filter((p) => countMatches(p.keywords, queryKeys) >= minMatches)
        .map((p) => p.url);
    };
    const result = filterProducts(urls, query);
    return result;
  }

  filterObviousNonPages = (urls: string[], prefix: string): string[] => {
    const EXCLUDED_EXT = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.svg',
      '.ico',
      '.webp',
      '.bmp',
      '.tiff',
      '.avif',
      '.mp4',
      '.webm',
      '.ogg',
      '.mov',
      '.avi',
      '.mkv',
      '.mp3',
      '.wav',
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.ppt',
      '.pptx',
      '.zip',
      '.rar',
      '.7z',
      '.tar',
      '.gz',
      '.woff',
      '.woff2',
      '.ttf',
      '.eot',
      '.css',
      '.js',
      '.json',
      '.txt',
      '.xml',
    ];

    this.logger.log(`Amount of URLs before vetted: ${urls.length}`);

    // Step 1: Filter URLs that start with the prefix
    this.logger.log(`Before startsWith: ${urls.length}`);
    const filteredByPrefix = urls.filter((url) => {
      // return url.startsWith(prefix)
      return url.startsWith(prefix);
    });
    this.logger.log(`prefix is: ${prefix}`);
    this.logger.log('After prefix filter:', filteredByPrefix.length);

    // Step 2: Filter out URLs ending with excluded extensions
    const vettedUrls = filteredByPrefix.filter((url) => {
      const bare = url.split('?')[0].toLowerCase();
      return !EXCLUDED_EXT.some((ext) => bare.endsWith(ext));
    });
    this.logger.log('After extension filter:', vettedUrls.length);
    // this.logger.log(urls)
    this.logger.log(`Amount of URLs after vetted ${vettedUrls.length}`);
    return vettedUrls;
  };

  async testProxyFetch() {
    const proxyUrl = `http://c9c43b907848ee719c48:${process.env.PROXY_PASSWORD}@gw.dataimpulse.com:823`;

    // Pick agent based on **target** URL, not the proxy URL
    // const agent =
    //   new URL(target).protocol === 'https:'
    //     ? new HttpsProxyAgent({ proxy: proxyUrl, keepAlive: true })
    //     : new HttpProxyAgent({ proxy: proxyUrl, keepAlive: true });

    const agent = new HttpsProxyAgent({ proxy: proxyUrl, keepAlive: true });

    // const res = await fetch(target, { agent });
    // if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // this.logger.log(res.statusText)
    // this.logger.log('response via proxy:', await res.text());
    return agent;
  }

  async collectionsTest(websiteUrl: string) {
    const response = await fetch(
      `${websiteUrl}collections/all/products.json?limit=250`,
    );
    const status = response.status;
    this.logger.log({
      status,
      websiteUrl,
    });
    if (status === 200) {
      return true;
    } else {
      return false;
    }
  }

  // Hasn't proven to work well this. Decided to go headful
  async getUrlsFromShopify(websiteUrl: string, category: string) {
    // Rotate until we can't
    // We just need the URL but I think we need to test if this works or not for all sites so we'll do that first
    // We can do that via checking if we can even get collections and go from there
    let pageLength: number;
    const websiteUrls: string[] = [];
    for (let index = 1; pageLength !== 0; index++) {
      let response;
      try {
        response = await fetch(
          `${websiteUrl}/collections/all/products.json?limit=250&page=${index}`,
        );
        this.logger.log({
          status: response.status,
          website: websiteUrl,
          page: index,
        });
      } catch (error) {
        console.error(response.status);
      }
      const json: ShopifyProductCollectionsFullCall =
        (await response.json()) as ShopifyProductCollectionsFullCall;
      pageLength = json.products.length;
      json.products.forEach((product) =>
        websiteUrls.push(`${websiteUrl}${category}/${product.handle}`),
      );
      await new Promise((r) => setTimeout(r, 350));
    }
    // this.logger.log(websiteUrls)
    return websiteUrls;
  }

  async getUrlsFromSitemap(
    sitemapUrl: string,
    seed: string,
    crawlAmount: number,
    fast: boolean,
    cloudflare: boolean,
    importSites?: string[],
  ): Promise<{ websiteUrls: string[]; fast: boolean }> {
    this.logger.log(`fast state: ${fast}`);
    if (importSites && importSites.length > 0) {
      const filtered = this.filterObviousNonPages(importSites, seed);
      // this.logger.log(filtered)
      return {
        websiteUrls: filtered,
        fast,
      };
    }

    this.logger.log(
      `Crawling sitemap: ${sitemapUrl} for the last ${crawlAmount} days`,
      this.logger.log({
        importSites,
        importSitesLength: importSites?.length,
      }),
    );

    const agent = await this.testProxyFetch();

    let sites: string[] = [];
    let days = crawlAmount;
    let siteMapAmount = 0;
    let response;
    let pauseTimer = fast ? 1 : 60000;
    do {
      const now = new Date();
      const crawlAmountDaysAgo = new Date();
      crawlAmountDaysAgo.setDate(now.getDate() - days);

      this.logger.log(crawlAmountDaysAgo);

      const { default: Sitemapper } = await import('sitemapper');

      const sitemap = new Sitemapper({
        url: sitemapUrl,
        timeout: 60000,
        concurrency: 1,
        retries: 0,
        debug: true,
        // proxyAgent: { https: agent } as unknown as any
      });

      if (fast) {
        sitemap.proxyAgent = { https: agent } as unknown as any;
        sitemap.requestHeaders = {
          // Pick a normal desktop Chrome UA
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',

          // These help with dumb WAF rules
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.9',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        };
      }

      let scannedSites: string[] = [];

      if (fast && cloudflare) {
        const sites = await this.fetchSitemapViaBrowser(sitemapUrl);
        this.logger.log(sites);
        scannedSites = sites.urls.filter((site) => site.includes(seed));
      } else {
        try {
          response = await sitemap.fetch();
          this.logger.log(
            response.errors.length === 0 ? 'No Errors' : response.errors,
          );
          this.logger.log(`Amount of pages: ${response.sites.length}`);
          if (response.errors.length > 0)
            await new Promise((r) => setTimeout(r, pauseTimer));
          scannedSites = response.sites.filter((site) => site.includes(seed));
        } catch (error) {
          this.logger.error({ error, url: sitemapUrl }, { depth: 5 }); // should show a Z_DATA_ERROR or BrotliDecodeError
          throw new Error(error);
        }
      }

      // this.logger.log(scannedSites)
      this.logger.log(scannedSites.length);

      sites = scannedSites;
      siteMapAmount = scannedSites.length;
      days--;
    } while (siteMapAmount > 100000000000);

    const filtered = this.filterObviousNonPages(sites, seed);
    await new Promise((r) => setTimeout(r, pauseTimer));
    // this.logger.log(filtered)
    if (response?.errors?.length === 0) {
      return {
        websiteUrls: filtered,
        fast: fast === true ? true : false,
      };
    } else {
      return {
        websiteUrls: filtered,
        fast: true,
      };
    }
  }

  getUrlsList = (sites: string[], seed: string): string[] => {
    const filtered = this.filterObviousNonPages(sites, seed);
    // this.logger.log(filtered)
    return filtered;
  };

  async waitForCloudflareBypass(
    page: any,
    url: string,
    timeout = 60000,
    waitingTimeout = 2000,
    resolveTimeout = 10000,
  ) {
    this.logger.log('cloudflare protection waitForCloudflareBypass fired');

    if (url.includes('games-island')) {
      let finishedLoading = false;
      const start = Date.now();

      while (finishedLoading === false && Date.now() - start < timeout) {
        try {
          this.logger.log(`waiting for ${url} to load`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const bodyText = await page.evaluate(
            () => document.body?.innerText ?? '',
          );
          if (
            !bodyText.includes('Validating') ||
            !bodyText.includes('please wait')
          ) {
            finishedLoading = true;
          }
        } catch (error) {
          this.logger.log(error);
          const status = await page.staus();
          if (status > 399) {
            throw new NotFoundException(`Status of ${status} for ${url}`);
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));

          this.logger.log('retrying');
        }
      }

      if (finishedLoading === false && Date.now() - start < timeout) {
        throw new NotFoundException(`${url}_did_not_pass_test`);
      }

      this.logger.log('all good');
      return;
    }

    const start = Date.now();

    const firstTitle = await page.title();
    this.logger.log(firstTitle);

    if (!firstTitle.includes('...') && !firstTitle.includes('pardon')) {
      this.logger.log('no cloudflare');
      return;
    }

    while (Date.now() - start < timeout) {
      const title = await page.title();
      this.logger.log(title);

      if (title.includes('...') || title.includes('pardon')) {
        this.logger.log(`waiting on ${url}`);
        await new Promise((r) => setTimeout(r, waitingTimeout));
      } else {
        this.logger.log('passed');
        await new Promise((r) => setTimeout(r, resolveTimeout));
        return;
      }
    }

    this.logger.error('Timed out waiting for Cloudflare challenge');
    throw new Error('Timed out waiting for Cloudflare challenge');
  }

  extractShopifyWebsite = async (url: string) => {
    this.logger.log(url);
    try {
      const response = await fetch(`${url}.js`);
      this.logger.log(response.status);
      if (response.status >= 400)
        throw new ConflictException(
          `Above 400 status: ${url} with ${response.status}`,
        );
      const json: ShopifyProduct = (await response.json()) as ShopifyProduct;
      const title = json.title;
      const { stripHtml } = await import('string-strip-html');

      let mainText = stripHtml(json.description).result;
      // mainText = `${mainText}. Price is ${json.price / 100}, InStock Status: ${json.available}`;
      mainText = `${mainText}`;

      this.logger.log({ title, mainText });
      return { title, mainText, shopifyProduct: json };
    } catch (error) {
      this.logger.log(error);
      throw new Error('Could not fetch Shopify product');
      return {
        url,
        inStock: false,
        price: 0,
        available: false,
        title: 'default',
        mainText: 'default',
      };
    }
  };

  datesBetween(
    soldPricePoints: EbaySoldProductStrip[],
    days: number,
  ): EbaySoldProductStrip[] {
    return soldPricePoints.filter((product) => {
      const todayDate = new Date();
      const soldListingDate = new Date(product.price.soldDate);

      const differenceMs = todayDate.getTime() - soldListingDate.getTime();
      const diffDays = differenceMs / (1000 * 60 * 60 * 24);

      return diffDays <= days;
    });
  }

  async webDiscoverySend(
    webpage: ProductInStockWithAnalysisStripped,
    createProcessDto: CreateProcessDto,
  ) {
    const webPage: CreateCandidatePageDto = {
      url: webpage.specificUrl,
      shopWebsite: createProcessDto.shopWebsite,
      inStock: webpage.inStock,
      price: webpage.price,
      currencyCode: webpage.currencyCode,
      productName: createProcessDto.name,
      reason: webpage.analysis,
      productId: createProcessDto.productId,
      shopId: createProcessDto.shopId,
      shopProductId: createProcessDto.shopProductId,
      pageAllText: webpage.pageAllText,
      pageTitle: webpage.pageTitle,
      hash: webpage.hash,
      count: webpage.count,
      shopifySite: webpage.shopifySite,
      variantId: webpage.variantId,
      priceCheck: webpage.priceInRange,
      editionMatch: webpage.editionMatch,
      packagingTypeMatch: webpage.packagingTypeMatch,
      loadedData: webpage.loadedData,
      hasMixedSignals: webpage.hasMixedSignals,
    };
    this.logger.log(webPage);
    this.logger.log('webDiscoverySend called');
    try {
      await fetch(`http://${process.env.API_IP}:3000/webpage/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.JWT_TOKEN}`,
        },
        body: JSON.stringify(webPage),
      });
    } catch (error) {
      this.logger.log(error);
    }
  }

  async candidatePageDiscoverySend(
    webpage: ProductInStockWithAnalysisStripped,
    createProcessDto: CreateProcessDto,
  ) {
    const webPage: CreateCandidatePageDto = {
      url: webpage.specificUrl,
      shopWebsite: createProcessDto.shopWebsite,
      inStock: webpage.inStock,
      price: webpage.price,
      currencyCode: webpage.currencyCode,
      productName: createProcessDto.name,
      reason: webpage.analysis,
      productId: createProcessDto.productId,
      shopId: createProcessDto.shopId,
      shopProductId: createProcessDto.shopProductId,
      pageAllText: webpage.pageAllText,
      pageTitle: webpage.pageTitle,
      hash: webpage.hash,
      count: webpage.count,
      shopifySite: webpage.shopifySite,
      variantId: webpage.variantId,
      priceCheck: webpage.priceInRange,
      editionMatch: webpage.editionMatch,
      packagingTypeMatch: webpage.packagingTypeMatch,
      loadedData: webpage.loadedData,
      hasMixedSignals: webpage.hasMixedSignals,
    };
    this.logger.log(webPage);
    try {
      await fetch(`http://${process.env.API_IP}:3000/candidate-page/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.JWT_TOKEN}`,
        },
        body: JSON.stringify(webPage),
      });
    } catch (error) {
      this.logger.log(error);
    }
  }

  async imageUrlToDataUrl(imageUrl: string) {
    this.logger.log(imageUrl);

    if (imageUrl === null) return `data:image/png;base64,`;

    const res = await fetch(imageUrl, {
      headers: { 'user-agent': 'Mozilla/5.0' },
    });
    if (!res.ok) throw new Error(`Failed ${res.status} fetching ${imageUrl}`);

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
  }

  async fetchSitemapViaBrowser(indexUrl: string) {
    const { browser, page } = await connect({
      headless: false,
      turnstile: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true, // critical for xmlns
    });

    const extract = (xml: any): { urls: string[]; sitemaps: string[] } => {
      const urlNodes = xml?.urlset?.url ?? [];
      const urls = (Array.isArray(urlNodes) ? urlNodes : [urlNodes])
        .map((u: any) => u?.loc)
        .filter(Boolean);

      const smNodes = xml?.sitemapindex?.sitemap ?? [];
      const sitemaps = (Array.isArray(smNodes) ? smNodes : [smNodes])
        .map((s: any) => s?.loc)
        .filter(Boolean);

      return { urls, sitemaps };
    };

    // --- CDP Fetch-based body capture (prevents "evicted from inspector cache") ---
    const client = await page.target().createCDPSession();

    // We will capture the next matching response body here
    let waitingForUrl: string | null = null;
    let waitingResolve: ((body: string) => void) | null = null;
    let waitingReject: ((err: any) => void) | null = null;

    const waitForBody = (url: string, timeoutMs = 60_000) =>
      new Promise<string>((resolve, reject) => {
        waitingForUrl = url;
        waitingResolve = resolve;
        waitingReject = reject;

        const t = setTimeout(() => {
          if (waitingReject)
            waitingReject(new Error(`Timed out waiting for body: ${url}`));
          waitingForUrl = null;
          waitingResolve = null;
          waitingReject = null;
        }, timeoutMs);

        // wrap resolve/reject to clear timeout
        const origResolve = resolve;
        const origReject = reject;
        waitingResolve = (body: string) => {
          clearTimeout(t);
          origResolve(body);
        };
        waitingReject = (err: any) => {
          clearTimeout(t);
          origReject(err);
        };
      });

    try {
      await client.send('Fetch.enable', {
        patterns: [
          // We only care about main document navigations to sitemap URLs
          { requestStage: 'Response' },
        ],
      });

      client.on('Fetch.requestPaused', async (evt: any) => {
        try {
          const url: string = evt.request.url;

          // Always continue unless this is the one we're waiting for
          if (!waitingForUrl || url !== waitingForUrl) {
            await client.send('Fetch.continueRequest', {
              requestId: evt.requestId,
            });
            return;
          }

          // Get the body NOW (no eviction risk)
          const bodyResp = await client.send('Fetch.getResponseBody', {
            requestId: evt.requestId,
          });

          // Continue so the navigation completes
          await client.send('Fetch.continueRequest', {
            requestId: evt.requestId,
          });

          const raw = bodyResp.base64Encoded
            ? Buffer.from(bodyResp.body, 'base64').toString('utf8')
            : bodyResp.body;

          // Resolve the waiter
          waitingResolve?.(raw);

          waitingForUrl = null;
          waitingResolve = null;
          waitingReject = null;
        } catch (err) {
          // Best-effort continue; then reject waiter
          try {
            await client.send('Fetch.continueRequest', {
              requestId: evt.requestId,
            });
          } catch {}
          waitingReject?.(err);
          waitingForUrl = null;
          waitingResolve = null;
          waitingReject = null;
        }
      });

      // Warm up the origin (helps CF)
      try {
        const origin = new URL(indexUrl).origin;
        await page.goto(origin + '/', {
          waitUntil: 'networkidle2',
          timeout: 60_000,
        });
      } catch {}

      const fetchXml = async (url: string): Promise<string> => {
        await sleep(150 + Math.floor(Math.random() * 200));

        // Start waiting for the body BEFORE navigating
        const bodyPromise = waitForBody(url, 60_000);

        const res = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        });
        if (!res) throw new Error(`No response: ${url}`);

        const status = res.status();
        if (status !== 200) {
          // Even if status isn't 200, still try to read body for debugging
          const body = await bodyPromise.catch(() => '');
          throw new Error(
            `Status ${status} for ${url} (first 200): ${body.slice(0, 200)}`,
          );
        }

        return await bodyPromise;
      };

      const seenSitemaps = new Set<string>();
      const allUrls: string[] = [];
      const queue: string[] = [indexUrl];

      while (queue.length) {
        const smUrl = queue.shift()!;
        if (seenSitemaps.has(smUrl)) continue;
        seenSitemaps.add(smUrl);

        const xmlText = await fetchXml(smUrl);
        const xml = parser.parse(xmlText);
        const { urls, sitemaps } = extract(xml);

        if (urls.length) allUrls.push(...urls);
        if (sitemaps.length) queue.push(...sitemaps);
      }

      return {
        urls: allUrls,
        sitemapsVisited: Array.from(seenSitemaps),
        errors: ['none'],
      };
    } finally {
      try {
        await client.send('Fetch.disable');
      } catch {}
      await browser.close();
    }
  }
}
