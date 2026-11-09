interface CrawlUrlGen {
  sitemapUrls: string[];
  query: string;
  mainUrl: string;
  context: string;
  amount: number;
}

export const openaiReduceUrlGen = ({
  sitemapUrls,
  query,
  mainUrl,
  context,
  amount,
}: CrawlUrlGen): {
  role: string;
  content: string;
} => {
  return {
    role: 'user',
    content: `
Please use the sitemap URLs and figure out the best links to use for the product: ${query}.

The URLs must include ${mainUrl} within the URL.

URL List:
${sitemapUrls.join(', ')}

Separate each link individually to compare against.

Requirements:
- Links below a 0.9 score must be completely ignored.
- Only include links with scores of 0.9 or above.
- Return the highest-scoring links first.
- Return a maximum of ${amount} links.
- Product packaging, such as pack or box, is very important.
- Each returned link must be unique.
- The same URL must not appear more than once.

Context:
To find out more about the product, here is its description.
This is provided only as context and is not part of the URL.

${context}

Ranking principles for URL selection:
- Rank URLs by how specifically they encode the exact sellable product being searched for, not just the broader product family.
- Identity-defining attributes include product line, edition/set, language, and packaging/unit-of-sale.
- URLs that explicitly encode more matching identity-defining attributes should rank above URLs that encode fewer.
- Packaging/unit-of-sale is a core identity attribute.
- A URL that explicitly reflects the correct sellable unit should rank above one that matches the same product family but leaves the unit ambiguous or less specific.
- Additional words are not noise if they increase specificity and help distinguish the exact sellable unit.
- Do not prefer a shorter or cleaner URL over a more specific URL when the more specific URL better matches the target product.
- A URL must not be treated as an exact match if it is missing a key identity-defining attribute required by the target.

Hard exclusion rules:
- Any invalid URL must receive a score below 0.90.
- Invalid URLs must never appear in the final output.
- Do not generate any object with a score below 0.90.
- Do not include placeholder results, near misses, or invalid alternatives just to fill the results.
- A URL from a different set or product family is not a valid match under any circumstances.
- Each object must be unique and must not repeat the same URL.

JSON OUTPUT:

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
  }
}
`,
  };
};

// Old Message

// CRAWL-SITEMAP-URL

//     messages: [
//       {
//         role: 'system',
//         content: `Extract product page information - Do not add \`\`\`json fences.
//         - Do not add explanations.
//         - Do not add extra text.
//         Just return valid JSON according to the schema.`,
//       },
//       {
//         role: 'user',
//         content: `Please use the sitemap URLs and figure the best links to use for the product, ${query}. The URLs must include ${mainUrl} within the url. URL List: ${sitemapUrls.join(', ')}. Seperate each link as it's own thing to compare against. Links that are below 0.9 score will be completely ignored. Therefore only include links with scores which are 0.9 or above. Highest score first. Only give ${amount} links maximum. Packing needs to be taken into consideration. Product Packaging like pack or box is very important. Each returned link must be unique, and the same URL must not appear more than once.

//         -- Context to be used to understand what we are looking for. It is not part of the URL --

//       To find out more about the product, here is it's description to help you. This is not part of the url. Context: ${context}.

//       Ranking principles for URL selection:
//       - Rank URLs by how specifically they encode the exact sellable product being searched for, not just the broader product family.
//       - Identity-defining attributes include product line, edition/set, language, and packaging/unit-of-sale.
//       - URLs that explicitly encode more matching identity-defining attributes should rank above URLs that encode fewer.
//       - Packaging/unit-of-sale is a core identity attribute. A URL that explicitly reflects the correct sellable unit should rank above one that matches the same product family but leaves the unit ambiguous or less specific.
//       - Additional words are not noise if they increase specificity and help distinguish the exact sellable unit.
//       - Do not prefer a shorter or cleaner URL over a more specific URL when the more specific URL better matches the target product.
//       - A URL must not be treated as an exact match if it is missing a key identity-defining attribute that is required by the target.

//     Hard exclusion rules:
//     - Any invalid URL must receive a score below 0.90.
//     - Invalid URLs must never appear in the final output.
//     - If URLs score lower than 0.90, do not mention them.
//     - Do not include placeholder results, near misses, or invalid alternatives just to fill the
//     - A URL from a different set or product family is not a valid match under any circumstance and must never be treated as a strong candidate just because its packaging terms are more explicit.
//     - Each Object must be unique and not repeat the same url

//       JSON OUTPUT with object

//           {
//   "type": "array",
//   "items": {
//     "type": "object",
//     "properties": {
//       "url": {
//         "type": "string"
//       },
//       "smallReason": {
//         "type": "string",
//         "description": "using the context, determine if it's the closest match"
//       },
//       "score": {
//         "type": "number",
//         "minimum": 0,
//         "maximum": 1,
//         "multipleOf": 0.01,
//         "description": "A relevance score between 0 and 1 (inclusive), rounded to two decimal places. 1 = perfect match, 0 = not relevant. Each result must have a unique score so that the list forms a strict ranking with no ties."
//       }
//     },
//     "required": ["url", "score", "smallReason"],
//     "additionalProperties": false
//   },
// }
//       `,
//       },
//     ],
