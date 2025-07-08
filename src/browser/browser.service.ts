import { Injectable } from '@nestjs/common';
import { connect } from 'puppeteer-real-browser';
import { JSDOM } from 'jsdom';
import { UtilsService } from '../utils/utils.service.js';


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

    await page.goto(url, { waitUntil: ['networkidle2'] });

    // Promise that resolves with the page content and mainText
    const pageTask = (async () => {
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
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(async () => {
        console.log(`Timeout reached, closing browser: ${url}`);
        try {
          await browser.close();
        } catch (e) {
          console.error('Error closing browser after timeout', e);
        }
        reject(new Error('Timeout: Browser closed after 20 seconds'));
      }, 20000),
    );

    // Race pageTask and timeout, so whichever finishes first wins
    const result = await Promise.race([pageTask, timeout]);

    // If pageTask won, close browser normally
    if (result) {
      await browser.close();
    }

    return result;
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

    await page.goto(url, { waitUntil: ['networkidle2'] });

    // Promise that resolves with the page content and mainText
    const pageTask = (async () => {
      try {
        await this.utilService.waitForCloudflareBypass(page);
      } catch (e) {
        // This needs tested properly will get back to this.
        // console.log('Error during Cloudflare bypass, continuing anyway');
        await browser.close();
      }

      const shopyifySite = await page.evaluate(() => {
        const isShopyifySite = document.querySelector('link[href="https://cdn.shopify.com"]');
        return isShopyifySite ? true : false
      }
    )
      return shopyifySite;
    })();

    // Timeout promise that closes browser after 10 seconds
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(async () => {
        console.log(`Timeout reached, closing browser: ${url}`);
        try {
          await browser.close();
        } catch (e) {
          console.error('Error closing browser after timeout', e);
        }
        reject(new Error('Timeout: Browser closed after 20 seconds'));
      }, 40000),
    );

    // Race pageTask and timeout, so whichever finishes first wins
    const result = await Promise.race([pageTask, timeout]);

    // If pageTask won, close browser normally
    if (result) {
      await browser.close();
    }
    return result;
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
}
