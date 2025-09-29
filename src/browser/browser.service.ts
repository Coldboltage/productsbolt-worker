import { Injectable } from '@nestjs/common';
import { connect } from 'puppeteer-real-browser';
import { JSDOM } from 'jsdom';
import { UtilsService } from '../utils/utils.service.js';
import { ShopifyProductCollectionsFullCall } from '../utils/utils.type.js';
import { Dataset, PlaywrightCrawler } from 'crawlee';
import fetch from 'node-fetch';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class BrowserService {
  constructor(private utilService: UtilsService) {}

  async manualSitemapSearch(manualSitemapUrl: string) {
    console.log(manualSitemapUrl);
    // const crawler = new PlaywrightCrawler({
    //   async requestHandler({ page, pushData }) {
    //     console.log('fired')
    //     const links: string[] = await page.$$eval('a', (anchor: Element[]) => {
    //       return anchor.map(anchor => (anchor as HTMLAnchorElement).href);
    //     });
    //     for (const url of links) await pushData({ url })
    //   }
    // })
    // console.log("hmm")
    // await crawler.run([manualSitemapUrl])

    // const dataset = await Dataset.open();
    // const { items } = await dataset.getData();
    // console.log(items);

    const result = await this.getPageInfo(manualSitemapUrl);
    return result;
  }

  async cloudflareTest(url: string): Promise<boolean> {
    const res = await fetch(url);
    const status = res.status;

    if (status >= 400) {
      console.error(`URL ${url} will be blocked by Cloudflare: ${status}`);
      return true;
    }
    console.log(`URL ${url} is accessible with status code: ${status}`);
    // Cloudflare or other fetch blocking thing doesn't exist
    return false;
  }

  async getPageHtml(url: string): Promise<{ html: string; mainText: string }> {
    const res = await fetch(url);
    const status = res.status;

    console.log(`Fetched ${url} with status ${status}`);

    if (status >= 400)
      throw new Error(`Failed to load page, status code: ${status}`);

    const html = await res.text();

    function htmlToPlainText(html: string) {
      // 1. Strip down to only basic text containers
      const clean = sanitizeHtml(html, {
        allowedTags: [
          'p',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'ul',
          'ol',
          'li',
          'strong',
          'em',
          'span',
          'div',
          'br',
        ],
        allowedAttributes: false,
        nonTextTags: [
          'script',
          'style',
          'noscript',
          'iframe',
          'textarea',
          'option',
        ], // dump contents
        disallowedTagsMode: 'discard',
      });

      // 2. Flatten into plain text
      return clean
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const tester = htmlToPlainText(html);
    console.log(tester);
    return {
      html,
      mainText: tester,
    };
  }

  getPageInfo = async (
    url: string,
  ): Promise<{ html: string; mainText: string }> => {
    const { browser, page } = await connect({
      headless: false,
      args: [
        '--window-position=-99999,-99999',
        '--disable-backgrounding-occluded-windows',
        '--disable-features=CalculateNativeWinOcclusion',
        '--no-sandbox',
        '--disable-dev-shm-usage',
      ],
      customConfig: {},
      turnstile: true,
      connectOption: {},
      disableXvfb: false,
      ignoreAllFlags: false,
    });

    await page.setViewport({
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
    });

    await page.setRequestInterception(true);

    page.on('request', (req) => {
      const block = ['image', 'font', 'media'];
      if (block.includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Promise that resolves with the page content and mainText

    const pageTask = (async () => {
      const testPage = await page.goto(url, {
        waitUntil: ['networkidle2'],
        timeout: 60000,
      });

      let status = testPage.status();

      try {
        await this.utilService.waitForCloudflareBypass(page);
        if (status === 404) throw new Error(`404 Not Found`);
        if (status === 403 || status === 429) {
          console.log('403 or 429 detected, reloading page');
          const finalResponse = await page.reload({
            waitUntil: 'networkidle2',
            timeout: 60000,
          });
          status = finalResponse?.status();
        } else {
          console.log(`Passed: Status ${status} is OK`);
        }
      } catch (e) {
        console.log(`Error during Cloudflare bypass, continuing anyway`);
        console.log(e);
        await new Promise((r) => setTimeout(r, 10000));
      }

      console.log(`Navigated to ${url} with status ${status}`);

      if (status >= 400)
        throw new Error(`Failed to load page, status code: ${status}`);

      const html = await page.content();
      const mainText = await page.evaluate(() => {
        document
          .querySelectorAll('header, footer, nav, aside')
          .forEach((el) => el.remove());
        const main = document.querySelector('main') || document.body;
        return main.innerText;
      });

      const shopyifySite = await page.evaluate(() => {
        const isShopyifySite = document.querySelector(
          'link[href="https://cdn.shopify.com"]',
        );
        return isShopyifySite ? true : false;
      });

      return { html, mainText, shopyifySite };
    })();

    // Timeout promise that closes browser after 10 seconds
    let timer: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(async () => {
        console.log('⏱️ Timeout hit, closing page...');
        try {
          await page.close(); // 🔑 stop pageTask work first
        } catch {}
        reject(new Error('Timeout: 60s'));
      }, 60000);
    });

    try {
      // Whichever finishes first wins
      return await Promise.race([pageTask, timeoutPromise]);
    } finally {
      // Always clean up: cancel the timer and kill the browser exactly once
      if (timer) clearTimeout(timer);
      await browser.close().catch(() => {}); // now safe to close browser
    }
  };

  isShopifySite = async (url: string): Promise<boolean> => {
    const { browser, page } = await connect({
      headless: false,
      args: [],
      customConfig: {},
      turnstile: true,
      connectOption: {},
      disableXvfb: false,
      ignoreAllFlags: false,
    });
    // Promise that resolves with the page content and mainText
    const pageTask = (async () => {
      await page.goto(url, { waitUntil: ['networkidle2'], timeout: 60000 });

      try {
        await this.utilService.waitForCloudflareBypass(page);
      } catch (e) {
        console.log('Error during Cloudflare bypass, continuing anyway');
      }

      const shopyifySite = await page.evaluate(() => {
        const isShopyifySite = document.querySelector(
          'link[href="https://cdn.shopify.com"]',
        );
        return isShopyifySite ? true : false;
      });
      return shopyifySite;
    })();

    // Timeout promise that closes browser after 10 seconds
    let timer: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(async () => {
        console.log('⏱️ Timeout hit, closing page...');
        try {
          await page.close(); // 🔑 stop pageTask work first
        } catch {}
        reject(new Error('Timeout: 60s'));
      }, 60000);
    });

    try {
      // Whichever finishes first wins
      return await Promise.race([pageTask, timeoutPromise]);
    } finally {
      // Always clean up: cancel the timer and kill the browser exactly once
      if (timer) clearTimeout(timer);
      await browser.close().catch(() => {}); // now safe to close browser
    }
  };

  getLinksFromPage = async (url: string) => {
    const { html } = await this.getPageInfo(url);

    const dom = new JSDOM(html);
    const document = dom.window.document;
    const links = Array.from(document.querySelectorAll('a')).map(
      (a) => (a as HTMLAnchorElement).href,
    );

    return links;
  };

  async shopifySitemapSearch(
    websiteUrl: string,
    category: string,
  ): Promise<{ websiteUrls: string[]; error: boolean }> {
    const { browser, page } = await connect({
      headless: false,
      args: [],
      customConfig: {},
      turnstile: true,
      connectOption: {},
      disableXvfb: false,
      ignoreAllFlags: false,
    });

    let pageLength: number;
    const websiteUrls: string[] = [];
    for (let index = 1; pageLength !== 0; index++) {
      let response;
      const url = `${websiteUrl}collections/all/products.json?limit=250&page=${index}`;

      try {
        // await page.goto(url);
        try {
          await page.goto(url, { waitUntil: 'load' });
          await new Promise((r) => setTimeout(r, 100));
          await this.utilService.waitForCloudflareBypass(page, 10000);
          response = await page.goto(url);
        } catch (e) {
          console.log('Error during Cloudflare bypass, continuing anyway');
        }
        const status = await response.status();
        console.log({
          // title: await response.title(),
          status,
          website: websiteUrl,
          page: index,
        });

        if (status === 429) {
          console.log({
            status: response.status(),
            website: websiteUrl,
            page: index,
            error: '429 Error',
          });
          await browser.close();
          return {
            websiteUrls: websiteUrls,
            error: true,
          };
        }
      } catch (error) {
        console.error(response.status);
      }
      let json: ShopifyProductCollectionsFullCall;
      try {
        json = (await response.json()) as ShopifyProductCollectionsFullCall;
      } catch (error) {
        pageLength = 0;
        console.log({
          status: response.status(),
          website: websiteUrl,
          page: index,
          error: '401 Error',
        });
        await browser.close();
        return {
          websiteUrls: websiteUrls,
          error: true,
        };
      }

      if (!json.products || !json || (await response.status()) >= 400) {
        console.error({
          status: response.status(),
          website: websiteUrl,
          page: index,
          error: 'Exceeded 100 pages',
        });
        pageLength = 0;
        await browser.close();
        return {
          websiteUrls: websiteUrls,
          error: true,
        };
      }
      pageLength = json.products.length;
      json.products.forEach((product) =>
        websiteUrls.push(`${websiteUrl}${category}/${product.handle}`),
      );
    }
    await browser.close();
    // console.log(websiteUrls)
    return {
      websiteUrls: websiteUrls,
      error: false,
    };
  }
}
