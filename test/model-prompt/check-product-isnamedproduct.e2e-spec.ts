import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { OpenaiModule } from '../../src/openai/openai.module';
import { OpenaiService } from '../../src/openai/openai.service';
import { arrayOfWebpages } from './webpages';
import 'dotenv/config';

jest.setTimeout(60_000);

// CB-028 — the price check must also answer whether the page in front of it is still the
// product the webpage row claims to be. The fixture pages are recorded shop pages and the
// target name comes from the row, not from the page — which is exactly how the two come to
// disagree in production, with no fixture needing a fictitious page.
//
// One live systemOne call per case. Needs the worker's Jev env (LOCAL_LMM_URL_JEV and its
// key) plus the usual OpenAI env for the extraction fallback, so it runs where the worker
// runs, not on a bare checkout.

const SPIDER_MAN = 'Magic the Gathering Marvels Spider Man Play Booster Box';
const AVATAR_PAGE = 'Avatar: The Last Airbender Collector Booster Box - English';
const FINAL_FANTASY_PREORDER =
  'Magic the Gathering - Final Fantasy Play Booster Box Pre-Order';

// Target names the row might hold while the page shows something else.
const CHOCOBO_BUNDLE = 'Magic: The Gathering - Final Fantasy - Chocobo Bundle';
const POKEMON_ETB =
  'Pokemon Trading Card Game Destined Rivals : Elite Trainer Box';

// The price the row is holding. Passing the price the page itself shows lets the price
// answer resolve first (the early return); passing any other number pushes the call deeper.
// Both branches must still carry the identity answer, so both are asserted as a boolean.
const PRICE_THE_PAGE_SHOWS = 104.95;
const PRICE_IT_DOES_NOT = 1.23;

const page = (title: string) => {
  const found = arrayOfWebpages.find((w) => w.title === title);
  if (!found) {
    throw new Error(`fixture "${title}" is not in webpages.ts — renamed?`);
  }
  return found;
};

describe('CB-028 checkProduct — is the page still the named product?', () => {
  let app: INestApplication;
  let openaiService: OpenaiService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OpenaiModule],
      providers: [OpenaiService],
    }).compile();

    app = moduleFixture.createNestApplication();
    openaiService = moduleFixture.get(OpenaiService);
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('the recorded pages this spec depends on are still present', () => {
    for (const title of [SPIDER_MAN, AVATAR_PAGE, FINAL_FANTASY_PREORDER]) {
      expect(page(title).title).toBe(title);
    }
  });

  describe('the page is the product the row names', () => {
    it('answers true, with the price the row already holds', async () => {
      const w = page(SPIDER_MAN);
      const answer = await openaiService.checkProduct(
        w.title,
        w.content,
        w.productName,
        w.type,
        w.mode,
        false,
        false,
        PRICE_THE_PAGE_SHOWS,
      );
      expect(typeof answer.isNamedProduct).toBe('boolean');
      expect(answer.isNamedProduct).toBe(true);
    });

    it('answers true when the row name is shorter than the page title', async () => {
      // Page title carries an "Avatar:" prefix the row name does not, and both name the
      // same box — the criteria have to survive that, not answer false on the wording.
      const w = page(AVATAR_PAGE);
      const answer = await openaiService.checkProduct(
        w.title,
        w.content,
        w.productName,
        w.type,
        w.mode,
        false,
        false,
        PRICE_IT_DOES_NOT,
      );
      expect(typeof answer.isNamedProduct).toBe('boolean');
      expect(answer.isNamedProduct).toBe(true);
    });

    it('answers true on a sold-out page of the right product', async () => {
      // Recorded correctAnswer for this page is false — it is out of stock, and identity
      // must not read stock. A false here would delete a correct page that simply ran dry.
      const w = page(FINAL_FANTASY_PREORDER);
      const answer = await openaiService.checkProduct(
        w.title,
        w.content,
        w.productName,
        w.type,
        w.mode,
        false,
        false,
        PRICE_IT_DOES_NOT,
      );
      expect(typeof answer.isNamedProduct).toBe('boolean');
      expect(answer.isNamedProduct).toBe(true);
    });
  });

  describe('the page is a different product from the row', () => {
    it('answers false for another product in the same game and packaging', async () => {
      // Same shop, same game, same product type, different box.
      const w = page(SPIDER_MAN);
      const answer = await openaiService.checkProduct(
        w.title,
        w.content,
        CHOCOBO_BUNDLE,
        w.type,
        w.mode,
        false,
        false,
        PRICE_IT_DOES_NOT,
      );
      expect(typeof answer.isNamedProduct).toBe('boolean');
      expect(answer.isNamedProduct).toBe(false);
    });

    it('answers false for a like-shaped product from another game', async () => {
      // A box for a box: identity cannot be answered from the packaging alone.
      const w = page(SPIDER_MAN);
      const answer = await openaiService.checkProduct(
        w.title,
        w.content,
        POKEMON_ETB,
        w.type,
        w.mode,
        false,
        false,
        PRICE_IT_DOES_NOT,
      );
      expect(typeof answer.isNamedProduct).toBe('boolean');
      expect(answer.isNamedProduct).toBe(false);
    });
  });
});
