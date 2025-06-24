import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import fetch from 'node-fetch';


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

    const extractKeywords = (url: string) => {
      const name = url.split('/').pop()?.split('?')[0].toLowerCase() || '';
      return name.split('-').filter(Boolean);
    };

    const requiredMatches = (n: number) => Math.max(1, Math.floor((3 / 5) * n));

    const countMatches = (productKeys: string[], queryKeys: string[]) =>
      queryKeys.filter(k => productKeys.includes(k)).length;

    const filterProducts = (urls: string[], query: string): string[] => {
      const products = urls.map(url => ({ url, keywords: extractKeywords(url) }));
      const queryKeys = query.toLowerCase().split(' ').filter(Boolean);
      const minMatches = requiredMatches(queryKeys.length);
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
    const proxyUrl = 'http://hojxmjyg-rotate:5ybel41yit49@p.webshare.io:80';
    const agent =
      proxyUrl.startsWith('https:')
        ? new HttpsProxyAgent({ proxy: proxyUrl })
        : new HttpProxyAgent({ proxy: proxyUrl });

    const res = await fetch('http://ipv4.webshare.io/', {
      agent: agent,   // <—— here
      // you can still set a timeout via AbortController if needed
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.text();
    console.log('Response via proxy:', data);
    return agent
  }

  getUrlsFromSitemap = async (
    sitemapUrl: string,
    seed: string,
    crawlAmount: number,
    importSites?: string[]
  ): Promise<string[]> => {
    const proxy = await this.testProxyFetch()

    if (importSites && importSites.length > 1) {
      const filtered = this.filterObviousNonPages(importSites, seed);
      // console.log(filtered)
      return filtered;
    }




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
      const sitemap = new Sitemapper({
        lastmod: crawlAmountDaysAgo.getTime(),
        timeout: 5000,
        concurrency: 25,
        retries: 1,
        debug: true,
        // proxyAgent: await this.testProxyFetch()
      });

      // console.log({
      //   timeout: sitemap.timeout,
      //   concurrency: sitemap.concurrency,
      //   retries: sitemap.retries,
      //   rejectUnauthorized: sitemap.rejectUnauthorized,
      //   exclusions: sitemap.exclusions,
      // });


      const { sites: scannedSites } = await sitemap.fetch(sitemapUrl);

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
}
