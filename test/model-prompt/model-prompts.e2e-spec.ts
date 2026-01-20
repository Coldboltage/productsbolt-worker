import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { OpenaiModule } from '../../src/openai/openai.module';
import { prompts } from './prompts';
import { OpenaiService } from '../../src/openai/openai.service';
import { arrayOfWebpages } from './webpages';
import 'dotenv/config';
import { unscannedArrayOfWebpages } from './unscannedWebpages';

jest.setTimeout(60_000);

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let openaiService: OpenaiService;
  const testPrompts = prompts;
  const RUNS = 1;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OpenaiModule],
      providers: [OpenaiService],
    }).compile();

    app = moduleFixture.createNestApplication();
    openaiService = moduleFixture.get(OpenaiService);
    await app.init();
  });

  describe('should find an array of prompts', () => {
    it('should find at least one prompt', () => {
      // Arrange
      // Act
      // Assert
      expect(testPrompts.length).toBeGreaterThan(0);
    });
  });

  describe('should find an array of website information', () => {
    it('should find at least one website', () => {
      expect(arrayOfWebpages.length).toBeGreaterThan(0);
    });
  });

  describe('test each website', () => {
    for (let run = 1; run <= RUNS; run++) {
      it.each(arrayOfWebpages)(
        'should output with the correct answer provided',
        async (arrayOfWebpage) => {
          // Arrange
          const inputPrompt = {
            title: arrayOfWebpage.title,
            content: arrayOfWebpage.content,
            productName: arrayOfWebpage.productName,
            type: arrayOfWebpage.type,
            mode: arrayOfWebpage.mode,
            context: arrayOfWebpage.context,
          };
          // Act
          const llmResponse = await openaiService.checkProduct(
            inputPrompt.title,
            inputPrompt.content,
            inputPrompt.productName,
            inputPrompt.type,
            inputPrompt.mode,
          );
          // Assert
          expect(llmResponse.inStock).toBe(arrayOfWebpage.correctAnswer);
        },
      );
    }
  });

  describe.only('test each page versus specific context/query', () => {
    const RUNS = 1;
    // Arrange
    for (let run = 1; run <= RUNS; run++) {
      for (const [index, webpage] of unscannedArrayOfWebpages.entries()) {
        if (index > 10) continue; // 2nd item (0-based)
        it.each(webpage.examples)(
          'should get each classification correct',
          async (example) => {
            // Act
            const llmResponse = await openaiService.productInStock(
              webpage.title,
              webpage.content,
              example.productName,
              example.type,
              example.mode,
              example.context,
            );
            // Assert
            expect(llmResponse.inStock).toEqual(example.inStock);
            expect(llmResponse.isNamedProduct).toEqual(example.isNamedProduct);
            expect(llmResponse.packagingTypeMatch).toEqual(
              example.packagingTypeMatch,
            );
            expect(llmResponse.editionMatch).toEqual(example.editionMatch);
          },
        );
      }
    }
  });
});
