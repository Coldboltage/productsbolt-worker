import { Injectable } from '@nestjs/common';
import { connect } from 'puppeteer-real-browser';
import { JSDOM } from 'jsdom';
import { UtilsService } from '../utils/utils.service.js';
import { ShopifyProductCollectionsFullCall } from '../utils/utils.type.js';


@Injectable()
export class BrowserService {
  constructor(private utilService: UtilsService) { }
  getPageInfo = async (
    url: string,
  ): Promise<{ html: string; mainText: string }> => {
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

      const html = await page.content();
      const mainText = await page.evaluate(() => {
        const main = document.querySelector('main') || document.body;
        return main.innerText;
      });

      const shopyifySite = await page.evaluate(() => {
        const isShopyifySite = document.querySelector('link[href="https://cdn.shopify.com"]');
        return isShopyifySite ? true : false
      }
      )

      return { html, mainText, shopyifySite };
    })();

    // Timeout promise that closes browser after 10 seconds
    let timer: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Timeout: 60s')), 60_000);
    });

    try {
      // Whichever finishes first wins
      return await Promise.race([pageTask, timeoutPromise]);
    } finally {
      // Always clean up: cancel the timer and kill the browser exactly once
      if (timer) clearTimeout(timer);
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser', e);
      }
    }
  };

  isShopifySite = async (
    url: string,
  ): Promise<boolean> => {
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
        const isShopyifySite = document.querySelector('link[href="https://cdn.shopify.com"]');
        return isShopyifySite ? true : false
      }
      )
      return shopyifySite;
    })();

    // Timeout promise that closes browser after 10 seconds
    let timer: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Timeout: 60s')), 60_000);
    });

    try {
      // Whichever finishes first wins
      return await Promise.race([pageTask, timeoutPromise]);
    } finally {
      // Always clean up: cancel the timer and kill the browser exactly once
      if (timer) clearTimeout(timer);
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser', e);
      }
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

  async shopifySitemapSearch(websiteUrl: string, category: string): Promise<{ websiteUrls: string[], error: boolean }> {
    const { browser, page } = await connect({
      headless: false,
      args: [],
      customConfig: {},
      turnstile: true,
      connectOption: {},
      disableXvfb: false,
      ignoreAllFlags: false,
    });



    let pageLength: number
    const websiteUrls: string[] = []
    for (let index = 1; pageLength !== 0; index++) {

      let response
      const url = `${websiteUrl}collections/all/products.json?limit=250&page=${index}`;

      try {
        // await page.goto(url);
        try {
          await page.goto(url, { waitUntil: 'load' });
          await new Promise(r => setTimeout(r, 100))
          await this.utilService.waitForCloudflareBypass(page, 10000);
          response = await page.goto(url);

        } catch (e) {
          console.log('Error during Cloudflare bypass, continuing anyway');
        }
        const status = await response.status()
        console.log({
          // title: await response.title(),
          status,
          website: websiteUrl,
          page: index
        })

        if (status === 429) {
          console.log({
            status: response.status(),
            website: websiteUrl,
            page: index,
            error: "429 Error"
          })
          await new Promise(r => setTimeout(r, 1000000))
          await browser.close()
          return {
            websiteUrls: websiteUrls,
            error: true
          }
        }


      } catch (error) {
        console.error(response.status)
      }
      let json: ShopifyProductCollectionsFullCall
      try {
        json = await response.json() as ShopifyProductCollectionsFullCall
      } catch (error) {
        pageLength = 0
        console.log({
          status: response.status(),
          website: websiteUrl,
          page: index,
          error: "401 Error"
        })
        await browser.close()
        return {
          websiteUrls: websiteUrls,
          error: true
        }
      }

      if (!json.products || !json || await response.status() >= 400) {
        console.error({
          status: response.status(),
          website: websiteUrl,
          page: index,
          error: "Exceeded 100 pages"
        })
        pageLength = 0
        await browser.close()
        return {
          websiteUrls: websiteUrls,
          error: true
        }
      }
      pageLength = json.products.length
      json.products.forEach(product => websiteUrls.push(`${websiteUrl}${category}/${product.handle}`))
    }
    await browser.close()
    // console.log(websiteUrls)
    return {
      websiteUrls: websiteUrls,
      error: false
    }
  }
}
