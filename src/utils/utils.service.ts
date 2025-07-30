import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import fetch from 'node-fetch';
import { ShopifyProduct } from './utils.type.js';
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
      const noQuery = rawUrl.split('?')[0].replace(/\/+$/, ''); // strip trailing slash(es)
      const name = noQuery.split('/').pop()!.toLowerCase();
      return name.split('-').filter(Boolean);
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

  getUrlsFromSitemap = async (
    sitemapUrl: string,
    seed: string,
    crawlAmount: number,
    importSites?: string[]
  ): Promise<string[]> => {

    if (importSites && importSites.length > 1) {
      const filtered = this.filterObviousNonPages(importSites, seed);
      // console.log(filtered)
      return filtered;
    }

    const agent = await this.testProxyFetch()

    let sites: string[] = [];
    let days = crawlAmount;
    let siteMapAmount = 0;
    do {
      const now = new Date();
      const crawlAmountDaysAgo = new Date();
      crawlAmountDaysAgo.setDate(now.getDate() - days);

      console.log(crawlAmountDaysAgo)

      const { default: Sitemapper } = await import('sitemapper');


      // const test = await this.testProxyFetch()
      // console.log(test)
      // throw new Error()

      // const res = await fetch(sitemapUrl, { agent });  // 10‑s timeout
      // if (!res.ok) throw new Error(`status ${res.status}`);
      // console.log('headers →', res.headers.get('content-type'),
      //   res.headers.get('content-encoding'));
      // const xml = await res.text();
      // console.log('size →', xml.length, 'bytes');


      const sitemap = new Sitemapper({
        url: sitemapUrl,
        lastmod: crawlAmountDaysAgo.getTime(),
        timeout: 30000,
        concurrency: 1,
        retries: 1,
        debug: false,
        proxyAgent: { https: agent } as unknown as any
      });

      // console.log(sitemap)

      // console.log({
      //   timeout: sitemap.timeout,
      //   concurrency: sitemap.concurrency,
      //   retries: sitemap.retries,
      //   rejectUnauthorized: sitemap.rejectUnauthorized,
      //   exclusions: sitemap.exclusions,
      // });

      let scannedSites: string[] = []

      try {
        const test = (await sitemap.fetch())
        console.log(test.errors.length === 0 ? "No Errors" : test.errors)
        scannedSites = test.sites
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
    // console.log(filtered)
    return filtered;
  };

  getUrlsList = (sites: string[], seed: string): string[] => {
    const filtered = this.filterObviousNonPages(sites, seed);
    // console.log(filtered)
    return filtered;
  };

  waitForCloudflareBypass = async (page: any, timeout = 60000) => {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const title = await page.title();
      if (title.includes('...') === false) {
        // Challenge passed, page loaded
        console.log('passed');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return;
      }
      // Wait a bit before checking again
      console.log('waiting');
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error('Timed out waiting for Cloudflare challenge to complete');
  };

  extractShopifyWebsite = async (url: string) => {
    console.log(url)
    try {
      const response = await fetch(`${url}.js`)
      const json: ShopifyProduct = await response.json() as ShopifyProduct
      const title = json.title
      let mainText = stripHtml(json.description).result
      mainText = `${mainText}. Price is ${json.price / 100}`
      console.log({ title, mainText })
      return { title, mainText, ...json }
    } catch (error) {
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
