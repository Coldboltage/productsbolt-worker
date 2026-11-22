import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ProductType, ParsedLinks } from '../app.type.js';
import { ProductInStockWithAnalysis } from '../process/entities/process.entity.js';
import {
  EbayProductStrip,
  EbaySoldProductStrip,
} from '../ebay/entities/ebay.entity.js';
import { ProductDto } from '../process/dto/product.dto.js';
import { ShopifyVariant } from 'src/utils/utils.type.js';
import { writeFileSync } from 'node:fs';
import { noul, TypeSafeClient, type SystemOneResult } from '@typesafe-ai/sdk';

export interface CheckProdutReturn {
  analysis: string;
  soft404: boolean;
  inStock: boolean;
  price: number;
}

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);

  inputTokens = 0;
  outputTokens = 0;

  productInStock = async (
    title: string,
    content: string,
    productName: string,
    type: ProductType,
    mode: string, // e.g., 'mini', 'pro'
    context = '',
    imageUrl: string,
    specificUrl: string,
  ): Promise<ProductInStockWithAnalysis> => {
    const openai = new OpenAI({
      timeout: 3600000,
      maxRetries: 2,
    });

    if (process.env.LOCAL_LLM === 'true') {
      openai.baseURL = process.env.LOCAL_LMM_URL;
      openai.apiKey = process.env.OPEN_ROUTER_KEY;
    }
    // openai.baseURL = `http://${process.env.LOCAL_LMM_URL}:1234/v1`;

    const jevClient = new TypeSafeClient({
      baseURL: process.env.LOCAL_LMM_URL_JEV ?? '',
      apiKey: process.env.OPEN_ROUTER_KEY ?? '',
    });

    const questions = {
      isNamedProduct: noul(
        `
    Is the page's primary sellable product the same logical product as the target?

    Product identity includes game/manufacturer, set/edition,
    product line, language and identity-defining variant.
  `.trim(),
      ),

      packagingTypeMatch: noul(
        `
    Does the page's primary unit of sale match the target product type?

    Determine unit of sale by what the customer receives when purchasing quantity 1.

    Display is equivalent to Box when it represents a sealed booster display.
    A Box containing Packs is still a Box.
    Descriptions of the contents inside a Box do not make the product a Pack.

    Pack, Box, Case, Bundle, Deck, Tin, Binder, Scene Box
    and Board Game are different units of sale.
  `.trim(),
      ),

      editionMatch: noul(
        `
    Does the page's primary product belong to the same game/manufacturer
    and set/edition as the target?

    Ignore casing, punctuation, apostrophes, hyphens and whitespace.
    Do not consider packaging when determining edition.
  `.trim(),
      ),

      isMainProductPage: noul(
        `
    Is the page a dedicated product page for one sellable product?
  `.trim(),
      ),

      inStock: noul(
        `
    Is the page's primary product currently available to purchase?

    Sold out, out of stock and currently unavailable mean no.
  `.trim(),
      ),

      loadedData: noul(
        `
    Does the page contain meaningful product data sufficient
    to identify the product?
  `.trim(),
      ),

      soft404: noul(
        `
Does the page itself claim that the requested URL does not exist,
was not found, was removed, or cannot be displayed?

Judge only whether the URL resolved to a real page on the retailer's
website. Do not compare the page's product with the target product.

Answer FALSE when the page contains a genuine product listing with
a product title, price, description, product details, availability,
or purchase-related controls, even when:
- it is the wrong product compared with the target
- it is sold out or unavailable
- it belongs to a different game, set, edition, or product line

Answer TRUE only when the page content itself represents a not-found
page, missing-page message, removed-product error, or equivalent
successful-HTTP error page.
  `.trim(),
      ),

      hasMixedSignals: noul(
        `
    Does the page contain genuinely conflicting evidence about
    the primary product identity or unit of sale?

    Descriptions of items contained inside the sold product
    are not conflicting evidence.
  `.trim(),
      ),

      isCorrectProduct: noul(
        `
    Is the page's primary sellable product the exact target product?

    Product identity, game/manufacturer, set/edition,
    product line, language and unit of sale must match.

    Use target to determine what is required.
    Use page as evidence for what is actually being sold.
  `.trim(),
      ),
    };

    let jevResponse: SystemOneResult<typeof questions>;

    interface ExtractedProductData {
      analysis: string;
      price: number | null;
      currencyCode: string | null;
      conciseReason: string;
      detectedVariant: string | null;
      detectedFullName: string | null;
    }

    let extracted: ExtractedProductData;

    try {
      jevResponse = await jevClient.systemOne({
        state: {
          target: {
            productName,
            type,
            context,
          },
          page: {
            title,
            content,
            url: specificUrl,
          },
        },
        questions: questions,
        model: 'typesafe/jev-1.14.0',
      });

      this.logger.debug(jevResponse);

      let response;
      try {
        response = await openai.chat.completions.create({
          model:
            process.env.LOCAL_LLM === 'true'
              ? process.env.LOCAL_MODEL_NAME_FREE
              : `gpt-4.1-mini`,
          temperature: 0,
          top_p: 0.9,
          frequency_penalty: 0.05,
          n: 1,
          seed: 42,
          messages: [
            {
              role: 'system',
              content:
                'You are a product-matching assistant. Start by analyzing the product page against the target context. Use this analysis to guide your output of structured product fields. Return ONLY valid JSON (RFC 8259) that conforms to this JSON Schema. All required properties must be present.',
            },
            {
              role: 'user',
              content: `
              Extract factual product information from this page.

              Product title:
              ${title}

              Page content:
              ${content}

              Return only valid JSON matching this shape:

              {
                "analysis": "A very short description of what is being sold",
                "price": A number,
                "currencyCode": "Currency Code. If you can't find, use the best guess based on site",
                "conciseReason": "One short factual summary",
                "detectedVariant": "The explicitly stated product variant",
                "detectedFullName": "The full product name shown on the page"
              }

              Rules:
              - Use only the supplied title and page content.
              - Do not decide whether this matches the target product. Jev has already done that.
              - Extract the current selling price, not an old price, RRP, instalment amount, shipping charge, or unrelated product price.
              - Return null for any value not explicitly supported by the page.
              - currencyCode must be an ISO code such as GBP, EUR, or USD.
              - Do not include Markdown fences or text outside the JSON.
              `.trim(),
            },
          ],

          // response_format: {
          //   type: 'json_schema',
          //   json_schema: schema
          // }
        });
      } catch (error) {
        console.error(error);
        response = await openai.chat.completions.create({
          model:
            process.env.LOCAL_LLM === 'true'
              ? process.env.LOCAL_MODEL_NAME
              : `gpt-4.1-mini`,
          temperature: 0,
          top_p: 0.9,
          frequency_penalty: 0.05,
          n: 1,
          seed: 42,
          messages: [
            {
              role: 'system',
              content:
                'You are a product-matching assistant. Start by analyzing the product page against the target context. Use this analysis to guide your output of structured product fields. Return ONLY valid JSON (RFC 8259) that conforms to this JSON Schema. All required properties must be present.',
            },
            {
              role: 'user',
              content: `
              Extract factual product information from this page.

              Product title:
              ${title}

              Page content:
              ${content}

              Return only valid JSON matching this shape:

              {
                "analysis": "A very short description of what is being sold",
                "price": A number,
                "currencyCode": "Currency Code. If you can't find, use the best guess based on site",
                "conciseReason": "One short factual summary",
                "detectedVariant": "The explicitly stated product variant",
                "detectedFullName": "The full product name shown on the page"
              }

              Rules:
              - Use only the supplied title and page content.
              - Do not decide whether this matches the target product. Jev has already done that.
              - Extract the current selling price, not an old price, RRP, instalment amount, shipping charge, or unrelated product price.
              - Return null for any value not explicitly supported by the page.
              - currencyCode must be an ISO code such as GBP, EUR, or USD.
              - Do not include Markdown fences or text outside the JSON.
              `.trim(),
            },
          ],

          // response_format: {
          //   type: 'json_schema',
          //   json_schema: schema
          // }
        });
      }

      const responseContent = response.choices[0]?.message?.content;

      if (!responseContent) {
        throw new Error('Product extraction returned no content');
      }

      extracted = JSON.parse(responseContent) as ExtractedProductData;
    } catch (error) {
      console.log(error);
    }

    const threshold = 0.7;
    const answers = jevResponse.answers;

    return {
      analysis: extracted.analysis,
      inStock: answers.inStock.noul >= threshold,
      isMainProductPage: answers.isMainProductPage.noul >= threshold,
      isNamedProduct: answers.isNamedProduct.noul >= threshold,
      packagingTypeMatch: answers.packagingTypeMatch.noul >= threshold,
      price: extracted.price,
      currencyCode: extracted.currencyCode,
      conciseReason: extracted.conciseReason,
      detectedVariant: extracted.detectedVariant,
      detectedFullName: extracted.detectedFullName,
      editionMatch: answers.editionMatch.noul >= threshold,
      justifications: {
        inStock: `Confidence: ${answers.inStock.noul}`,
        price: extracted.price ? `Extracted: ${extracted.price}` : 'Not found',
        currencyCode: extracted.currencyCode
          ? `Extracted: ${extracted.currencyCode}`
          : 'Not found',
        isMainProductPage: `Confidence: ${answers.isMainProductPage.noul}`,
        isNamedProduct: `Confidence: ${answers.isNamedProduct.noul}`,
        packagingTypeMatch: `Confidence: ${answers.packagingTypeMatch.noul}`,
        editionMatch: `Confidence: ${answers.editionMatch.noul}`,
      },
      loadedData: answers.loadedData.noul >= threshold,
      hasMixedSignals: answers.hasMixedSignals.noul >= threshold,
      hasMixedSignalsExplain: `Confidence: ${answers.hasMixedSignals.noul}`,
      soft404: answers.soft404.noul >= threshold,
    };
  };

  checkProduct = async (
    title: string,
    content: string,
    productName: string,
    type: ProductType,
    mode: string,
    shopifySite: boolean,
    cloudflare: boolean,
    pagePrice: number,
  ): Promise<CheckProdutReturn> => {
    const openai = new OpenAI({
      timeout: 3600000,
      maxRetries: 2,
    });

    if (process.env.LOCAL_LLM === 'true') {
      openai.baseURL = process.env.LOCAL_LMM_URL;
      openai.apiKey = process.env.OPEN_ROUTER_KEY;
    }

    const jevClient = new TypeSafeClient({
      baseURL: process.env.LOCAL_LMM_URL_JEV ?? '',
      apiKey: process.env.OPEN_ROUTER_KEY ?? '',
    });

    const questions: Record<string, ReturnType<typeof noul>> = {
      soft404: noul('Has the page loaded but presented a 404 error?', {
        true: 'The page has presented a visible 404 or did not load page/product',
        false: 'The page page has not presented a 404 and loaded the page',
      }),
      inStock: noul(
        'Is this product currently available from existing stock?',
        {
          true: 'The webpage indicates that the product is physically in stock and available for immediate purchase.',
          false:
            'The product is out of stock, sold out, or only available for pre-order. Back-in-stock notifications and wishlists do not indicate stock availability.',
        },
      ),
      isPurchasable: noul(
        'Is this product currently available to customers for purchase, including pre-order?',
        {
          true: 'The product is available for purchase from existing inventory, or the customer can explicitly place a pre-order for it. An explicit pre-order option counts even when the product has not yet been released.',

          false:
            'The product cannot currently be ordered. This includes products that are sold out, unavailable, only available for backorder, or offer only wishlist or back-in-stock notification functionality.',
        },
      ),
      priceMatches: noul(
        'Is the number in productPrice the current selling price of the main product on this page, ignoring currency symbol?',
        {
          true: "The amount shown as the main product's current price (next to the title, by Add to Basket) is numerically equal to productPrice. Ignore the currency symbol or code (£, $, €, GBP, etc.) and formatting differences such as 144.95 vs £144.95.",
          false:
            "The main product's current price is a different amount from productPrice, or no price is shown.",
        },
      ),
    };

    const jevResponse = await jevClient.systemOne({
      state: { productPage: content, title, productPrice: pagePrice },
      questions: questions,
      model: 'typesafe/jev-1.14.0',
    });

    this.logger.debug(jevResponse.answers);

    const threshold = 0.8;
    const PRICE_THRESHOLD = 0.7;
    const { priceMatches, isPurchasable, inStock } = jevResponse.answers;

    if (priceMatches.noul >= PRICE_THRESHOLD) {
      // if (false) {
      const result = {
        analysis: 'priceMatches.noul >= PRICE_THRESHOLD = true',
        soft404: jevResponse.answers.soft404.noul >= threshold,
        inStock:
          jevResponse.answers.inStock.noul >= threshold ||
          jevResponse.answers.isPurchasable.noul >= threshold,
        price: +pagePrice,
      };

      console.log(result);

      return result;
    }

    if (isPurchasable.noul <= threshold && inStock.noul <= threshold) {
      // if (false) {
      const result = {
        analysis:
          'isPurchasable.noul <= threshold && inStock.noul <= threshold = true',
        soft404: jevResponse.answers.soft404.noul >= threshold,
        inStock: false,
        price: +pagePrice,
      };

      console.log(result);

      return result;
    }
    // if (process.env.LOCAL_LLM === "true") openai.baseURL = "http://192.168.1.204:1234/v1"

    // 'analysis',
    // 'inStock',
    // 'price',

    // NEW VERSION TESTING
    let openAiResponse;
    try {
      openAiResponse = await openai.chat.completions.create({
        model:
          process.env.LOCAL_LLM === 'true'
            ? process.env.LOCAL_MODEL_NAME_FREE
            : `gpt-4.1-mini`,
        temperature: 0,
        top_p: 0.9,
        frequency_penalty: 0.05,
        n: 1,
        seed: 42,
        reasoning_effort: 'medium',
        messages: [
          {
            role: 'system',
            content: `
Return only valid JSON. 
No markdown, no explanations, no extra text.

Rules:
${shopifySite || 'Extract and return the Shopify price exactly as provided in the source (e.g. 9999), without converting, dividing, or reformatting it.'}


Output schema:
{
  "price": number
}
      `,
          },
          {
            role: 'user',
            content: `
Product title: "${title}"
Page content: ${content}
current date: ${new Date().toISOString()}
      `,
          },
        ],
      });
    } catch (error) {
      console.error(error);
      openAiResponse = await openai.chat.completions.create({
        model:
          process.env.LOCAL_LLM === 'true'
            ? process.env.LOCAL_MODEL_NAME
            : `gpt-4.1-mini`,
        temperature: 0,
        top_p: 0.9,
        frequency_penalty: 0.05,
        n: 1,
        seed: 42,
        reasoning_effort: 'medium',
        messages: [
          {
            role: 'system',
            content: `
Return only valid JSON. 
No markdown, no explanations, no extra text.

Rules:
${shopifySite || 'Extract and return the Shopify price exactly as provided in the source (e.g. 9999), without converting, dividing, or reformatting it.'}


Output schema:
{
  "price": number
}
      `,
          },
          {
            role: 'user',
            content: `
Product title: "${title}"
Page content: ${content}
current date: ${new Date().toISOString()}
      `,
          },
        ],
      });
    }

    const productResponse = JSON.parse(
      openAiResponse.choices[0].message?.content || '{}',
    );

    this.logger.log(productResponse);

    this.inputTokens += +openAiResponse.usage.prompt_tokens;
    this.outputTokens += +openAiResponse.usage.completion_tokens;

    this.logger.log({
      message: 'Tokens currently',
      input: this.inputTokens,
      output: this.outputTokens,
    });

    writeFileSync(
      './tokens.txt',
      JSON.stringify({ input: this.inputTokens, output: this.outputTokens }),
      'utf8',
    );
    const result = {
      analysis: productResponse.analysis,
      soft404: jevResponse.answers.soft404.noul >= threshold,
      inStock:
        jevResponse.answers.inStock.noul >= threshold ||
        jevResponse.answers.isPurchasable.noul >= threshold,
      price: productResponse.price,
    };

    console.log(result);

    return result;
  };

  async ebayPricePoint(
    ebayProductPrices: EbayProductStrip[],
    product: ProductDto,
  ) {
    this.logger.log(product.name);
    const ebayProductPricesJson = JSON.stringify(ebayProductPrices);

    const openai = new OpenAI({
      timeout: 3600000,
      maxRetries: 2,
    });

    if (process.env.EBAY_LOCAL_LLM === 'true')
      openai.baseURL = 'http://192.168.1.204:1234/v1';

    // 'analysis',
    // 'inStock',
    // 'price',
    const openAiResponse = await openai.chat.completions.create({
      // model: process.env.EBAY_LOCAL_LLM === "true" ? "openai/gpt-oss-20b" : `gpt-4.1-mini`,
      model:
        process.env.EBAY_LOCAL_LLM === 'true'
          ? 'qwen/qwen3-4b-2507'
          : `gpt-4.1-mini`,
      // model: process.env.EBAY_LOCAL_LLM === "true" ? "nvidia-nemotron-nano-12b-v2" : `gpt-4.1-mini`,

      temperature: 0,
      top_p: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      n: 1,
      seed: 42,
      // reasoning_effort: "low",
      messages: [
        {
          role: 'system',
          content: `
            Your job is to figure out what products should be included or not, and find out the min, average and max price from a list of the same products and it's prices.
            
            - Do not add \`\`\`json fences.
            - Do not add explanations.
            - Do not add extra text.
            Just return valid JSON according to the schema.
            `,
        },
        {
          role: 'user',
          content: `
       From the array about to be provided, 
        Product name: "${product.name}" It should be as similar and the prices will be close enough but not significant so within reason, There will be products which won't match this and the prices should help indicate which is similar to others as this is a general search.
                To make sure you choose the right product, here is context of the product ${product.context}

        Ebay Listings : ${ebayProductPricesJson}

        ---

          Don't get stuck in recursive thinking

          Output JSON object only
        {
          "type": "object",
          "properties": {
           "minPrice": {
              "type": "number"
            },
            "averagePrice": {
              "type": "number"
            },
            "maxPrice": {
              "type": "number"
            },
             "minActivePrice": {
              "type": "number"
            },
            "reasonForAnswer": {
              "type": "string"
            },
          },
          "required": [
            "minPrice",
            "averagePrice",
            "maxPrice",
            "minActivePrice",
            "reasonForAnswer"
          ]
        }
        `,
        },
      ],
    });

    // this.logger.log(openAiResponse.choices[0].message?.content || '{}')

    const productResponse: {
      minPrice: number;
      averagePrice: number;
      maxPrice: number;
      reasonForAnswer: string;
    } = JSON.parse(openAiResponse.choices[0].message?.content || '{}');
    return productResponse;
  }

  async ebaySoldPricePoint(ebayProductPrices: string, product: ProductDto) {
    this.logger.log(product.name);
    const ebayProductPricesJson = JSON.stringify(ebayProductPrices);

    const openai = new OpenAI({
      timeout: 3600000,
      maxRetries: 2,
    });

    if (process.env.EBAY_LOCAL_LLM === 'true')
      openai.baseURL = 'http://192.168.1.204:1234/v1';

    // 'analysis',
    // 'inStock',
    // 'price',
    const openAiResponse = await openai.chat.completions.create({
      model:
        process.env.EBAY_LOCAL_LLM === 'true'
          ? process.env.LOCAL_MODEL_NAME
          : `gpt-4.1-mini`,
      // model: process.env.EBAY_LOCAL_LLM === "true" ? "qwen/qwen3-4b-2507" : `gpt-4.1-mini`,
      // model: process.env.EBAY_LOCAL_LLM === "true" ? "nvidia-nemotron-nano-12b-v2" : `gpt-4.1-mini`,

      temperature: 0,
      top_p: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      n: 1,
      seed: 42,
      // reasoning_effort: "low",
      messages: [
        {
          role: 'system',
          content: `
            Your job is to figure out what products should be included or not
            
            - Do not add \`\`\`json fences.
            - Do not add explanations.
            - Do not add extra text.
            Just return valid JSON according to the schema.
            `,
        },
        {
          role: 'user',
          content: `
       From the array about to be provided, 
        Product name: "${product.name}" It should be as similar and the prices will be close enough but not significant so within reason, There will be products which won't match this and the prices should help indicate which is similar to others as this is a general search.
        To make sure you choose the right product, here is context of the product ${product.context}
        Ebay Listings : ${ebayProductPricesJson}

        ---

          Don't get stuck in recursive thinking

          Output JSON object only
        {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string"
              },
              "price": {
                "type": "object",
                "properties": {
                  "value": {
                    "type": "number"
                  },
                  "currency": {
                    "type": "string"
                  },
                  "estimatedSoldQuantity": {
                    "type": "number"
                    "description": "We will always set this to one"
                  },
                  "soldDate": {
                    "type": "date"
                  }
                },
                "required": ["value", "currency", "estimatedSoldQuantity"]
              }
            },
            "required": ["name", "price"]
          }
        }
        `,
        },
      ],
    });

    this.logger.log(openAiResponse.choices[0].message?.content || '{}');

    const productResponse: EbaySoldProductStrip[] = JSON.parse(
      openAiResponse.choices[0].message?.content || '{}',
    );
    return productResponse;
  }

  crawlFromSitemap = async (
    sitemapUrls: string[],
    query: string,
    version: string,
    mainUrl: string,
    context: string,
    _amount = 4,
  ): Promise<ParsedLinks[]> => {
    // this.logger.log({ sitemapUrls, query, version, mainUrl, context });

    const openai = new OpenAI({
      timeout: 3600000,
      // maxRetries: 2,
    });

    if (process.env.LOCAL_LLM === 'true') {
      openai.baseURL = process.env.LOCAL_LMM_URL;
      openai.apiKey = process.env.OPEN_ROUTER_KEY;
    }

    // if (process.env.LOCAL_LLM === "true") openai.baseURL = "http://192.168.1.204:1234/v1"

    // let openAiResponse;
    // const roleObject = openaiReduceUrlGen({
    //   sitemapUrls,
    //   query,
    //   mainUrl,
    //   context,
    //   amount,
    // });

    const questions: Record<string, ReturnType<typeof noul>> = {};

    sitemapUrls.forEach((url, index) => {
      questions[`${index}`] = noul(
        `
Does this URL identify the exact sellable product described in the state?

Candidate URL: ${url}
  `.trim(),
        {
          true: `
The URL matches the target product identity, product line,
set/edition, language and packaging/unit-of-sale.

URL wording may use common equivalent forms such as Display for
a sealed retail Booster Box where appropriate.
    `.trim(),

          false: `
The URL identifies a different product, product line, set,
language, packaging/unit-of-sale, accessory, bundle, case,
deck, individual booster, or otherwise conflicts with the target.
    `.trim(),
        },
      );
    });

    type JevQuestions = typeof questions;

    let jevResponse: SystemOneResult<JevQuestions>;

    const jevClient = new TypeSafeClient({
      baseURL: process.env.LOCAL_LMM_URL_JEV ?? '',
      apiKey: process.env.OPEN_ROUTER_KEY ?? '',
    });

    try {
      jevResponse = await jevClient.systemOne({
        state: { product: query, context },
        questions: questions,
        model: 'typesafe/jev-1.14.0',
      });

      // openAiResponse = await openai.chat.completions.create({
      //   model:
      //     process.env.LOCAL_LLM === 'true'
      //       ? process.env.LOCAL_MODEL_NAME
      //       : `gpt-4.1-mini`,
      //   temperature: 0,
      //   top_p: 0.9,
      //   frequency_penalty: 0.05,
      //   n: 1,
      //   seed: 42,
      //   messages: [
      //     {
      //       role: 'system',
      //       content: `Extract product page information - Do not add \`\`\`json fences.
      //       - Do not add explanations.
      //       - Do not add extra text.
      //       Just return valid JSON according to the schema.
      //       - Always include the most specific matching URL (even if another URL scores higher), as long as it matches the same product identity.
      //       - The output array must only contain valid results. If a result does not meet all rules, it must be excluded before the final answer is formed of 0.9 and over
      //       `,
      //     },
      //     {
      //       role: 'user',
      //       content: roleObject.content,
      //     },
      //   ],
      //   // text: {
      //   //   format: zodTextFormat(sitemapBestLinkSchema, 'links'),
      //   // },
      // });
    } catch (error) {
      this.logger.log('Error with openai', error);
      throw error;
    }

    // if (!openAiResponse.output_parsed) throw new Error('crawlError');

    // const linksResponse = openAiResponse.output_parsed as BestSitesInterface;
    if (!jevResponse) throw new Error('crawlError');

    const links: ParsedLinks[] = sitemapUrls
      .map((url, index) => ({
        url,
        score: jevResponse.answers[`${index}`].noul,
      }))
      .filter((link) => link.score > 0.7)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    return links;

    // const linksResponse = JSON.parse(
    //   openAiResponse.choices[0].message?.content,
    // ) as ParsedLinks[];
    // this.logger.log(openAiResponse);
    // this.logger.log(linksResponse);

    // return linksResponse;
  };

  whichVariant = async (
    query: string,
    context: string,
    variants: ShopifyVariant[],
    type: ProductType,
  ): Promise<{ index: number; justification: string }> => {
    // this.logger.log({ sitemapUrls, query, version, mainUrl, context });

    const openai = new OpenAI({
      timeout: 3600000,
      // maxRetries: 2,
    });

    if (process.env.LOCAL_LLM === 'true') {
      openai.baseURL = process.env.LOCAL_LMM_URL;
      openai.apiKey = process.env.OPEN_ROUTER_KEY;
    }

    // if (process.env.LOCAL_LLM === "true") openai.baseURL = "http://192.168.1.204:1234/v1"

    let openAiResponse;
    try {
      openAiResponse = await openai.chat.completions.create({
        model:
          // process.env.LOCAL_LLM === 'true'
          //   ? 'qwen/qwen3-4b-2507'
          //   : `gpt-4.1-${version}`,
          // process.env.LOCAL_LLM === 'true'
          //   ? 'Qwen/Qwen3-4B-Instruct-2507'
          //   : `gpt-4.1-mini`,
          process.env.LOCAL_LLM === 'true'
            ? process.env.LOCAL_MODEL_NAME
            : `gpt-4.1-mini`,
        messages: [
          {
            role: 'system',
            content: `Extract product page information - Do not add \`\`\`json fences.
            - Do not add explanations.
            - Do not add extra text.
            Just return valid JSON according to the schema.`,
          },
          {
            role: 'user',
            content: `
            
            Here are the variants as objects. Please seperate each one: ${JSON.stringify(variants.map((variant) => variant))}
            
            Here is the product in question, ${query}. Here is the product packaging type: ${type}

            Here is the context to help what we are looking to buy: ${context}

            -- Rules --

            Your job is to give me the index number of the variant and justifications to why you chose it. It can only be one. Variants in this case are generally the same product but packaged in a different way. Using the type, you will be able to determine which object is the correct one to identify. The Context will help you understand what we are aiming to identify while the product is what we're aiming to buy.

          
          JSON OUTPUT with object

          {
            "type": "object",
            "properties": {
              "index": {
                "type": "number"
              },
            "justification": {
              "type": "string",
            }
            },
            "required": ["index", "justification"],
            "additionalProperties": false
          },
        }
          `,
          },
        ],
        // text: {
        //   format: zodTextFormat(sitemapBestLinkSchema, 'links'),
        // },
      });
    } catch (error) {
      this.logger.log('Error with openai', error);
    }

    // if (!openAiResponse.output_parsed) throw new Error('crawlError');

    // const linksResponse = openAiResponse.output_parsed as BestSitesInterface;

    if (!openAiResponse.choices[0].message?.content)
      throw new Error('crawlError');

    const linksResponse = JSON.parse(
      openAiResponse.choices[0].message?.content,
    ) as { index: number; justification: string };
    this.logger.log(linksResponse);

    return linksResponse;
  };

  whichVariantNormalText = async (
    query: string,
    context: string,
    htmlString: string,
    type: ProductType,
  ): Promise<{ variantId: number; justification: string }> => {
    // this.logger.log({ sitemapUrls, query, version, mainUrl, context });

    const openai = new OpenAI({
      timeout: 3600000,
      // maxRetries: 2,
    });

    if (process.env.LOCAL_LLM === 'true') {
      openai.baseURL = process.env.LOCAL_LMM_URL;
      openai.apiKey = process.env.OPEN_ROUTER_KEY;
    }

    // if (process.env.LOCAL_LLM === "true") openai.baseURL = "http://192.168.1.204:1234/v1"

    let openAiResponse;
    try {
      openAiResponse = await openai.chat.completions.create({
        model:
          // process.env.LOCAL_LLM === 'true'
          //   ? 'qwen/qwen3-4b-2507'
          //   : `gpt-4.1-${version}`,
          // process.env.LOCAL_LLM === 'true'
          //   ? 'Qwen/Qwen3-4B-Instruct-2507'
          //   : `gpt-4.1-mini`,
          process.env.LOCAL_LLM === 'true'
            ? process.env.LOCAL_MODEL_NAME
            : `gpt-4.1-mini`,
        messages: [
          {
            role: 'system',
            content: `Extract product page information - Do not add \`\`\`json fences.
            - Do not add explanations.
            - Do not add extra text.
            Just return valid JSON according to the schema.`,
          },
          {
            role: 'user',
            content: `
            
            Here is the shopify object: ${htmlString}. It should include the variant in question
            
            Here is the product in question, ${query}. Here is the product packaging type: ${type}

            Here is the context to help what we are looking to buy: ${context}

            -- Rules --

            Your job is to give me the variantId of the which aligns with the context and justifications to why you chose it. It can only be one. Variants in this case are generally the same product but packaged in a different way. Using the type, you will be able to determine which object is the correct one to identify. The Context will help you understand what we are aiming to identify while the product is what we're aiming to buy.

          
          JSON OUTPUT with object

          {
            "type": "object",
            "properties": {
              "variantId": {
                "type": "number"
              },
            "justification": {
              "type": "string",
            }
            },
            "required": ["variantId", "justification"],
            "additionalProperties": false
          },
        }
          `,
          },
        ],
        // text: {
        //   format: zodTextFormat(sitemapBestLinkSchema, 'links'),
        // },
      });
    } catch (error) {
      this.logger.log('Error with openai', error);
    }

    // if (!openAiResponse.output_parsed) throw new Error('crawlError');

    // const linksResponse = openAiResponse.output_parsed as BestSitesInterface;

    if (!openAiResponse.choices[0].message?.content)
      throw new Error('crawlError');

    const linksResponse = JSON.parse(
      openAiResponse.choices[0].message?.content,
    ) as { variantId: number; justification: string };
    this.logger.log(linksResponse);

    return linksResponse;
  };
}
