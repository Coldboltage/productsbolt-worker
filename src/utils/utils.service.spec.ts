import { Test, TestingModule } from '@nestjs/testing';
import { UtilsService } from './utils.service';

describe('UtilsService', () => {
  let service: UtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UtilsService],
    }).compile();

    service = module.get<UtilsService>(UtilsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractPublishedPrice', () => {
    const page = (head: string) =>
      `<!doctype html><html><head>${head}</head><body><h1>Booster Box</h1></body></html>`;

    it('reads the price the shop publishes in og:price:amount', () => {
      const html = page(`
        <meta property="og:price:amount" content="299.99">
        <meta property="og:price:currency" content="GBP">
      `);

      expect(service.extractPublishedPrice(html, 'GBP')).toEqual({
        price: 299.99,
        currencyCode: 'GBP',
      });
    });

    it('ignores a stale price elsewhere on the page', () => {
      const html = `<!doctype html><html><head>
        <meta property="og:price:amount" content="189.95">
        <meta property="og:price:currency" content="GBP">
      </head><body><s>£169.95</s><span>£189.95</span></body></html>`;

      expect(service.extractPublishedPrice(html, 'GBP')?.price).toBe(189.95);
    });

    it('falls back to the JSON-LD offer when there is no meta price', () => {
      const html = page(`
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Aetherdrift Play Booster Box",
            "offers": {
              "@type": "Offer",
              "price": "99.95",
              "priceCurrency": "GBP"
            }
          }
        </script>
      `);

      expect(service.extractPublishedPrice(html, 'GBP')).toEqual({
        price: 99.95,
        currencyCode: 'GBP',
      });
    });

    it('handles product:price:amount and thousands separators', () => {
      const html = page(`
        <meta property="product:price:amount" content="1,234.56">
        <meta property="product:price:currency" content="USD">
      `);

      expect(service.extractPublishedPrice(html, 'USD')?.price).toBe(1234.56);
    });

    it('reads a comma decimal separator', () => {
      const html = page(`<meta property="og:price:amount" content="299,99">`);

      expect(service.extractPublishedPrice(html)?.price).toBe(299.99);
    });

    it('refuses a price published in another currency', () => {
      const html = page(`
        <meta property="og:price:amount" content="119.99">
        <meta property="og:price:currency" content="USD">
      `);

      expect(service.extractPublishedPrice(html, 'GBP')).toBeNull();
    });

    it('still uses the JSON-LD offer when the meta price is the wrong currency', () => {
      const html = page(`
        <meta property="og:price:amount" content="119.99">
        <meta property="og:price:currency" content="USD">
        <script type="application/ld+json">
          {
            "@type": "Product",
            "offers": { "price": 94.5, "priceCurrency": "GBP" }
          }
        </script>
      `);

      expect(service.extractPublishedPrice(html, 'GBP')).toEqual({
        price: 94.5,
        currencyCode: 'GBP',
      });
    });

    it('returns null when the page publishes no price', () => {
      expect(service.extractPublishedPrice(page(''), 'GBP')).toBeNull();
      expect(service.extractPublishedPrice('', 'GBP')).toBeNull();
    });

    it('ignores unusable published amounts', () => {
      const html = page(`<meta property="og:price:amount" content="0.00">`);

      expect(service.extractPublishedPrice(html, 'GBP')).toBeNull();
    });

    it('survives malformed JSON-LD', () => {
      const html = page(`
        <script type="application/ld+json">{ not json </script>
        <meta property="og:price:amount" content="140.00">
      `);

      expect(service.extractPublishedPrice(html, 'GBP')?.price).toBe(140);
    });
  });
});
