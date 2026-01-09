import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import z from 'zod';
import { ProductType, BestSitesInterface, ParsedLinks } from '../app.type.js';
import { ProductInStockWithAnalysis } from '../process/entities/process.entity.js';
import {
  EbayProductStrip,
  EbaySoldProductStrip,
} from '../ebay/entities/ebay.entity.js';
import { ProductDto } from '../process/dto/product.dto.js';

@Injectable()
export class OpenaiService {
  productInStock = async (
    title: string,
    content: string,
    productName: string,
    type: ProductType,
    mode: string, // e.g., 'mini', 'pro'
    context = '',
  ): Promise<ProductInStockWithAnalysis> => {
    const openai = new OpenAI({
      timeout: 3600000,
      maxRetries: 2,
    });

    if (process.env.LOCAL_LLM === 'true')
      openai.baseURL = `http://${process.env.LOCAL_LMM_URL}:1234/v1`;
    // if (process.env.LOCAL_LLM === "true") openai.baseURL = "http://192.168.1.204:1234/v1"

    //     const schema = {
    //       name: 'product_in_stock_with_analysis',
    //       strict: true,
    //       schema: {
    //         type: 'object',
    //         properties: {
    //           analysis: {
    //             type: 'string',
    //             description:
    //               'Very Concisely, use this field to reason about what the product fundamentally is, based on all available evidence. Analyze the product title, description, and any contextual information to determine what is actually being sold. This includes identifying the structural nature of the product — such as its format, scale, packaging, or presentation — and not just repeating its name.\n\nThis reasoning step should infer the real-world object the customer would receive if they clicked "Add to Cart", regardless of how it is named or marketed. Key signals might include:\n- Quantity indicators (e.g., “12 ×”, “bundle includes”, “contains”, etc.)\n- Packaging references (e.g., “starter set”, “box of”, “individual item”)\n- Functional descriptors (e.g., “preconstructed”, “sealed display”, “sampler”) \n- Variant markers (e.g., language, edition, exclusivity, series)\n\nDo not assume the product type from title or branding alone — interpret it based on described structure and intended delivery. For example, a product named “XYZ Starter Deck” should not be classified as a deck unless it is clearly described as a self-contained deck product.\n\nThis field is not used to decide availability (stock), listing status (main page), or pricing — it is strictly a semantic reasoning step to inform type, naming, and variant matching.'
    //           },
    //           justifications: {
    //             type: 'object',
    //             description:
    //               'For every flag below, very concisely quote or paraphrase the page snippet that proves it.',
    //             properties: {
    //               inStock: { type: 'string' },
    //               price: { type: 'string' },
    //               currencyCode: { type: 'string' },
    //               isMainProductPage: { type: 'string' },
    //               isNamedProduct: { type: 'string' },
    //               packagingTypeMatch: { type: 'string' },
    //               editionMatch: { type: 'string' }
    //             },
    //             required: [
    //               'inStock',
    //               'price',
    //               'currencyCode',
    //               'isMainProductPage',
    //               'isNamedProduct',
    //               'packagingTypeMatch',
    //               'editionMatch'
    //             ],
    //             additionalProperties: false
    //           },

    //           inStock: {
    //             type: 'boolean',
    //             description: 'True if the item is currently in stock and available for purchase.'
    //           },
    //           isMainProductPage: {
    //             type: 'boolean',
    //             description: `True only if the page is exclusively or primarily about the single target product, without listing multiple products, variants, bundles, or related items.
    //     If the page shows a category, collection, or multiple different products—even if related—this must be false.`
    //           },
    //           isNamedProduct: {
    //             type: 'boolean',
    //             description: 'True if the exact product name appears in the page title or description.'
    //           },
    //           packagingTypeMatch: {
    //             type: 'boolean',
    //             description:
    //               `True only if the sales unit the customer receives matches the expected product type exactly, or qualifies as a close equivalent (e.g., a box containing multiple units of the expected type).
    // The product type should reflect the actual item sold to the customer, not merely its contents or components.`
    //           },
    //           price: {
    //             type: 'number',
    //             description: 'The numeric price of the product, without currency symbol.'
    //           },
    //           currencyCode: {
    //             type: 'string',
    //             description: 'The 3-letter ISO currency code (e.g., GBP, USD, EUR).'
    //           },
    //           conciseReason: {
    //             type: 'string',
    //             description: 'Short justification (≤ 160 chars) summarizing the match outcome.'
    //           },
    //           detectedVariant: {
    //             type: 'string',
    //             description: 'Short identifier for the detected product variant (e.g., Collector, English, 2025).'
    //           },
    //           detectedFullName: {
    //             type: 'string',
    //             description: 'The full product name as listed on the page.'
    //           },
    //           editionMatch: {
    //             type: 'boolean',
    //             description: 'True if all variant tokens match and no conflicting variants are present.'
    //           }
    //         },
    //         required: [
    //           'analysis',
    //           'inStock',
    //           'isMainProductPage',
    //           'isNamedProduct',
    //           'packagingTypeMatch',
    //           'price',
    //           'currencyCode',
    //           'conciseReason',
    //           'detectedVariant',
    //           'detectedFullName',
    //           'editionMatch',
    //           'justifications'
    //         ],
    //         additionalProperties: false
    //       }
    //     };

    const response = await openai.chat.completions.create({
      // model: `gpt-4.1-${mode}`,
      // model: process.env.LOCAL_LLM === "true" ? "openai/gpt-oss-20b" : `gpt-4.1-${mode}`,
      model:
        process.env.LOCAL_LLM === 'true'
          ? 'qwen/qwen3-4b-2507'
          : `gpt-4.1-mini`,
      // process.env.LOCAL_LLM === 'true'
      //   ? 'liquid/lfm2.5-1.2b'
      //   : `gpt-4.1-mini`,
      // model: `gpt-5-nano`,
      // reasoning_effort: "low",
      // temperature: 0,
      temperature: 0.2,
      top_p: 0.9,
      frequency_penalty: 0.05,
      n: 1,
      seed: 42,
      messages: [
        {
          role: 'system',
          content:
            'You are a product-matching assistant. Start by analyzing the product page against the target context. Use this analysis to guide your output of structured product fields.',
        },
        {
          role: 'user',
          // content: `Required Target product name: ${productName}
          //     Required Expected product type: ${type.toUpperCase()}
          //     Context: ${context}

          //     Analysed Product Title: ${title}
          //     Analaysed Page Content: ${content}

          //     --- JSON Schema to follow strictly and exactly as shown ---
          //     {
          //       "type": "object",
          //       "properties": {
          //         "analysis": {
          //           "type": "string",
          //           "description": "Very Concisely in as little words as possible, use this field to reason about what the product fundamentally is, based on all available evidence. Analyze the product title, description, and any contextual information to determine what is actually being sold. This includes identifying the structural nature of the product — such as its format, scale, packaging, or presentation — and not just repeating its name.\n\nThis reasoning step should infer the real-world object the customer would receive if they clicked \"Add to Cart\", regardless of how it is named or marketed. Key signals might include:\n- Quantity indicators (e.g., “12 ×”, “bundle includes”, “contains”, etc.)\n- Packaging references (e.g., “starter set”, “box of”, “individual item”)\n- Functional descriptors (e.g., “preconstructed”, “sealed display”, “sampler”)\n- Variant markers (e.g., language, edition, exclusivity, series)\n\nDo not assume the product type from title or branding alone — interpret it based on described structure and intended delivery. For example, a product named “XYZ Starter Deck” should not be classified as a deck unless it is clearly described as a self-contained deck product.\n\nThis field is not used to decide availability (stock), listing status (main page), or pricing — it is strictly a semantic reasoning step to inform type, naming, and variant matching."
          //         },
          //         "justifications": {
          //           "type": "object",
          //           "description": "For every flag below, very concisely in the least words possible, quote or paraphrase the page snippet that proves it.",
          //           "properties": {
          //             "inStock": { "type": "string" },
          //             "price": { "type": "string" },
          //             "currencyCode": { "type": "string" },
          //             "isMainProductPage": { "type": "string" },
          //             "isNamedProduct": { "type": "string", description: Explain if product title is the same as product name },
          //             "packagingTypeMatch": { "type": "string" },
          //             "editionMatchReasoning": { "type": "string" }
          //           },
          //           "required": [
          //             "inStock",
          //             "price",
          //             "currencyCode",
          //             "isMainProductPage",
          //             "isNamedProduct",
          //             "packagingTypeMatch",
          //             "editionMatchReasoning"
          //           ],
          //           "additionalProperties": false
          //         },
          //         "inStock": { "type": "boolean" },
          //         "isMainProductPage": { "type": "boolean" },
          //         "isNamedProduct": { "type": "boolean" , description: Explain if product title is the same as product name},
          //         "packagingTypeMatch": { "type": "boolean" },
          //         "price": { "type": "number" },
          //         "currencyCode": { "type": "string" },
          //         "conciseReason": { "type": "string" },
          //         "detectedVariant": { "type": "string" },
          //         "detectedFullName": { "type": "string" },
          //         "editionMatch": { "type": "boolean" }
          //       },
          //       "required": [
          //         "analysis",
          //         "inStock",
          //         "isMainProductPage",
          //         "isNamedProduct",
          //         "packagingTypeMatch",
          //         "price",
          //         "currencyCode",
          //         "conciseReason",
          //         "detectedVariant",
          //         "detectedFullName",
          //         "editionMatch",
          //         "justifications"
          //       ],
          //       "additionalProperties": false
          //     }`,
          content: `Required Target product name: ${productName}
              Required Expected product type: ${type.toUpperCase()}
              Context: ${context}

              Analysed Product Title: ${title}
              Analaysed Page Content: ${content}

              --- JSON Schema to follow strictly and exactly as shown ---
              {
                "type": "object",
                "properties": {
                  "analysis": {
                    "type": "string",
                    "description": "Very Concisely in as little words as possible, use this field to reason about what the product fundamentally is, based on all available evidence. Analyze the product title, description, and any contextual information to determine what is actually being sold. This includes identifying the structural nature of the product — such as its format, scale, packaging, or presentation — and not just repeating its name.\n\nThis reasoning step should infer the real-world object the customer would receive if they clicked \"Add to Cart\", regardless of how it is named or marketed. Key signals might include:\n- Quantity indicators (e.g., “12 ×”, “bundle includes”, “contains”, etc.)\n- Packaging references (e.g., “starter set”, “box of”, “individual item”)\n- Functional descriptors (e.g., “preconstructed”, “sealed display”, “sampler”)\n- Variant markers (e.g., language, edition, exclusivity, series)\n\nDo not assume the product type from title or branding alone — interpret it based on described structure and intended delivery. For example, a product named “XYZ Starter Deck” should not be classified as a deck unless it is clearly described as a self-contained deck product.\n\nThis field is not used to decide availability (stock), listing status (main page), or pricing — it is strictly a semantic reasoning step to inform type, naming, and variant matching. To note, a booster display is usually indicitive of a Box. The description usually gives light to this. Products that state a quantity of booster packs (e.g. “X packs”) and are purchased as one item represent a sealed box containing packs, even though the description references packs."
                  },
                  "justifications": {
                    "type": "object",
                    "description": "For every flag below, very concisely in the least words possible, quote or paraphrase the page snippet that proves it.",
                    "properties": {
                      "packagingTypeMatchExplain": { "type": "string" },
                      "editionMatchReasoning": { "type": "string", "description": "True only if the main product on the page belongs to the same named edition/release as the Required Target product. 'Edition' here means the named product line identifier (the set/series/theme/brand name that distinguishes one release from another). Do not use packaging or sale-unit terms (e.g., box/pack/bundle/display/booster/deck) to determine edition—those belong to packagingTypeMatch. Judge the main product only, not related or recommended items." }
                    },
                    "required": [
                      "packagingTypeMatchExplain",
                      "editionMatchReasoning"
                    ],
                    "additionalProperties": false
                  },
                  "inStock": { "type": "boolean" },
                  "isMainProductPage": { "type": "boolean" },
                  "isNamedProduct": {
                    "type": "boolean",
                    "description": "True if the productName provided as the target refers to the same logical product as the main product listed on the page. The comparison must be made against the page’s primary product only (not related or recommended items) and should allow for naming variations while requiring the same product identity."
                  },
                  "packagingTypeMatch": { "type": "boolean", "description": "If packaging type matches. BOX ≠ PACK, BOX ≠ BUNDLE, BOX ≠ CASE, BOX ≠ DISPLAY unless your BOX definition explicitly includes DISPLAY. Evaluate only the main page product."
                  },
                  "price": { "type": "number" },
                  "currencyCode": { "type": "string" },
                  "detectedVariant": { "type": "string" },
                  "detectedFullName": { "type": "string" },
                  "editionMatch": { "type": "boolean", "description": "main product on the page belongs to the same named edition/release as the Required Target product. 'Edition' here means the named product line identifier (the set/series/theme/brand name that distinguishes one release from another). Do not use packaging or sale-unit terms (e.g., box/pack/bundle/display/booster/deck) to determine edition—those belong to packagingTypeMatch. Judge the main product only, not related or recommended items." },
                  "conciseReason": { "type": "string", "description": Explain what is true and false, why you've given them the designation as concise as possible. },

                },
                "required": [
                  "analysis",
                  "inStock",
                  "isMainProductPage",
                  "isNamedProduct",
                  "packagingTypeMatch",
                  "price",
                  "currencyCode",
                  "conciseReason",
                  "detectedVariant",
                  "detectedFullName",
                  "editionMatch",
                  "justifications"
                ],
                "additionalProperties": false
              }`,
        },
      ],

      // response_format: {
      //   type: 'json_schema',
      //   json_schema: schema
      // }
    });

    const json = JSON.parse(response.choices[0].message?.content || '{}');
    return json;
  };

  //   checkProduct = async (
  //     title: string,
  //     content: string,
  //     productName: string,
  //     type: ProductType,
  //     mode: string

  //   ): Promise<{
  //     analysis: string,
  //     inStock: boolean,
  //     price: number
  //   }> => {
  //     const openai = new OpenAI({
  //       baseURL: "http://127.0.0.1:1234/v1"
  //     });

  //     const schema = {
  //       name: 'product_update',
  //       strict: true,
  //       schema: {
  //         type: 'object',
  //         properties: {
  //           analysis: {
  //             type: 'string',
  //             description: `
  //     Using the product page, state if the product can be ordered right now and how.
  //     - Consider "available" (including preorder) ONLY if there is a visible, enabled purchase mechanism such as "Add to cart", "Buy now", or "Preorder now" with quantity selection.
  //     - If the page only shows "Notify me", "Request notification", a date, or a price with no purchase button, it is NOT available.
  //     - If uncertain, assume NOT available.
  //     `
  //           },
  //           inStock: {
  //             type: 'boolean',
  //             description: `
  //     True ONLY if a visible, enabled purchase mechanism exists (e.g., "Add to cart", "Buy now", "Preorder now") with quantity selection.
  //     False if there is only "Notify me"/"Request notification", only a release date, the purchase button is disabled/hidden, or ordering is otherwise impossible. It should also be false if SOLD OUT TO PRE-ORDER found.
  //     If the page is undefined or ambiguous, assume false.
  //     `
  //           },
  //           price: {
  //             type: 'number',
  //             description: 'The numeric price of the product, without currency symbol.'
  //           },
  //         },
  //         required: [
  //           'analysis',
  //           'inStock',
  //           'price',
  //         ],
  //         additionalProperties: false
  //       }
  //     };

  //     // 'analysis',
  //     // 'inStock',
  //     // 'price',
  //     const openAiResponse = await openai.chat.completions.create({
  //       model: `gpt-4.1-${mode}`,
  //       temperature: 0,
  //       top_p: 1,
  //       presence_penalty: 0,
  //       frequency_penalty: 0,
  //       n: 1,
  //       seed: 42,
  //       messages: [
  //         {
  //           role: 'system',
  //           content:
  //             'Your task is to extract structured product page information. Always verify product name match and ensure the product type (e.g., box or pack) is strictly respected.',
  //         },
  //         {
  //           role: 'user',
  //           content: `
  //           From the page content, find if the product is in stock and its price.
  // Product title: "${title}"
  // Page content: ${content}
  // `,
  //         },
  //       ],
  //       response_format: {
  //         type: 'json_schema',
  //         json_schema: schema
  //       }
  //     });

  //     const productResponse = JSON.parse(openAiResponse.choices[0].message?.content || '{}');
  //     return productResponse;
  //   };

  checkProduct = async (
    title: string,
    content: string,
    productName: string,
    type: ProductType,
    mode: string,
  ): Promise<{
    analysis: string;
    inStock: boolean;
    price: number;
  }> => {
    const openai = new OpenAI({
      timeout: 3600000,
      maxRetries: 2,
    });

    if (process.env.LOCAL_LLM === 'true')
      openai.baseURL = `http://${process.env.LOCAL_LMM_URL}:1234/v1`;
    // if (process.env.LOCAL_LLM === "true") openai.baseURL = "http://192.168.1.204:1234/v1"

    // 'analysis',
    // 'inStock',
    // 'price',

    // NEW VERSION TESTING
    const openAiResponse = await openai.chat.completions.create({
      model:
        process.env.LOCAL_LLM === 'true'
          ? 'qwen/qwen3-4b-2507'
          : `gpt-4.1-${mode}`,
      // process.env.LOCAL_LLM === 'true'
      //   ? 'liquid/lfm2.5-1.2b'
      //   : `gpt-4.1-mini`,
      temperature: 0.2,
      top_p: 0.9,
      frequency_penalty: 0.05,
      n: 1,
      seed: 42,
      messages: [
        {
          role: 'system',
          content: `
Return only valid JSON. 
No markdown, no explanations, no extra text.

Rules:
- If the page has "Out of Stock", "Sold Out", "Currently Unavailable",
  "Request notification", or "Notify me when available" → OUT OF STOCK.
- Preorders are only classified as IN STOCK if the text of the page contains explicit checkout phrases such as ‘Add to cart’, ‘Add to basket’, ‘Buy now’, ‘Pre-order now’, or ‘Reserve now’, which confirm the product can be actively ordered; if the text merely mentions ‘pre-order’ without including one of these checkout phrases, or if it instead shows wording like ‘Request notification’, ‘Notify me when available’, ‘Out of stock’, or similar, then the product must be treated as OUT OF STOCK.
- If unclear, default to OUT OF STOCK.

Output schema:
{
  "analysis": "tiny reason",
  "inStock": true/false,
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

    //  OLD VERSION - THIS WORKED WELL
    //        const openAiResponse = await openai.chat.completions.create({
    //       // model: process.env.LOCAL_LLM === "true" ? "openai/gpt-oss-20b" : `gpt-4.1-${mode}`,
    //       model: process.env.LOCAL_LLM === "true" ? "qwen/qwen3-4b-2507" : `gpt-4.1-${mode}`,

    //       temperature: 0.2,
    //       top_p: 0.9,
    //       frequency_penalty: 0.05,
    //       n: 1,
    //       seed: 42,
    //       messages: [
    //         {
    //           role: 'system',
    //           // content:
    //           //   `Your task is to extract structured product page information. Always verify product name match and ensure the product type (e.g., box or pack) is strictly respected.

    //           //   - Do not add \`\`\`json fences.
    //           //   - Do not add explanations.
    //           //   - Do not add extra text.
    //           //   Just return valid JSON according to the schema.
    //           //   `,
    //           content: `
    //          - Do not add \`\`\`json fences.
    //             - Do not add explanations.
    //             - Do not add extra text.
    //             Just return valid JSON according to the schema.

    // From the page content, find if the product is in stock and its price. Products which are pre-order and have the ability to order now are considered in stock.

    // Rules (keep simple, priority order):
    // - If the page contains phrases like "Out of Stock", "Sold Out", "Currently Unavailable",
    //   "Click here to be notified when it’s back in stock", "Request notification",
    //   "Notify me when available", "Email me when it's back in stock" → OUT OF STOCK.
    // - A valid preorder must include an actionable checkout option such as
    //   "Add to cart", "Add to basket", "Buy now", "Pre-order now", "Reserve now".
    //   If these are present, treat as IN STOCK (preorder allowed).
    // - If only "Request notification" or "Notify when available" is present without an actionable checkout, → OUT OF STOCK.
    // - If nothing matches clearly, default to OUT OF STOCK.

    // Output JSON:

    // {
    //   "type": "object",
    //   "properties": {
    //     "analysis": {
    //       "type": "string",
    //       "description": "Extremely concise in as little words justification for why the product is in stock or not. Preorders are considered in stock if a checkout/ordering option is present. If only a notify/request notification is available, it is out of stock."
    //     },
    //     "inStock": {
    //       "type": "boolean",
    //       "description": "True if product can be ordered or preordered (checkout/reserve available). False if clearly out of stock or only notify options."
    //     },
    //     "price": {
    //       "type": "number",
    //       "description": "Product price as a number, without currency symbols."
    //     }
    //   },
    //   "required": ["inStock","price"]
    // }
    // `
    //         },
    //         {
    //           role: 'user',
    //           content: `
    //         From the page content, find if the product is in stock and its price. Products which are pre-order and have the ability to order now, is allowed.
    //         Product title: "${title}"
    //         Page content: ${content}

    //         ---

    //         Output JSON

    //             {
    //         "type": "object",
    //         "properties": {
    //           "analysis": {
    //             "type": "string",
    //             "description": "Justification for why the product is in stock or not (tldr). Preorders are considered in stock if a checkout/ordering option is present. If the page contains phrases like 'Click here to be notified when it’s back in stock' or 'Request notification', then it's considered out of stock regardless.

    //             IMPORTANT:
    //             - If "Request notification" or "Notify me when available" appears anywhere in the main product section, the product is OUT OF STOCK.
    //             - This overrides any generic "Pre-order" wording elsewhere unless an actual actionable button ("Add to cart", "Pre-order now") is clearly present for this product.
    //             - Do NOT treat "Request notification" as preorder.
    //             - A valid preorder must include an actual checkout option (e.g., "Add to cart", "Pre-order now").
    //             "
    //           },
    //           "inStock": {
    //             "type": "boolean",
    //             "description": "True if the product can be ordered or preordered (checkout/reserve available). False if clearly marked out of stock, or if only a 'request notification' option is available."
    //           },
    //           "price": {
    //             "type": "number",
    //             "description": "Product price as a number, without currency symbols."
    //           }
    //         },
    //         "required": [
    //           "inStock",
    //           "price"
    //         ]
    //       }
    //         `,
    //         },
    //       ],
    //     });

    console.log(openAiResponse.choices[0].message?.content || '{}');

    const productResponse = JSON.parse(
      openAiResponse.choices[0].message?.content || '{}',
    );
    return productResponse;
  };

  async ebayPricePoint(
    ebayProductPrices: EbayProductStrip[],
    product: ProductDto,
  ) {
    console.log(product.name);
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

    // console.log(openAiResponse.choices[0].message?.content || '{}')

    const productResponse: {
      minPrice: number;
      averagePrice: number;
      maxPrice: number;
      reasonForAnswer: string;
    } = JSON.parse(openAiResponse.choices[0].message?.content || '{}');
    return productResponse;
  }

  async ebaySoldPricePoint(ebayProductPrices: string, product: ProductDto) {
    console.log(product.name);
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
          ? 'openai/gpt-oss-20b'
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

    console.log(openAiResponse.choices[0].message?.content || '{}');

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
    context,
  ): Promise<ParsedLinks[]> => {
    console.log(sitemapUrls);
    const sitemapBestLinkSchema = z.object({
      bestSites: z.array(
        z.object({
          url: z.string(),
          score: z.number(),
        }),
      ),
    });

    const openai = new OpenAI({
      timeout: 3600000,
      maxRetries: 2,
    });

    if (process.env.LOCAL_LLM === 'true')
      openai.baseURL = `http://${process.env.LOCAL_LMM_URL}:1234/v1`;
    // if (process.env.LOCAL_LLM === "true") openai.baseURL = "http://192.168.1.204:1234/v1"

    let openAiResponse;
    try {
      openAiResponse = await openai.chat.completions.create({
        model:
          process.env.LOCAL_LLM === 'true'
            ? 'qwen/qwen3-4b-2507'
            : `gpt-4.1-${version}`,
        temperature: 0,
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
            content: `Please use the sitemap URLs and figure the best links to use for ${query}. The URLs must include ${mainUrl} within the url. URLs: ${sitemapUrls.join(', ')}. Links that are below 0.9 score will not be included. Therefore only include links with scores which are 0.9 or above. Highest score first. Only give 4 links maximum.
          
          To find out more about the product, here is it's description to help you ${context}
          
          JSON OUTPUT with object

          {


            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "url": {
                  "type": "string"
                },
              "score": {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "multipleOf": 0.01,
              "description": "A relevance score between 0 and 1 (inclusive), rounded to two decimal places. 1 = perfect match, 0 = not relevant. Each result must have a unique score so that the list forms a strict ranking with no ties."
            }
              },
              "required": ["url", "score"],
              "additionalProperties": false
            },
            "required": ["bestSites"],
            "additionalProperties": false
      }
          `,
          },
        ],
        // text: {
        //   format: zodTextFormat(sitemapBestLinkSchema, 'links'),
        // },
      });
    } catch (error) {
      console.log('Error with openai', error);
    }

    // if (!openAiResponse.output_parsed) throw new Error('crawlError');

    // const linksResponse = openAiResponse.output_parsed as BestSitesInterface;

    if (!openAiResponse.choices[0].message?.content)
      throw new Error('crawlError');

    const linksResponse = JSON.parse(
      openAiResponse.choices[0].message?.content,
    ) as ParsedLinks[];
    return linksResponse;
  };
}
