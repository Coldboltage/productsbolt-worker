import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import z from 'zod';
import { ProductType, BestSitesInterface } from '../app.type.js';
import { ProductInStockWithAnalysis } from 'src/process/entities/process.entity.js';

@Injectable()
export class OpenaiService {
  //   productInStock = async (
  //     title: string,
  //     content: string,
  //     productName: string,
  //     type: ProductType,
  //     mode: string,
  //     context: string

  //   ) => {
  //     const productInfo = z.object({
  //       inStock: z.boolean(),
  //       isMainProductPage: z.boolean(),
  //       isNamedProduct: z.boolean(),
  //       productTypeMatchStrict: z.boolean(),
  //       price: z.number(),
  //       currencyCode: z.string(),
  //       conciseReason: z.string().max(160),
  //       detectedVariant: z.string(),
  //       detectedFullName: z.string(),
  //       variantMatchStrict: z.boolean(),
  //     });

  //     const openai = new OpenAI();

  //     const openAiResponse = await openai.responses.parse({
  //       model: `gpt-4.1-${mode}`,
  //       input: [
  //         {
  //           role: "system",
  //           content:
  //             "Extract structured product-page information. " +
  //             "The primary sales-unit type (box, ETB, bundle, pack) must match, " +
  //             "and any variant conflict must be rejected."
  //         },
  //         {
  //           role: "user",
  //           content: `Target product name  : **${productName}**
  // Expected product type: **${type.toUpperCase()}**   (box · ETB · bundle · pack)

  // Return **match: true** only if every rule passes.

  // 0. **Primary sales unit**
  //    • Identify the outer-most container the customer buys (“box”, “bundle”, “pack”, “ETB”, …).
  //    • If the detected unit is "pack" while **${type}** is "box"
  //      **and** you clearly see a quantity of **10 packs or more**
  //      (e.g. “10 packs”, “12 x packs”, “(12 packs)”):
  //        → treat this as a BOX for the purpose of the check.
  //    • Otherwise, if the detected unit ≠ **${type}**
  //        → **match: false** immediately.
  //    • You do **not** need to output the detected unit; simply set
  //      \`productTypeMatchStrict\` to \`true\` if the rule passes.

  // 0 bis. **Variant-token consistency**
  //    • Extract distinctive variant tokens from the target (set name, language,
  //      character, colourway, year, size, etc.). Ignore generic words like
  //      “sealed”, “official”, “trading”, “cards”, “game”.
  //    • A listing qualifies only if  
  //        1. every variant token appears in the title or description, **and**  
  //        2. no extra distinctive variant token (absent from the target) appears,
  //           unless it is generic marketing language (“sealed”, “fast shipping”).
  //    • Any failure → **match: false**.

  // ────────────────────────────
  // Checks

  // 1. **Type confirmation** – title/description must state it is a **${type}**.
  // 2. **Capacity** – if the target name states a size (e.g. “6-Pack Bundle”,
  //    “24-Can Box”) the listing must match it.
  // 3. **Stock** – item must be available now (not sold-out / closed preorder).

  // If any rule fails → **match: false**.

  // ────────────────────────────
  // Product title : "${title}"
  // Page content  :
  // ${content}
  // Here is additional context for your reasoning (do NOT treat as part of the listing): ${context}

  //     `
  //         }
  //       ],
  //       text: { format: zodTextFormat(productInfo, "stock") }
  //     });



  //     const productResponse = openAiResponse.output_parsed;
  //     console.log(productResponse);
  //     return productResponse;
  //   };


  productInStock = async (
    title: string,
    content: string,
    productName: string,
    type: ProductType,
    mode: string, // e.g., 'mini', 'pro'
    context = ''
  ): Promise<ProductInStockWithAnalysis> => {
    const openai = new OpenAI();

    const schema = {
      name: 'product_in_stock_with_analysis',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          analysis: {
            type: 'string',
            description:
              'Use this field to reason about what the product fundamentally is, based on all available evidence. Analyze the product title, description, and any contextual information to determine what is actually being sold. This includes identifying the structural nature of the product — such as its format, scale, packaging, or presentation — and not just repeating its name.\n\nThis reasoning step should infer the real-world object the customer would receive if they clicked "Add to Cart", regardless of how it is named or marketed. Key signals might include:\n- Quantity indicators (e.g., “12 ×”, “bundle includes”, “contains”, etc.)\n- Packaging references (e.g., “starter set”, “box of”, “individual item”)\n- Functional descriptors (e.g., “preconstructed”, “sealed display”, “sampler”) \n- Variant markers (e.g., language, edition, exclusivity, series)\n\nDo not assume the product type from title or branding alone — interpret it based on described structure and intended delivery. For example, a product named “XYZ Starter Deck” should not be classified as a deck unless it is clearly described as a self-contained deck product.\n\nThis field is not used to decide availability (stock), listing status (main page), or pricing — it is strictly a semantic reasoning step to inform type, naming, and variant matching.'
          },
          inStock: {
            type: 'boolean',
            description: 'True if the item is currently in stock and available for purchase.'
          },
          isMainProductPage: {
            type: 'boolean',
            description: `True only if the page is exclusively or primarily about the single target product, without listing multiple products, variants, bundles, or related items.
    If the page shows a category, collection, or multiple different products—even if related—this must be false.`
          },
          isNamedProduct: {
            type: 'boolean',
            description: 'True if the exact product name appears in the page title or description.'
          },
          productTypeMatchStrict: {
            type: 'boolean',
            description:
              `True only if the sales unit the customer receives matches the expected product type exactly, or qualifies as a close equivalent (e.g., a box containing multiple units of the expected type). 
The product type should reflect the actual item sold to the customer, not merely its contents or components.`
          },
          price: {
            type: 'number',
            description: 'The numeric price of the product, without currency symbol.'
          },
          currencyCode: {
            type: 'string',
            description: 'The 3-letter ISO currency code (e.g., GBP, USD, EUR).'
          },
          conciseReason: {
            type: 'string',
            description: 'Short justification (≤ 160 chars) summarizing the match outcome.'
          },
          detectedVariant: {
            type: 'string',
            description: 'Short identifier for the detected product variant (e.g., Collector, English, 2025).'
          },
          detectedFullName: {
            type: 'string',
            description: 'The full product name as listed on the page.'
          },
          variantMatchStrict: {
            type: 'boolean',
            description: 'True if all variant tokens match and no conflicting variants are present.'
          }
        },
        required: [
          'analysis',
          'inStock',
          'isMainProductPage',
          'isNamedProduct',
          'productTypeMatchStrict',
          'price',
          'currencyCode',
          'conciseReason',
          'detectedVariant',
          'detectedFullName',
          'variantMatchStrict'
        ],
        additionalProperties: false
      }
    };

    const response = await openai.chat.completions.create({
      model: `gpt-4.1-${mode}`,
      messages: [
        {
          role: 'system',
          content:
            'You are a product-matching assistant. Start by analyzing the product page against the target context. Use this analysis to guide your output of structured product fields.'
        },
        {
          role: 'user',
          content: `Target product name: ${productName}
                      Expected product type: ${type.toUpperCase()}
                      Context: ${context}
                      Product Title: ${title}
                      Page Content: ${content}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: schema
      }
    });

    const json = JSON.parse(response.choices[0].message?.content || '{}');
    return json;
  };


  checkProduct = async (
    title: string,
    content: string,
    productName: string,
    type: ProductType,
    mode: string

  ) => {
    const openai = new OpenAI();

    const schema = {
      name: 'product_update',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          analysis: {
            type: 'string',
            description:
              'Using the product page, break down rational if the product is available or not and in what capacity. Usually if it says Notify when in stock or in those lines, it is not in stock'
          },
          inStock: {
            type: 'boolean',
            description: 'Using the analysis, confirm true if the item is currently in stock or preorder is available and available for purchase. If it says something like Notify when in stock, the product is not in stock'
          },
          price: {
            type: 'number',
            description: 'The numeric price of the product, without currency symbol.'
          },
        },
        required: [
          'analysis',
          'inStock',
          'price',
        ],
        additionalProperties: false
      }
    };

    const openAiResponse = await openai.chat.completions.create({
      model: `gpt-4.1-${mode}`,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'Your task is to extract structured product page information. Always verify product name match and ensure the product type (e.g., box or pack) is strictly respected.',
        },
        {
          role: 'user',
          content: `
          From the page content, find if the product is in stock and its price.
Product title: "${title}"
Page content: ${content}
`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: schema
      }
    });

    const productResponse = JSON.parse(openAiResponse.choices[0].message?.content || '{}');
    return productResponse;
  };

  crawlFromSitemap = async (
    sitemapUrls: string[],
    query: string,
    version: string,
    mainUrl: string,
  ): Promise<BestSitesInterface> => {
    const sitemapBestLinkSchema = z.object({
      bestSites: z.array(
        z.object({
          url: z.string(),
          score: z.number(),
        }),
      ),
    });

    const openai = new OpenAI();

    const openAiResponse = await openai.responses.parse({
      model: `gpt-4.1-${version}`,
      input: [
        { role: 'system', content: 'Extract product page information' },
        {
          role: 'user',
          content: `Please use the sitemap URLs and figure the best links to use for ${query}. The URLs must include ${mainUrl} within the url. URLs: ${sitemapUrls.join(', ')}`,
        },
      ],
      text: {
        format: zodTextFormat(sitemapBestLinkSchema, 'links'),
      },
    });

    if (!openAiResponse.output_parsed) throw new Error('crawlError');

    const linksResponse = openAiResponse.output_parsed as BestSitesInterface;
    console.log(linksResponse);
    return linksResponse;
  };
}
