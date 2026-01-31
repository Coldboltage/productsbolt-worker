import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ProductType, BestSitesInterface, ParsedLinks } from '../app.type.js';
import { ProductInStockWithAnalysis } from '../process/entities/process.entity.js';
import {
  EbayProductStrip,
  EbaySoldProductStrip,
} from '../ebay/entities/ebay.entity.js';
import { ProductDto } from '../process/dto/product.dto.js';
import { ShopifyVariant } from 'src/utils/utils.type.js';

@Injectable()
export class OpenaiService {
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

    if (process.env.LOCAL_LLM === 'true')
      // openai.baseURL = `http://${process.env.LOCAL_LMM_URL}:1234/v1`;
      openai.baseURL = `http://${process.env.LOCAL_LMM_URL}:8000/v1`;

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

    // const messagesForPrompt = [];

    // if (imageUrl !== 'data:image/png;base64,') {
    //   messagesForPrompt.push({
    //     type: 'image_url',
    //     image_url: {
    //       url: imageUrl,
    //     },
    //   });
    // }

    const assuredMessage = {
      type: 'text',
      text: `

          -- Information to be used to compare versus the page --
          
          Required Target product name: ${productName}
          Required Expected product type: ${type.toUpperCase()}
          Reference Context (DO NOT USE AS EVIDENCE): ${context}

          You must follow these rules:
          1) PAGE-ONLY EXTRACTION: First extract facts using ONLY the analysed page title/content. Ignore context completely in this step.
          2) COMPARISON: After extraction, compare those extracted facts to the context to decide MATCH or NO_MATCH.
          3) If the page does not explicitly support something, write "UNKNOWN". Do NOT infer from context.

          -- Page Information (EVIDENCE) --
          Analysed Page Product Title: ${title}
          Analysed Page Product Content: ${content}
          Analysed Page URL: ${specificUrl}

          -- Notes --

          There is a difference betwen a Play Booster Box and a Collector Booster Box. These are two totally different products though they are both boxes.

          We will not be incluiding Board Games at all. Any sign of a board game is to be discounted immediately.

          Scene boxes are not play booster boxes or collector boxes. They are a different line of products. Scene box by default is always false, we don't stock them.

          A deck is not a box. A bundle is not a box. Final Fantasy TCG is different than Magic the Gatherings offerings. A Portfolio is not a binder. A tin product is a distinct product which needs to be mentioned within the context to match. Jumpstart Boosters are different than Play Boosters. There is a difference between Final Fantasy TCG Booster Boxes and Magic the Gathering Final Fantasy Player booster boxes, they are not the same.

          Unit-of-sale rule (CRITICAL):
          - Classify the product form based ONLY on what a customer receives when purchasing quantity = 1.

          CRITICAL (Product line vs unit-of-sale):

          1) Product line:
          - Collector line is TRUE if page text contains “Collector Booster” or “Collector Boosters”.
          - Play line is TRUE if page text contains “Play Booster” or “Play Boosters”.

          2) Collector Booster Box match rule:
          - Treat “Collector Booster Display / CDU / 12-count / Full box” as BOX-equivalent.
          - Do NOT require the exact phrase “Collector Booster Box” if:
            product line = Collector Booster AND unit-of-sale = BOX.

          - If the page is for another game line (e.g., “Final Fantasy Trading Card Game”, “Opus”), it is NOT the MTG Collector Booster Box unless "Magic: The Gathering" AND "Collector" are explicitly present in the page text.

          - Ignore ‘BOX CONTENTS—…’ lines unless the page also explicitly says Box/Display/Case/CDU in the sellable product name/option.

          CRITICAL: If the title and URL strongly disagree on unit-of-sale (e.g., title says Pack but URL says Box/Display/Case), treat unit-of-sale as ambiguous and mention “conflicting signals” in the reasoning.

              --- JSON Schema to follow strictly and exactly as shown ---
              {
                "type": "object",
                "properties": {
              "target": {
                "type": "string",
                "description": "TARGET IDENTITY SUMMARY (use ONLY: Required Target product name + Reference Context). Include: game line/manufacturer, set/edition, product line (Play/Collector/etc), unit (Box/Pack/etc), language if known."
              },
              "page": {
                "type": "string",
                "description": "PAGE-ONLY identity summary from the analysed title/content. Include: game line/manufacturer, set/edition, product line, unit-of-sale (PACK/BOX/BUNDLE/DECK/TIN/BINDER/UNKNOWN) and the 1-2 strongest page anchors."
              },
              "compare": {
                "type": "string",
                "description": "Output exactly MATCH or NO_MATCH, then 1–2 sentences. If NO_MATCH, cite the single strongest conflicting marker (e.g., wrong game line, wrong product line, wrong unit-of-sale). If the page shows contradictory identity signals (two or more different product forms/variants implied by title/URL/content), do NOT auto-match; mark NO_MATCH and require human review."
              },

              "analysis": {
                "type": "string",
                "description": "PAGE-ONLY reasoning: what is being sold at qty=1, using title/content evidence. If ambiguous/boilerplate, state UNKNOWN and why."
              },
                  "justifications": {
                 "packagingTypeMatchExplain": {
                    "type": "string",
                    "description": "Determine packaging type based on what the customer receives when purchasing quantity=1.\n\nHard rules (override):\n- If the page explicitly uses the product term 'Deck' (e.g., 'Deck', 'Commander Deck', 'Starter Deck', 'Preconstructed Deck') as the unit-of-sale name, classify as DECK. This must override any pack-count heuristic (even if it includes a sample pack or accessories). A deck/deck box is never BOX.\n- If the page explicitly uses the product term 'Tin' (e.g., 'Tin', 'Collector Tin', 'Mini Tin') as the unit-of-sale name, classify as TIN. This must override any pack-count heuristic (even if it contains multiple packs).\n- If the page explicitly uses the product term 'Binder' (e.g., 'Binder', 'Card Binder', 'Portfolio', 'Album') as the unit-of-sale name, classify as BINDER. This must override any pack-count heuristic (even if it includes promos or packs).\n- If the page explicitly uses the product term 'Bundle' (e.g., 'Bundle', 'Gift Bundle', 'Fat Pack') as the unit-of-sale name, classify as BUNDLE. This must override any pack-count heuristic (even if it contains 8/10/12+ packs).\n\nOtherwise:\n- PACK: A single booster/pack (qty=1 is one pack).\n- BOX: A factory-sealed booster box/display where qty=1 is a box containing multiple booster packs. 'Collector box' counts as BOX. BOX does not mean a generic sealed cardboard box of cards.\n\nIgnore conditional bulk deals like 'if you buy 36 packs you receive a sealed box/case' — that does not change the unit-of-sale packaging type.\n\nPack-count heuristic (fallback only): Only if there is no explicit PACK/BOX/BUNDLE/TIN/BINDER/DECK label.\n\nComparison step: After determining the page packaging type, compare it to the target packaging implied by the Required Target product name and Reference Context; set packagingTypeMatch to true only if they match, otherwise false."
                  }
                  "editionMatchReasoning": {
                    "type": "string",
                      "description": "1 sentence. State the normalized set tokens found on page vs target (e.g., target=marvel spiderman, page=marvel spiderman) and conclude true/false. Do NOT mention packaging/product-line."

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
                    "description": "True only if the page’s PRIMARY product is the same logical product as the target. Use the provided target context (brand/product line, set/edition, language/region, and any identity-defining variant terms like Collector/Limited/Deluxe/Promo/Bundle/Case/Single-pack) to infer identity even when the listing is sloppy. HARD RULE: if the page contains clear markers that the product belongs to a different brand/manufacturer/franchise/game/product line than the target context, isNamedProduct MUST be false, even if some keywords overlap. Also treat identity-defining variants as different products: do not mark true if the page appears to be a different variant (e.g. standard vs collector, box vs case, single pack vs box, different language) unless there is strong supporting evidence on-page that it matches the target variant."
                  },
                  "packagingTypeMatch": { "type": "boolean", "description": "If packaging type matches. BOOSTER = PACK, BOX ≠ PACK, BOX ≠ BUNDLE, BOX ≠ CASE, BOX ≠ DISPLAY unless your BOX definition explicitly includes DISPLAY, Display should always be treated the same as a box in all circumstances. A box and collector box are both boxes. They are considered the same thing in terms of packaging. Therefore if the product being looked for is a collector box and the found product is also a box, they are considered the same packaging type. A bundle is not a box. A product including a card box is for holding individual cards, not he prdoduct, thus should not be put into consideration. If the name and description don't reflect the product, refer to the price. Named Scene boxes and game set are automatically false, we do not want to stock them, classify as Scene box and game set specifically."
                  },
                  "price": { "type": "number" },
                  "currencyCode": { "type": "string" },
                  "detectedVariant": { "type": "string" },
                  "detectedFullName": { "type": "string" },
                  "editionMatch": {
                    "type": "boolean",
                      "description": "SET/EDITION ONLY. True iff the page’s PRIMARY product contains the same normalized set name as the target. NORMALIZE by ignoring apostrophes (’ vs '), hyphens, punctuation, casing, and extra whitespace (e.g., \"Marvel’s Spider-Man\" == \"Marvel Spider-Man\"). HARD RULE: Do NOT use packaging/unit-of-sale words (box/pack/bundle/display/deck/tin/binder/case) and do NOT use product-line words (Play/Collector/Draft/Set/Jumpstart/Prerelease/Kit) to decide. If game/manufacturer differs (e.g., MTG vs FFTCG/Pokemon/One Piece), editionMatch MUST be false."

                  },
                  "conciseReason": { "type": "string", "description": Explain what is true and false, why you've given them the designation as concise as possible. },
  
                },
                  "required": [
                  "target",
                  "page",
                  "compare",
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
                  "justifications".
                ],
                "additionalProperties": false
              }`,
    };

    // console.log(assuredMessage);
    // writeFileSync('./output.txt', assuredMessage.text, 'utf8');

    // await new Promise((r) => setTimeout(r, 2000000));

    // messagesForPrompt.push(assuredMessage);
    const response = await openai.chat.completions.create({
      // model: `gpt-4.1-${mode}`,
      // model: process.env.LOCAL_LLM === "true" ? "openai/gpt-oss-20b" : `gpt-4.1-${mode}`,
      model:
        // process.env.LOCAL_LLM === 'true'
        //   ? 'qwen/qwen3-4b-2507'
        //   : `gpt-4.1-mini`,
        // process.env.LOCAL_LLM === 'true'
        //   ? 'Qwen/Qwen3-4B-Instruct-2507'
        //   : `gpt-4.1-mini`,
        process.env.LOCAL_LLM === 'true'
          ? process.env.LOCAL_MODEL_NAME
          : `gpt-4.1-mini`,
      // model: `gpt-5-nano`,
      // reasoning_effort: "low",
      // temperature: 0,
      temperature: 0,
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
          content: assuredMessage.text,
        },
      ],

      // response_format: {
      //   type: 'json_schema',
      //   json_schema: schema
      // }
    });

    const json = JSON.parse(response.choices[0].message?.content || '{}');
    console.log(json);
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
      // openai.baseURL = `http://${process.env.LOCAL_LMM_URL}:1234/v1`;
      openai.baseURL = `http://${process.env.LOCAL_LMM_URL}:8000/v1`;

    // if (process.env.LOCAL_LLM === "true") openai.baseURL = "http://192.168.1.204:1234/v1"

    // 'analysis',
    // 'inStock',
    // 'price',

    // NEW VERSION TESTING
    const openAiResponse = await openai.chat.completions.create({
      model:
        // process.env.LOCAL_LLM === 'true'
        //   ? 'qwen/qwen3-4b-2507'
        //   : `gpt-4.1-${mode}`,
        // process.env.LOCAL_LLM === 'true'
        //   ? 'Qwen/Qwen3-4B-Instruct-2507'
        //   : `gpt-4.1-mini`,
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
          content: `
Return only valid JSON. 
No markdown, no explanations, no extra text.

Rules:
- If the page has "Out of Stock", "Sold Out", "Currently Unavailable",
  "Request notification", or "Notify me when available" → OUT OF STOCK.
- Preorders are only classified as IN STOCK if the text of the page contains explicit checkout phrases such as ‘Add to cart’, ‘Add to basket’, ‘Buy now’, ‘Pre-order now’, or ‘Reserve now’, which confirm the product can be actively ordered; if the text merely mentions ‘pre-order’ without including one of these checkout phrases, or if it instead shows wording like ‘Request notification’, ‘Notify me when available’, ‘Out of stock’, or similar, then the product must be treated as OUT OF STOCK.
- If unclear, default to OUT OF STOCK. Price should be with vat and if two prices are right beside each other, it'll usually be the higher of the two
- The price and delievery method are not to be considered at all. 
- Add To Wishlist must be ignored
- If a page is found with something like "Loading..", it is impossible to confirm status as parts of the page haven't loaded correctly, thus default to OUT OF STOCK.

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

    //       temperature: 0,
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
    // console.log({ sitemapUrls, query, version, mainUrl, context });

    const openai = new OpenAI({
      timeout: 3600000,
      // maxRetries: 2,
    });

    if (process.env.LOCAL_LLM === 'true')
      // openai.baseURL = `http://${process.env.LOCAL_LMM_URL}:1234/v1`;
      openai.baseURL = `http://${process.env.LOCAL_LMM_URL}:8000/v1`;

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
            content: `Please use the sitemap URLs and figure the best links to use for the product, ${query}. The URLs must include ${mainUrl} within the url. URL List: ${sitemapUrls.join(', ')}. Seperate each link as it's own thing to compare against. Links that are below 0.9 score will not be included. Therefore only include links with scores which are 0.9 or above. Highest score first. Only give 4 links maximum. Packing needs to be taken into consideration. Product Packaging like pack or box is very important

            -- Context to be used to understand what we are looking for. It is not part of the URL --
          
          To find out more about the product, here is it's description to help you. This is not part of the url. Context: ${context}.
          
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
    console.log(linksResponse);

    return linksResponse;
  };

  whichVariant = async (
    query: string,
    context: string,
    variants: ShopifyVariant[],
    type: ProductType,
  ): Promise<{ index: number; justification: string }> => {
    // console.log({ sitemapUrls, query, version, mainUrl, context });

    const openai = new OpenAI({
      timeout: 3600000,
      // maxRetries: 2,
    });

    if (process.env.LOCAL_LLM === 'true')
      // openai.baseURL = `http://${process.env.LOCAL_LMM_URL}:1234/v1`;
      openai.baseURL = `http://${process.env.LOCAL_LMM_URL}:8000/v1`;

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
      console.log('Error with openai', error);
    }

    // if (!openAiResponse.output_parsed) throw new Error('crawlError');

    // const linksResponse = openAiResponse.output_parsed as BestSitesInterface;

    if (!openAiResponse.choices[0].message?.content)
      throw new Error('crawlError');

    const linksResponse = JSON.parse(
      openAiResponse.choices[0].message?.content,
    ) as { index: number; justification: string };
    console.log(linksResponse);

    return linksResponse;
  };
}
