import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import fetch from 'node-fetch';
import { ShopifyProduct, ShopifyProductCollections, ShopifyProductCollectionsFullCall } from './utils.type.js';
import { stripHtml } from "string-strip-html";



@Injectable()
export class UtilsService {
  constructor() { }
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

    const extractKeywords = (rawUrl: string) => {
      const noQuery = rawUrl.split('?')[0].replace(/\/+$/, '');
      const name = decodeURIComponent(noQuery.split('/').pop() || '');

      const cleaned = name
        .toLowerCase()
        .normalize('NFKD')                    // normalize accents
        .replace(/[\u0300-\u036f]/g, '')      // strip accent marks
        .replace(/[’'`]/g, '')                // drop apostrophes (smart + straight)
        .replace(/[^a-z0-9]+/g, ' ')          // everything non-alnum -> space
        .trim();

      return cleaned.split(/\s+/);            // ['magic','the','gathering','assassins','creed','collector','booster','box']
    };
    const requiredMatches = (n: number) => Math.max(1, Math.floor((3 / 5) * n));

    const countMatches = (productKeys: string[], queryKeys: string[]) =>
      queryKeys.filter(k => productKeys.includes(k)).length;

    const filterProducts = (urls: string[], query: string): string[] => {
      const products = urls.map(url => ({ url, keywords: extractKeywords(url) }));
      const queryKeys = query.toLowerCase().split(' ').filter(Boolean);
      const minMatches = requiredMatches(queryKeys.length);
      console.log(queryKeys)
      console.log(minMatches)
      return products
        .filter(p => countMatches(p.keywords, queryKeys) >= minMatches)
        .map(p => p.url);
    };
    const result = filterProducts(urls, query);
    return result
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

    console.log(`Amount of URLs before vetted: ${urls.length}`);



    // Step 1: Filter URLs that start with the prefix
    console.log(`Before startsWith: ${urls.length}`)
    const filteredByPrefix = urls.filter((url) => {

      return url.startsWith(prefix)
    });
    console.log(prefix)
    console.log('After prefix filter:', filteredByPrefix.length);

    // Step 2: Filter out URLs ending with excluded extensions
    const vettedUrls = filteredByPrefix.filter((url) => {
      const bare = url.split('?')[0].toLowerCase();
      return !EXCLUDED_EXT.some((ext) => bare.endsWith(ext));
    });
    console.log('After extension filter:', vettedUrls.length);
    // console.log(urls)
    console.log(`Amount of URLs after vetted ${vettedUrls.length}`);
    return vettedUrls;
  };

  async testProxyFetch() {
    const proxyUrl =
      `http://c9c43b907848ee719c48:${process.env.PROXY_PASSWORD}@gw.dataimpulse.com:823`;

    // Pick agent based on **target** URL, not the proxy URL
    // const agent = 
    //   new URL(target).protocol === 'https:'
    //     ? new HttpsProxyAgent({ proxy: proxyUrl, keepAlive: true })
    //     : new HttpProxyAgent({ proxy: proxyUrl, keepAlive: true });

    const agent = new HttpsProxyAgent({ proxy: proxyUrl, keepAlive: true })


    // const res = await fetch(target, { agent });
    // if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // console.log(res.statusText)
    // console.log('response via proxy:', await res.text());
    return agent
  }

  async collectionsTest(websiteUrl: string) {
    const response = await fetch(`${websiteUrl}/collections/all/products.json?limit=250`)
    const status = response.status
    console.log({
      status,
      websiteUrl
    })
    if (status === 200) {
      return true
    } else {
      return false
    }
  }

  // Hasn't proven to work well this. Decided to go headful
  async getUrlsFromShopify(websiteUrl: string, category: string) {
    // Rotate until we can't
    // We just need the URL but I think we need to test if this works or not for all sites so we'll do that first
    // We can do that via checking if we can even get collections and go from there
    let pageLength: number
    const websiteUrls: string[] = []
    for (let index = 1; pageLength !== 0; index++) {
      let response
      try {
        response = await fetch(`${websiteUrl}/collections/all/products.json?limit=250&page=${index}`)
        console.log({
          status: response.status,
          website: websiteUrl,
          page: index
        })
      } catch (error) {
        console.error(response.status)
      }
      const json: ShopifyProductCollectionsFullCall = await response.json() as ShopifyProductCollectionsFullCall
      pageLength = json.products.length
      json.products.forEach(product => websiteUrls.push(`${websiteUrl}${category}/${product.handle}`))
      await new Promise(r => setTimeout(r, 350))
    }
    // console.log(websiteUrls)
    return websiteUrls
  }

  async getUrlsFromSitemap(
    sitemapUrl: string,
    seed: string,
    crawlAmount: number,
    fast: boolean,
    importSites?: string[]
  ): Promise<{ websiteUrls: string[], fast: boolean }> {

    if (importSites && importSites.length > 1) {
      const filtered = this.filterObviousNonPages(importSites, seed);
      // console.log(filtered)
      return {
        websiteUrls: filtered,
        fast
      };
    }

    const agent = await this.testProxyFetch()

    let sites: string[] = [];
    let days = crawlAmount;
    let siteMapAmount = 0;
    let response
    let pauseTimer = fast ? 1 : 60000
    do {
      const now = new Date();
      const crawlAmountDaysAgo = new Date();
      crawlAmountDaysAgo.setDate(now.getDate() - days);

      console.log(crawlAmountDaysAgo)

      const { default: Sitemapper } = await import('sitemapper');

      const sitemap = new Sitemapper({
        url: sitemapUrl,
        lastmod: crawlAmountDaysAgo.getTime(),
        timeout: 30000,
        concurrency: 1,
        retries: 0,
        debug: true,
        // proxyAgent: { https: agent } as unknown as any
      });

      if (fast) sitemap.proxyAgent = { https: agent } as unknown as any

      let scannedSites: string[] = []


      try {
        response = (await sitemap.fetch())
        console.log(response.errors.length === 0 ? "No Errors" : response.errors)
        if (response.errors.length > 0) await new Promise(r => setTimeout(r, pauseTimer));
        scannedSites = response.sites
      } catch (error) {
        console.dir(error, { depth: 5 });   // should show a Z_DATA_ERROR or BrotliDecodeError
        throw error;
      }

      // console.log(scannedSites)
      console.log(scannedSites.length);


      sites = scannedSites;
      siteMapAmount = scannedSites.length;
      days--;

    } while (siteMapAmount > 100000000000);

    const filtered = this.filterObviousNonPages(sites, seed);
    await new Promise(r => setTimeout(r, pauseTimer))
    // console.log(filtered)
    if (response.errors.length === 0) {
      return {
        websiteUrls: filtered,
        fast: fast === true ? true : false,
      }
    } else {
      return {
        websiteUrls: filtered,
        fast: true,
      }
    }

  };

  getUrlsList = (sites: string[], seed: string): string[] => {
    const filtered = this.filterObviousNonPages(sites, seed);
    // console.log(filtered)
    return filtered;
  };

  async waitForCloudflareBypass(page: any, timeout = 60000, waitingTimeout = 2000, resolveTimeout = 10000) {
    const start = Date.now();

    const title = await page.title();
    if (title.includes('...') === false) return

    while (Date.now() - start < timeout) {
      const title = await page.title();
      if (title.includes('...') === false) {
        // Challenge passed, page loaded
        console.log('passed');
        await new Promise((resolve) => setTimeout(resolve, resolveTimeout));
        return;
      }
      // Wait a bit before checking again
      console.log('waiting');
      await new Promise((resolve) => setTimeout(resolve, waitingTimeout));
    }

    throw new Error('Timed out waiting for Cloudflare challenge to complete');
  };

  extractShopifyWebsite = async (url: string) => {
    console.log(url)
    try {
      const response = await fetch(`${url}.js`)
      console.log(response.status)
      const json: ShopifyProduct = await response.json() as ShopifyProduct
      const title = json.title
      let mainText = stripHtml(json.description).result
      mainText = `${mainText}. Price is ${json.price / 100}, InStock Status: ${json.available}`
      console.log({ title, mainText })
      return { title, mainText, ...json }
    } catch (error) {
      console.log(error)
      return {
        url,
        inStock: false,
        price: 0,
        available: false,
        title: 'default',
        mainText: 'default'
      }
    }

  }
} 
