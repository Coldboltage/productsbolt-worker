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
}
