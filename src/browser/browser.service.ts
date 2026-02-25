import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { connect } from 'puppeteer-real-browser';
import { JSDOM } from 'jsdom';
import { UtilsService } from '../utils/utils.service.js';
import { ShopifyProductCollectionsFullCall } from '../utils/utils.type.js';
import sanitizeHtml from 'sanitize-html';
import puppeteer, { HTTPResponse, Browser } from 'puppeteer';

@Injectable()
export class BrowserService {
  private readonly logger = new Logger(BrowserService.name);

  private browser: any;

  constructor(private utilService: UtilsService) {}

  async onModuleInit() {
    const { browser } = await connect({
      headless: true,
      args: [
        // '--window-position=-99999,-99999',
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

    this.browser = browser;
    this.logger.log(this.browser);
  }

  async manualSitemapSearch(manualSitemapUrl: string) {
    this.logger.log(manualSitemapUrl);
    // const crawler = new PlaywrightCrawler({
    //   async requestHandler({ page, pushData }) {
    //     this.logger.log('fired')
    //     const links: string[] = await page.$$eval('a', (anchor: Element[]) => {
    //       return anchor.map(anchor => (anchor as HTMLAnchorElement).href);
    //     });
    //     for (const url of links) await pushData({ url })
    //   }
    // })
    // this.logger.log("hmm")
    // await crawler.run([manualSitemapUrl])

    // const dataset = await Dataset.open();
    // const { items } = await dataset.getData();
    // this.logger.log(items);

    const result = await this.getPageInfo(
      manualSitemapUrl,
      false,
      '',
      '',
      false,
    );
    return result;
  }

  async cloudflareTest(url: string): Promise<boolean> {
    const res = await fetch(url);
    const status = res.status;

    if (status >= 400) {
      console.error(`URL ${url} will be blocked by Cloudflare: ${status}`);
      return true;
    }
    this.logger.log(`URL ${url} is accessible with status code: ${status}`);
    // Cloudflare or other fetch blocking thing doesn't exist
    return false;
  }

  async headlessChrome(url: string): Promise<{
    html: string;
    mainText: string;
    base64Image: string;
  }> {
    const browser = await puppeteer.connect({
      browserWSEndpoint: `ws://localhost:4000?token=change_me`,
    });

    const page = await browser.newPage();
    const testPage = await page.goto(url, { waitUntil: 'networkidle2' });

    const status = testPage.status();
    if (status === 404) throw new NotFoundException(`404 Not Found`);

    const html = await page.content();
    const mainText = await page.evaluate(() => {
      document
        .querySelectorAll('header, footer, nav, aside')
        .forEach((el) => el.remove());
      const main = document.querySelector('main') || document.body;
      return main.innerText;
    });

    const base64Image = await page.screenshot({
      type: 'png',
      encoding: 'base64',
    });

    this.logger.log(base64Image);
    return { html, mainText, base64Image };
  }

  async getPageHtml(
    url: string,
    country: string,
    currency: string,
  ): Promise<{ html: string; mainText: string }> {
    let res;
    try {
      res = await fetch(url, {
        headers: {
          Cookie: `cart_currency=${currency}; localization=${country}`,
        },
      });
    } catch (error) {
      this.logger.log(
        `Fetch error, possibly blocked by Cloudflare or invalid URL: ${error}`,
      );
    }
    const status = res.status;

    this.logger.log(`Fetched ${url} with status ${status}`);

    if (status >= 400)
      throw new Error(`Failed to load page, status code: ${status}`);

    const html = await res.text();

    function htmlToPlainText(html: string) {
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

        // Completely remove these tags *and their contents*
        nonTextTags: [
          'script',
          'style',
          'noscript',
          'iframe',
          'textarea',
          'option',
          'header',
          'footer',
          'nav',
          'aside',
        ],

        disallowedTagsMode: 'discard',
      });

      return clean
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const tester = htmlToPlainText(html);
    this.logger.log(tester);
    return {
      html,
      mainText: tester,
    };
  }

  getPageInfo = async (
    url: string,
    headless: boolean,
    country: string,
    currency: string,
    shopifySite: boolean,
  ): Promise<{
    html: string;
    mainText: string;
    shopyifySite: boolean;
    base64Image: string;
  }> => {
    let page;
    let browser;

    if (headless) {
      browser = this.browser;
      try {
        page = await browser.newPage();
      } catch (error) {
        this.logger.log('error found');
        this.logger.log(error);
        throw new ConflictException('browser_did_not_load');
      }
    } else {
      const { browser: headfulBrowser, page: headfulPage } = await connect({
        headless: headless,
        args: [
          // '--window-position=-99999,-99999',
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
      page = headfulPage;
      browser = headfulBrowser;
    }

    const hostname = new URL(url).hostname;
    this.logger.log('browser_loaded');

    await page.setCookie(
      {
        name: 'cart_currency',
        value: currency,
        domain: `.${hostname}`,
        path: '/',
      },
      {
        name: 'localization',
        value: country,
        domain: `.${hostname}`,
        path: '/',
      },
    );

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
      let testPage;

      try {
        testPage = await page.goto(shopifySite ? `${url}.js` : url, {
          waitUntil: ['networkloadidle2'],
          timeout: 20000,
        });
      } catch (error) {
        try {
          testPage = await page.goto(shopifySite ? `${url}.js` : url, {
            waitUntil: ['domcontentloaded'],
            timeout: 60000,
          });
        } catch (error) {
          throw new Error('it_really_did_not_want_to_load');
        }
      }

      // const testPage = await page.goto(url, {
      //   waitUntil: 'domcontentloaded',
      //   timeout: 60000,
      // });

      // // Optional, safe hydration wait
      // await page.waitForNetworkIdle({ idleTime: 1000, timeout: 10000 });

      let status = testPage.status();

      try {
        await this.utilService.waitForCloudflareBypass(page, url);
        if (status === 404) throw new NotFoundException(`404 Not Found`);
        if (status === 403 || status === 429) {
          this.logger.log('403 or 429 detected, reloading page');
          const finalResponse = await page.reload({
            waitUntil: 'networkidle2',
            timeout: 10000,
          });
          status = finalResponse?.status();
        }
        if (status > 404) throw new Error('400+ error');
        else {
          this.logger.log(`Passed: Status ${status} is OK`);
        }
      } catch (e) {
        this.logger.error(`Error during Cloudflare bypass, continuing anyway`);
        this.logger.log(e);
        await new Promise((r) => setTimeout(r, 10000));
      }

      this.logger.log(`Navigated to ${url} with status ${status}`);

      if (status === 404) {
        throw new NotFoundException(`404 Not Found: ${url}`);
      } else if (status === 403) {
        throw new ForbiddenException(`403 Forbidden: ${url}`);
      } else if (status > 404) {
        throw new ConflictException(`Error: ${status} on ${url}`);
      }

      let html;

      try {
        html = await page.content();
      } catch (error) {
        throw new NotFoundException(`Page_is_broken: ${url}`);
      }

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

      await page.addStyleTag({
        content: `
    header, footer, nav, aside { display: none !important; }
  `,
      });

      // const base64Image = await page.screenshot({
      //   type: 'png',
      //   encoding: 'base64',
      // });

      const base64Image = 'removed';

      return { html, mainText, shopyifySite, base64Image };
    })();

    // Timeout promise that closes browser after 10 seconds
    let timer: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(async () => {
        this.logger.log('⏱️ Timeout hit, closing page...');
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
      await page.close().catch(() => {}); // now safe to close browser
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
        await this.utilService.waitForCloudflareBypass(page, url);
      } catch (e) {
        this.logger.log('Error during Cloudflare bypass, continuing anyway');
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
        this.logger.log('⏱️ Timeout hit, closing page...');
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
      await page.close().catch(() => {}); // now safe to close browser
    }
  };

  getLinksFromPage = async (
    url: string,
    country: string,
    currency: string,
    isShopifySite: boolean,
  ) => {
    const { html } = await this.getPageInfo(
      url,
      false,
      country,
      currency,
      isShopifySite,
    );

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
          await this.utilService.waitForCloudflareBypass(page, url, 10000);
          response = await page.goto(url);
        } catch (e) {
          this.logger.log('Error during Cloudflare bypass, continuing anyway');
        }
        const status = await response.status();
        this.logger.log({
          // title: await response.title(),
          status,
          website: websiteUrl,
          page: index,
        });

        if (status === 429) {
          this.logger.log({
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
        this.logger.log({
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
    // this.logger.log(websiteUrls)
    return {
      websiteUrls: websiteUrls,
      error: false,
    };
  }
}
