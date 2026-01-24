import { ProductType } from '../../src/app.type';

interface unscannedWebsitePageRequiredInfo {
  content: string;
  title: string;
  examples: testPage[];
}

interface testPage {
  productName: string;
  context: string;
  inStock: boolean;
  isNamedProduct: boolean;
  packagingTypeMatch: boolean;
  editionMatch: boolean;
  type: ProductType;
  mode: string;
}

export const unscannedArrayOfWebpages: unscannedWebsitePageRequiredInfo[] = [
  {
    title: 'Magic the Gathering Marvels Spider Man Play Booster Box',
    content: `"Shipments will be delayed until full warehouse returns on January 5th - Expect delays beforehand. Subscribe & Save TierZero GamesTierZero Games Search... All categories All categories Country/region United States (USD $) Login / Signup My account 0 Cart Home All products Magic the Gathering Marvels Spider Ma... Magic the Gathering Marvels Spider Man Play Booster Box Roll over image to zoom in Magic the Gathering Marvels Spider Man Play Booster Box Magic The GatheringSKU: TZG0000057279287 Card Details Price: Sale price$144.31 USD Quantity: 1 Add to cart Buy with More payment options Don't forget about these ones! Use the Previous and Next buttons to navigate through product recommendations, or scroll horizontally to view more products. Magic the Gathering Marvels Spider Man Bundle $72.81 Add MTG Spider-Man Gift Bundle Gift Edition $116.81 Add Magic the Gathering Marvels Spider Man Scene Box $56.31 Add MTG Edge of Eternities Play Booster Box $199.31 Add Add Add Magic the Gathering - Foundations Jumpstart Booster Box $137.43 Add Add Add Magic the Gathering - Aetherdrift Collector Booster Box $343.68 Add Add Add Add Description Magic the Gathering Marvels Spider Man Play Booster Box Your friendly neighbourhood Spider-Man swings into Magic: The Gathering, and not a moment too soon! Gather web-slingers from across the Spider-Verse and team up to take down the sinister foes that threaten the city. Keep your Spider-Senses primed to spot Borderless treatments that leap right off the page! Play Boosters are the best way to discover all that Magic has to offer. Construct a deck out of your favourite colour combinations, draft packs with friends, and open gorgeous Borderless cards—plus you can find a foil in every booster. A full display of Play Boosters supports a Draft event with extra left over to maximize the fun for everyone! Features: • Includes 1–4 cards of rarity Rare or higher (2: 31%; 3: 3%; 4: <1%), and 3–5 Uncommon, 6–9 Common, and 1 Land cards. • Play Boosters are the ideal booster for the play environment—especially Limited format events. • 30 units with 14 cards and a token card. Contents: • 14 x Cards Per Pack View more Payment & Security Your payment information is processed securely. We do not store credit card details nor have access to your credit card information. You may also like Magic the Gathering Marvels Spider Man Bundle Magic The Gathering Magic the Gathering Marvels Spider Man Bundle Sale price$72.81 USD Add to cart MTG Spider-Man Gift Bundle Gift Edition Magic The Gathering MTG Spider-Man Gift Bundle Gift Edition Sale price$116.81 USD Add to cart Magic the Gathering Marvels Spider Man Scene Box Magic The Gathering Magic the Gathering Marvels Spider Man Scene Box Sale price$56.31 USD Add to cart MTG Edge of Eternities Play Booster Box Magic The Gathering MTG Edge of Eternities Play Booster Box Sale price$199.31 USD Add to cart Magic the Gathering - Tarkir: Dragonstorm Play Booster Box Magic The Gathering Magic the Gathering - Tarkir: Dragonstorm Play Booster Box Sale price$159.43 USD Add to cart Magic the Gathering - Aetherdrift Play Booster Box Magic The Gathering Magic the Gathering - Aetherdrift Play Booster Box Sale price$137.43 USD Add to cart Magic The Gathering Magic the Gathering - Foundations Jumpstart Booster Box Sale price$137.43 USD Add to cart MTG Lorwyn Eclipsed Play Booster Box Pre-Order Magic The Gathering MTG Lorwyn Eclipsed Play Booster Box Pre-Order Sale price$167.68 USD Add to cart MTG Outlaws of Thunder Junction Play Booster Box Magic The Gathering MTG Outlaws of Thunder Junction Play Booster Box Sale price$199.31 USD Add to cart Magic the Gathering - Aetherdrift Collector Booster Box Magic The Gathering Magic the Gathering - Aetherdrift Collector Booster Box Sale price$343.68 USD Add to cart Recently viewed Magic the Gathering - Final Fantasy Play Booster Box Pre-Order Magic The Gathering Magic the Gathering - Final Fantasy Play Booster Box Pre-Order Sale price$206.18 USD Email when available Free Delivery Options A Wide Range Of Delivery Options To Suit Your Needs Same Day Shipping Order's shipped the same day if purchased before 1pm on a weekday. Customer Services Any Questions, Don't Hesitate To Get In Touch Buy Now - Pay Later Multiple Payment Options Available"`,
    examples: [
      {
        // 1
        productName: 'Magic the Gathering Marvels Spider Man Play Booster Box',
        context: `This product is the official Magic: The Gathering — Marvel's Spider-Man Play Booster Box, sold as a single, factory-sealed retail unit in English. The listing must explicitly include the exact phrase 'Play Booster Box' together with 'Marvel's Spider-Man' in the title or description. The product consists of 30 Marvel's Spider-Man Play Booster packs, each containing 14 Magic: The Gathering cards. The item must NOT be: single Play Booster packs, Draft Boosters, Set Boosters, Collector Boosters, Bundles, Gift Editions, cases, multi-packs, partial boxes, loose product, or any other Magic: The Gathering set or product line. Supporting details such as pack counts, card breakdowns, SKU (D45240001_Display), GTIN (195166289779), or other metadata may help confirm authenticity but are not required for a valid match. The required match is only the sealed English Magic: The Gathering — Marvel's Spider-Man Play Booster Box; any listing that omits 'Play Booster Box' or that identifies as a single pack or another booster type is invalid.`,
        inStock: true,
        isNamedProduct: true,
        packagingTypeMatch: true,
        editionMatch: true,
        type: ProductType.BOX,
        mode: 'test',
      },
      {
        // 2
        productName: `Marvel's Spider-Man - Collector Booster BOX`,
        context: `This product is the official Magic: The Gathering — Marvel's Spider-Man Collector Booster Box, sold as a single, factory-sealed retail unit in English. The listing must explicitly include the exact phrase 'Collector Booster Box' together with 'Marvel's Spider-Man' in the title or description. The product consists of 12 Marvel's Spider-Man Collector Booster packs, each containing 15 Magic: The Gathering cards. The item must NOT be: Play Booster Boxes, Draft Boosters, Set Boosters, Beyond Boosters, Starter Boosters, Gift Bundles, regular Bundles, cases, multi-packs, partial boxes, single Collector Booster packs, promotional packs, any split listings, non-English versions, or opened/loose product. Supporting details such as pack counts (12 packs of 15 cards), SKU (195166286587), or references to Universes Beyond may help confirm authenticity but are not required for a valid match. The required match is only the sealed English Magic: The Gathering — Marvel's Spider-Man Collector Booster Box; any listing that omits 'Collector Booster Box' or that identifies as a single pack or another booster type is invalid.`,
        inStock: true,
        isNamedProduct: false,
        packagingTypeMatch: false,
        editionMatch: true,
        type: ProductType.COLLECTOR_BOX,
        mode: 'test',
      },
      {
        // 3
        productName: `Edge of Eternities Play Booster Box`,
        context: `This product is the official Magic: The Gathering Edge of Eternities Play Booster Box (also called a Play Booster Display). The listing must explicitly state “Play Booster Box” or “Play Booster Display” *and* “Edge of Eternities,” and confirm it contains exactly **30 sealed English-language Play Booster packs**. Each pack includes 14 cards (6–9 Commons, 3–5 Uncommons, 1–4 Rares or Mythic Rares, and 1 Land) with **at least one Traditional Foil per pack** and a **<1 % chance of a Foil Borderless Mythic**. Acceptable identifiers: SKU MKW813290English, GTIN 195166286341, HAN D44470001_Display, category “MtG Booster Boxes (English),” manufacturer Wizards of the Coast, age rating 13+. **Exclude** anything labeled Collector, Draft, Set, Beyond, Starter, or Jumpstart boosters; Gift Bundles, Bundles, prerelease kits, cases, multi-unit bundles, partial boxes, single packs, non-English items, or opened/loose product. Pre-orders may ship from 24 July for the 1 August release if the product remains factory-sealed. These constraints ensure the listing is uniquely identifiable as the sealed English Magic: The Gathering Edge of Eternities Play Booster Box and prevent confusion with individual booster packs or any other MTG products.`,
        inStock: true,
        isNamedProduct: false,
        packagingTypeMatch: true,
        editionMatch: false,
        type: ProductType.BOX,
        mode: 'test',
      },
    ],
  },
  {
    title: 'Avatar: The Last Airbender Collector Booster Box - English',
    content: `\n\nMagic: The Gathering\n\/ MtG Booster Boxes\n\/ MtG Booster Boxes (English)\nMtG - Lorwyn Eclipsed Play Booster Box - English\nAvatar: The Last Airbender Collector Booster Box - English\nAvatar: The Last Airbender Jumpstart Booster Box - English\nAvatar: The Last Airbender Collector Booster Box - English\n\nSKU: MKW842564English\nGTIN: 195166290461\nHAN: D45820000_Display\nCategory: MtG Booster Boxes (English)\nManufacturer:\nWizards of the Coast\n\nEnglish Collector Booster Display for Magic: The Gathering – Avatar: The Last Airbender, featuring exclusive premium cards, alternate artwork, and unique collectibles.\n\nFrom Unit price\n6 339,99 € *\n349,99 €\nincl. 19% VAT , Free shipping\nAvailable immediately\nDelivery time: 2 - 3 Workdays (DE - int. shipments may differ)\n1\nYou can purchase a maximum of Units of this item.\n\nAvatar: The Last Airbender Collector Booster Box - English\nAvatar: The Last Airbender Collector Booster Box - English\n349,99 € *\nAdd to basket\n\nDescription\nHarness the power of the elements in the most premium way possible with the Collector Boosters for Avatar: The Last Airbender in Magic: The Gathering. These boosters are packed with exclusive foils, alternate-art cards, borderless versions, and other collectibles you can’t find anywhere else.\n\nEach Collector Booster gives you the chance to open ultra-rare Headliner cards and showcase treatments, letting you relive iconic moments from the series in stunning detail. Perfect for collectors and players who want to bring maximum style to their decks.\n\nDisplay Contents:\n✅ 12 Collector Boosters\n✅ 15 cards per booster\n✅ Multiple rare or higher cards in each pack\n✅ Special foil treatments and showcase prints\n✅ Exclusive Avatar cards with alternate art\n\nInformation on product safety\nManufacturer information:\nName: Wizards of the Coast\nLanguage: English\nCondition: Sealed\nMtG Edition: MtG Avatar: The Last Airbender\nItem weight: 0,36 kg\n\nQuestion about item\n--`,
    examples: [
      {
        // 4
        productName: 'The Last Airbender Collector Booster Box',
        context: `This product is the official Magic: The Gathering – Avatar: The Last Airbender Collector Booster Box, sold as a single, factory-sealed retail unit in English. The listing must clearly state both 'Avatar: The Last Airbender' and 'Collector Booster Box' together in the title or description. It must not be any other Magic: The Gathering set, product line, or booster type (e.g., Play Boosters, Draft Boosters, Set Boosters, Bundles, Gift Editions, cases, multi-packs, partial boxes, or single packs). Accessories, pack counts, or card breakdown details may appear in the listing, but they are only supporting evidence and are not required for a match. The key requirement is that the listing unambiguously matches the exact product name, set ('Avatar: The Last Airbender'), type ('Collector Booster Box'), language, and condition described above.`,
        inStock: true,
        isNamedProduct: true,
        packagingTypeMatch: true,
        editionMatch: true,
        type: ProductType.COLLECTOR_BOX,
        mode: 'test',
      },
      {
        // 5
        productName: 'Innistrad Remastered Play Booster Box',
        context: `This product is the official Magic: The Gathering – Innistrad Remastered Play Booster Box, sold as a single, factory-sealed retail unit in English. The listing must clearly state “Innistrad Remastered” and “Play Booster Box” together in the title or description. It must not be any other Magic: The Gathering set, product line, or booster type (e.g., Draft Boosters, Set Boosters, Collector Boosters, Bundles, Gift Editions, cases, multi-packs, or single packs). Accessories, pack counts, or card breakdown details are supporting evidence only and are not required for a match, but if present they can help confirm authenticity. The key requirement is that the listing unambiguously matches the exact product name, set (“Innistrad Remastered”), type (“Play Booster Box”), language (English), and condition described above.`,
        inStock: true,
        isNamedProduct: false,
        packagingTypeMatch: true,
        editionMatch: false,
        type: ProductType.BOX,
        mode: 'test',
      },
    ],
  },
  {
    title: `Magic: The Gathering - Final Fantasy Collector Booster Display`,
    content: `"\\n\\nWe value your privacy\\nWe use cookies and other technologies to personalize your experience, perform marketing, and collect analytics. Learn more in our Privacy Policy.\\n\\nManage preferences\\nAccept\\nDecline\\nSkip to content\\nJoin the Dice Dungeon Discord community for exclusive access to the latest TCG Products before anyone else!\\nThe Dice DungeonThe Dice Dungeon Full Logo\\nSearch...\\n\\nCountry/region\\nIreland (EUR €) \\nLogin / Signup\\nMy account\\n0 Cart\\n\\nTrading Card Games\\nPokemon TCG\\nMagic: The Gathering\\nONE PIECE\\nBack to Dice\\nHome\\nAll products\\nMagic: The Gathering - Final Fantasy...\\nMagic: The Gathering: Final Fantasy Collector Booster Display\\n Roll over image to zoom in\\nMagic: The Gathering: Final Fantasy Collector Booster Display\\nMagic: The Gathering: Final Fantasy Collector Booster Pack\\nMagic: The Gathering - Final Fantasy Collector Booster Display\\nPrice: \\nSale price€612,51\\nQuantity: \\n\\n1\\n\\nSold out\\n NOTIFY ME WHEN IN STOCK\\nDescription\\nEvery Magic: The Gathering—FINAL FANTASY Collector Booster serves up treasure, boasting Raresand/or Mythics, Traditional Foils, and special alternate-frame cards.\\nIn this Collector Booster Box you’ll find 12 Magic: The Gathering—FINAL FANTASY Collector Boosters, each containing 15 Magic: The Gathering cards and 1 Traditional Foil double-sided token.\\nEvery pack contains 5–6 cards of rarity Rareor higher and 3–6 Uncommon, 3–5 Common, and 1 Full-Art Land cards, with a total of 8–12 Traditional Foil cards and 0–3 cards with a special foil treatment. Serialized card in <0.1% of English-language Collector Boosters only.\\n\\nYou may also like\\nMagic The Gathering: Final Fantasy Starter Kit right view\\nMagic: The Gathering - Final Fantasy Starter Kit\\nSale price€11,78\\nAdd to cart\\nMTG Final Fantasy Commander Deck Set of 4\\nMagic: The Gathering - Final Fantasy Commmander Deck Set of 4\\nSale price€265,87\\nAdd to cart\\nMagic: The Gathering - Phyrexia All Will Be One Set Booster Box\\nMagic: The Gathering - Phyrexia All Will Be One Set Booster Box\\nSale price€170,80\\nAdd to cart\\nMagic: The Gathering - Aetherdrift Play Booster Pack\\nMagic: The Gathering - Aetherdrift Play Booster Pack\\nSale price€4,97\\nAdd to cart\\nMagic: The Gathering - Phyrexia All Will Be One Set Booster Pack\\nMagic: The Gathering - Phyrexia All Will Be One Set Booster Pack\\nSale price€7,01\\nAdd to cart\\nMagic: The Garthering - Play Booster Pack\\nMagic: The Gathering - Foundations Play Booster Pack\\nSale price€4,70\\nAdd to cart\\nMagic: The Gathering Horizons 3 Play Booster Box side left view\\nMagic: The Gathering - Modern Horizons 3 Play Booster Box\\nSale price€294,48\\nAdd to cart\\nMagic The Gtahering Horizions 3 Play Booster Pack\\nMagic: The Gathering - Modern Horizons 3 Play Booster Pack\\nSale price€9,41\\nAdd to cart\\nMagic: The Gathering - Modern Horizons 3 Commander Deck 4 Pack\\nMagic: The Gathering - Modern Horizons 3 Commander Deck 4 Pack\\nSale price€257,68\\nAdd to cart\\nMagic: The Gathering Avatar play booster pack on a white background\\nMagic: The Gathering - The Last Airbender Play Booster Pack\\nSale price€7,06\\nAdd to cart\\n\\nAbout Us\\nWe are a UK-based company that provides a wide range of dice sets for tabletop role-playing games like Dungeons & Dragons and Pathfinder. Our goal is to make these essential gaming accessories more accessible to players around the world. We offer a variety of styles and colors to suit different preferences, so you can find the perfect set for your next adventure. Plus, we ship worldwide to ensure that all you dice-rolling enthusiasts are satisfied\\n\\nQuick Links\\nTerms of service\\nRefund policy\\nShipping Policy\\nPrivacy Policy\\nDo not sell my personal information\\nNewsletter\\n\\nSign up for our newsletter and be the first to know about our latest special offers and new initiatives!\\n\\nYour email\\nSubscribe\\n\\nROQ Trading Limited. T/A The Dice Dungeon. - 57 Queens Park Drive Castleford WF103DF\\nCompany Number 12093657\\nCountry/region\\nIreland (EUR €)\\n© 2026 The Dice Dungeon\\nPowered by Shopify\\n\\nFollow Us\\n\\nFollow on \\nWe Accept"`,
    examples: [
      {
        // 6
        productName: `Final Fantasy Collector Booster Box`,
        context: `This product is the official Magic: The Gathering — Final Fantasy Collector Booster Box, sold as a single, factory-sealed retail unit in English. The listing must explicitly include the exact phrase 'Collector Booster Box' together with 'Final Fantasy' in the title or description. The product consists of 12 Final Fantasy Collector Booster packs, each containing 15 Magic: The Gathering cards and 1 traditional foil double-sided token. Each pack includes 5–6 Rare or Mythic Rare cards, 3–6 Uncommons, 3–5 Commons, and 1 Full-Art Land card, with 8–12 Traditional Foil cards and 0–3 cards with special foil treatments. Collector highlights include serialized golden Chocobo cards and artwork by Final Fantasy artists. The item must NOT be: Play Booster Boxes, Draft Boosters, Set Boosters, Beyond Boosters, Starter Boosters, Bundles, Gift Editions, cases, multi-packs, partial boxes, single Collector Booster packs, promotional packs, non-English versions, or opened/loose product. Supporting details such as the 12-pack count, SKU, or references to Universes Beyond may help confirm authenticity but are not required for a valid match. The required match is only the sealed English Magic: The Gathering — Final Fantasy Collector Booster Box; any listing that omits 'Collector Booster Box' or that identifies as a single pack or another booster type is invalid.`,
        inStock: false,
        isNamedProduct: true,
        packagingTypeMatch: true,
        editionMatch: true,
        type: ProductType.BOX,
        mode: 'test',
      },
      {
        // 7
        productName: `Final Fantasy Chocobo Bundle`,
        context: `This product is the official Magic: The Gathering — Final Fantasy Chocobo Bundle, sold as a single, factory-sealed retail unit in English. The listing must explicitly include the exact phrase 'Chocobo Bundle' together with 'Final Fantasy' in the title or description. The product must NOT be confused with the standard 'Final Fantasy Bundle' (which is a different product without chocobo-specific contents) or with any other Magic: The Gathering product such as Play Booster Boxes, Collector Booster Boxes, Draft Boosters, Set Boosters, Gift Bundles, regular Bundles, cases, multi-packs, partial boxes, single packs, or accessories sold separately. Supporting details such as pack counts, included lands, or Chocobo-themed exclusives may help confirm authenticity but are not required for a valid match. The required match is only the sealed English Magic: The Gathering — Final Fantasy Chocobo Bundle; any listing that omits 'Chocobo Bundle' or that identifies as a generic Final Fantasy Bundle or any other product type is invalid.`,
        inStock: false,
        isNamedProduct: false,
        packagingTypeMatch: false,
        editionMatch: true,
        type: ProductType.BUNDLE,
        mode: 'test',
      },
    ],
  },
  {
    title: `Magic The Gathering: Marvel's Spider-Man Collector Booster Box`,
    content: `"\\n\\nSkip to content\\nFREE SHIPPING ON ALL ORDERS OVER £50.\\nPlayTCG\\ninfo@playtcg.uk\\nen \\nGBP\\nUSD\\nEUR\\nGBP\\nCHF\\nSearch\\n\\n Shopping Cart 00 itemsSign In or Create an Account\\nHOME\\nPOKEMON\\nONE PIECE\\nMAGIC THE GATHERING\\nDISNEY LORCANA \\nSTAR WARS UNLIMITED \\nRIFTBOUND: LEAGUE OF LEGENDS \\nOther TCGs \\nACCESSORIES\\nKLARNA PAYMENTS AVAILABLE!\\n\\nHome\\nMagic The Gathering: Marvel's Spider-Man Collector Booster Box\\nMagic The Gathering: Marvel's Spider-Man Collector Booster Box\\nYour friendly neighborhood Spider-Man swings into Magic: The Gathering, and not a moment too soon! Gather web-slingers from...\\nAvailability: In Stock\\n£349.95\\nQuantity:\\nDecrease quantity for Magic The Gathering: Marvel&#39;s Spider-Man Collector Booster Box\\n1\\nIncrease quantity for Magic The Gathering: Marvel&#39;s Spider-Man Collector Booster Box\\nSubtotal: £349.95\\nAdd to cart\\nAdd to wishlist\\n Share\\nClose\\nCopy link\\nhttps://playtcg.uk/products/magic-the-gathering-marvels-spider-man-collector-booster-box\\n Copy link\\nShare\\n\\nBuy with\\nMore payment options\\nFree Shipping\\nFree shipping on orders over £50\\nSame day dispatch on orders before 2pm\\nFree Returns\\nLearn More.\\nDescription\\nYour friendly neighborhood Spider-Man swings into Magic: The Gathering, and not a moment too soon! Gather web-slingers from across the Spider-Verse and team up to take down the sinister foes that threaten the city. Keep your Spider-Senses primed to spot Borderless treatments that leap right off the page!\\nCollector Boosters gather all the coolest cards and foil treatments in one place! Each booster contains Rares and/or Mythics, Traditional Foils, a Borderless basic land, and more. Web-slinging heroes may encounter even more beautiful foils and picture-perfect lands. You could also find the headliner card - the most collectible pull of all!\\n\\nRelated Products\\nRecently Viewed Products\\nShop\\nHOME\\nPOKEMON\\nONE PIECE\\nMAGIC THE GATHERING\\nDISNEY LORCANA\\nSTAR WARS UNLIMITED\\nRIFTBOUND: LEAGUE OF LEGENDS\\nOther TCGs\\nACCESSORIES\\nInformation\\nPrivacy Policy\\nRefund Policy\\nShipping Policy\\nTerms of Service\\nCustomer Service\\nContact us\\nFAQs\\nNewsletter Sign Up\\nSign up for exclusive updates, new arrivals & insider only discounts\\n\\nenter your email address\\nSubmit\\nInstagram\\nNEOV LTD 14669008. VAT: 443 2154 24\\nPlayTCG\\nPayment methods\\nMenu\\nClose\\nSign In\\nCreate an Account\\nMy Wish List"`,
    examples: [
      {
        // 8
        productName: `Marvel's Spider-Man - Collector Booster BOX`,
        context: `This product is the official Magic: The Gathering — Marvel's Spider-Man Collector Booster Box, sold as a single, factory-sealed retail unit in English. The listing must explicitly include the exact phrase 'Collector Booster Box' together with 'Marvel's Spider-Man' in the title or description. The product consists of 12 Marvel's Spider-Man Collector Booster packs, each containing 15 Magic: The Gathering cards. The item must NOT be: Play Booster Boxes, Draft Boosters, Set Boosters, Beyond Boosters, Starter Boosters, Gift Bundles, regular Bundles, cases, multi-packs, partial boxes, single Collector Booster packs, promotional packs, any split listings, non-English versions, or opened/loose product. Supporting details such as pack counts (12 packs of 15 cards), SKU (195166286587), or references to Universes Beyond may help confirm authenticity but are not required for a valid match. The required match is only the sealed English Magic: The Gathering — Marvel's Spider-Man Collector Booster Box; any listing that omits 'Collector Booster Box' or that identifies as a single pack or another booster type is invalid.`,
        inStock: true,
        isNamedProduct: true,
        packagingTypeMatch: true,
        editionMatch: true,
        type: ProductType.BOX,
        mode: 'test',
      },
      {
        // 9
        productName: `Avatar: The Last Airbender Collector Booster Box`,
        context: `This product is the official Magic: The Gathering – Avatar: The Last Airbender Collector Booster Box, sold as a single, factory-sealed retail unit in English. The listing must clearly state both 'Avatar: The Last Airbender' and 'Collector Booster Box' together in the title or description. It must not be any other Magic: The Gathering set, product line, or booster type (e.g., Play Boosters, Draft Boosters, Set Boosters, Bundles, Gift Editions, cases, multi-packs, partial boxes, or single packs). Accessories, pack counts, or card breakdown details may appear in the listing, but they are only supporting evidence and are not required for a match. The key requirement is that the listing unambiguously matches the exact product name, set ('Avatar: The Last Airbender'), type ('Collector Booster Box'), language, and condition described above.`,
        inStock: true,
        isNamedProduct: false,
        packagingTypeMatch: true,
        editionMatch: false,
        type: ProductType.BOX,
        mode: 'test',
      },
    ],
  },
  {
    title: `Magic: The Gathering - Final Fantasy - Chocobo Bundle`,
    content: `"\\n\\nSkip to content\\nFREE SHIPPING ON ALL ORDERS OVER £50.\\nPlayTCG\\ninfo@playtcg.uk\\nen \\nGBP\\nUSD\\nEUR\\nGBP\\nCHF\\nSearch\\n\\n Shopping Cart 00 itemsSign In or Create an Account\\nHOME\\nPOKEMON\\nONE PIECE\\nMAGIC THE GATHERING\\nDISNEY LORCANA \\nSTAR WARS UNLIMITED \\nRIFTBOUND: LEAGUE OF LEGENDS \\nOther TCGs \\nACCESSORIES\\nKLARNA PAYMENTS AVAILABLE!\\n\\nHome\\nMagic: The Gathering - Final Fantasy - Chocobo Bundle\\nSold out\\nMagic: The Gathering - Final Fantasy - Chocobo Bundle\\nContents:\\n• 1 x Chocobo Booster (12 Cards Per Booster)\\n• 32 x Basic Land Cards (16 Foil & 16 Nonfoil)\\n• 10 x Play Boosters (14 Cards Per Booster)\\n• 1 x Alt Art Trad Foil Promo Card\\n• 1 x Click Wheel Life Counter\\n• 1/24 x Possible Scene Card\\n• 1 x Card Box\\nAvailability: Out Of Stock\\n£114.95\\nQuantity:\\nDecrease quantity for Magic: The Gathering - Final Fantasy - Chocobo Bundle\\n1\\nIncrease quantity for Magic: The Gathering - Final Fantasy - Chocobo Bundle\\nSubtotal: £114.95\\nSold out\\nAdd to wishlist\\n Share\\nClose\\nCopy link\\nhttps://playtcg.uk/products/magic-the-gathering-final-fantasy-chocobo-bundle\\n Copy link\\nShare\\n\\nBuy with\\nMore payment options\\nFree Shipping\\nFree shipping on orders over £50\\nSame day dispatch on orders before 2pm\\nFree Returns\\nLearn More.\\nDescription\\nContents:\\n• 1 x Chocobo Booster (12 Cards Per Booster)\\n• 32 x Basic Land Cards (16 Foil & 16 Nonfoil)\\n• 10 x Play Boosters (14 Cards Per Booster)\\n• 1 x Alt Art Trad Foil Promo Card\\n• 1 x Click Wheel Life Counter\\n• 1/24 x Possible Scene Card\\n• 1 x Card Box\\n\\nRelated Products\\nRecently Viewed Products\\nShop\\nHOME\\nPOKEMON\\nONE PIECE\\nMAGIC THE GATHERING\\nDISNEY LORCANA\\nSTAR WARS UNLIMITED\\nRIFTBOUND: LEAGUE OF LEGENDS\\nOther TCGs\\nACCESSORIES\\nInformation\\nPrivacy Policy\\nRefund Policy\\nShipping Policy\\nTerms of Service\\nCustomer Service\\nContact us\\nFAQs\\nNewsletter Sign Up\\nSign up for exclusive updates, new arrivals & insider only discounts\\n\\nenter your email address\\nSubmit\\nInstagram\\nNEOV LTD 14669008. VAT: 443 2154 24\\nPlayTCG\\nPayment methods\\nMenu\\nClose\\nSign In\\nCreate an Account\\nMy Wish List"`,
    examples: [
      {
        // 10
        productName: 'Final Fantasy Chocobo Bundle',
        context: `This product is the official Magic: The Gathering — Final Fantasy Chocobo Bundle, sold as a single, factory-sealed retail unit in English. The listing must explicitly include the exact phrase 'Chocobo Bundle' together with 'Final Fantasy' in the title or description. The product must NOT be confused with the standard 'Final Fantasy Bundle' (which is a different product without chocobo-specific contents) or with any other Magic: The Gathering product such as Play Booster Boxes, Collector Booster Boxes, Draft Boosters, Set Boosters, Gift Bundles, regular Bundles, cases, multi-packs, partial boxes, single packs, or accessories sold separately. Supporting details such as pack counts, included lands, or Chocobo-themed exclusives may help confirm authenticity but are not required for a valid match. The required match is only the sealed English Magic: The Gathering — Final Fantasy Chocobo Bundle; any listing that omits 'Chocobo Bundle' or that identifies as a generic Final Fantasy Bundle or any other product type is invalid.`,
        inStock: false,
        isNamedProduct: true,
        packagingTypeMatch: true,
        editionMatch: true,
        type: ProductType.BUNDLE,
        mode: 'test',
      },
      {
        // 11
        productName: `Marvel's Spider-Man - Collector Booster BOX`,
        context: `This product is the official Magic: The Gathering — Marvel's Spider-Man Collector Booster Box, sold as a single, factory-sealed retail unit in English. The listing must explicitly include the exact phrase 'Collector Booster Box' together with 'Marvel's Spider-Man' in the title or description. The product consists of 12 Marvel's Spider-Man Collector Booster packs, each containing 15 Magic: The Gathering cards. The item must NOT be: Play Booster Boxes, Draft Boosters, Set Boosters, Beyond Boosters, Starter Boosters, Gift Bundles, regular Bundles, cases, multi-packs, partial boxes, single Collector Booster packs, promotional packs, any split listings, non-English versions, or opened/loose product. Supporting details such as pack counts (12 packs of 15 cards), SKU (195166286587), or references to Universes Beyond may help confirm authenticity but are not required for a valid match. The required match is only the sealed English Magic: The Gathering — Marvel's Spider-Man Collector Booster Box; any listing that omits 'Collector Booster Box' or that identifies as a single pack or another booster type is invalid.`,
        inStock: false,
        isNamedProduct: false,
        packagingTypeMatch: false,
        editionMatch: false,
        type: ProductType.BOX,
        mode: 'test',
      },
    ],
  },
  {
    title: `Riftbound: League of Legends TCG - Set One: Origins Booster (24 Booster Packs)`,
    content: `"\\n\\nSkip to content\\nFacebook\\nInstagram\\nCountry/region\\n\\nUnited Kingdom | GBP £\\nPLEASE READ -> Next shipping date is Monday 5th January 2026! HAPPY NEW YEAR 🎊\\n\\nTranscendent Cards \\nLog in\\nCart\\n⭐ JOIN our Discord for Early Drops/Pre Order Info Click Here To Join!⭐\\n\\nSkip to product information\\n\\nOpen media 1 in modal\\nRiftbound: League of Legends TCG - Set One: Origins Booster (24 Booster Packs)\\nRegular price£135.74 GBP\\n Sold out\\nOut of stock\\n\\nQuantity\\nDecrease quantity for Riftbound: League of Legends TCG - Set One: Origins Booster (24 Booster Packs)\\n1\\nIncrease quantity for Riftbound: League of Legends TCG - Set One: Origins Booster (24 Booster Packs)\\n\\nSold out\\nBuy it now\\nNotify Me\\nDescription:\\nOrigins, the debut set of Riftbound: League of Legends TCG, brings Champions to the battlefield like never before. Powering up your deck with 14-card booster packs that pull from a pool of nearly 300 cards, this set features a wide variety of art from legendary League of Legends artists. Will you pull an epic game-changer, a stunning alternate art card, or a pack loaded with power?\\n\\nFeatures:\\n• Each booster contains 14 total cards: 7 Commons, 3 Uncommons, 3 Foils, and 1 Token Slot. Approx 6 Epic rarity cards appear in each box!\\n• Whether in 1v1 showdowns, or shifting alliances in larger group formats, Riftbound is built for a variety of exciting game formats!\\n• Featuring original art from some of the most celebrated artists in League of Legends history!\\n\\nContents:\\n• 24 x Packs (14 Cards Per Pack)\\n\\nCommunity Trusted - 300+ 5* Reviews.\\nStockist of Over 7+ TCG's.\\nReduced Shipping over £100.00\\nThe \"Before You Order\" Information\\nProcesssing Period\\nPre Order Information\\nCancellation Details\\nQuick Links\\nShipping Policy\\nRefund/Cancellation Policy\\nTerms of Service\\nPrivacy Policy\\nSearch\\nContact Us\\nBusiness Information\\nRegistered Business: 14199768\\n\\nVAT Registration: 418868943\\n\\nAbout Us:\\nWe are an independent online trading card game (TCG) store based in Newcastle upon Tyne in the North-East of England- We operate only a few hours per day . Founded in June 2022, our store was created out of a profound passion for collecting and a love for trading card games.\\nAt Transcendent Cards, we provide a wide selection of TCGs and accessories to meet the needs of all enthusiasts. Our mission is to deliver a quality customer experience, ensuring that each purchase is enjoyable and fulfilling. Whether you are a seasoned collector or just starting your journey into the hobby, we are here to assist you in finding exactly what you need. Thank you for supporting our small business!\\n\\nSubscribe to Our Emails:\\nEmail\\nEmail\\nFacebook\\nInstagram\\nCountry/region\\n\\nUnited Kingdom | GBP £\\nPayment methods\\n© 2026, Transcendent Cards Powered by Shopify\\nRefund policy\\nPrivacy policy\\nTerms of service\\nShipping policy\\nContact information\\nJoin Our Mailing List! Latest Products and News."`,
    examples: [
      {
        // 12
        productName: 'Riftbound Origins Booster Box',
        context: `Identify the sealed English retail product for the League of Legends TCG named Riftbound. Exact set: Origins (Set 1). The correct match is only the sealed English retail unit of the standard Origins booster box. The listing must explicitly include the exact phrase 'Origins Booster Box' together with 'Riftbound' and 'League of Legends' (or 'League of Legends TCG') in the title or description. Single packs, partial boxes, opened/loose product, mixed lots, split listings, non-English languages, and accessories are never valid. The following are INVALID even if also from Riftbound Origins: any 'Collector Booster Box' or 'Collector Booster Display'; any 'Play Booster Box'; any 'Draft Booster Box'; any 'Set Booster Box'; any 'Premium', 'Deluxe', or 'Special Edition' booster box; any booster 'Display' (display terminology is not valid for this product; the Collector Display exception does not apply here); any 'Booster Pack' or sleeved/blister pack; any 'Booster Case'; Bundles, Gift Bundles, Starter Kits, Prerelease Kits, Decks, Tins, Mega Boxes, Collector Chests, Theme or Structure Decks; promotional kits or retailer displays. Supporting metadata that MAY appear but is not required: 24 packs per box; 14 cards per pack; typical pack collation (e.g., 7 Common, 3 Uncommon, 3 Foils, 1 Token). Universes Beyond/brand references (Riot Games/League of Legends) may be present. The correct match must be a sealed English retail 'Origins Booster Box' for Riftbound: League of Legends TCG—no other booster types or formats allowed.`,
        inStock: false,
        isNamedProduct: true,
        packagingTypeMatch: true,
        editionMatch: true,
        type: ProductType.BOX,
        mode: 'test',
      },
      {
        // 13
        productName: `Marvel's Spider-Man - Collector Booster BOX`,
        context: `This product is the official Magic: The Gathering — Marvel's Spider-Man Collector Booster Box, sold as a single, factory-sealed retail unit in English. The listing must explicitly include the exact phrase 'Collector Booster Box' together with 'Marvel's Spider-Man' in the title or description. The product consists of 12 Marvel's Spider-Man Collector Booster packs, each containing 15 Magic: The Gathering cards. The item must NOT be: Play Booster Boxes, Draft Boosters, Set Boosters, Beyond Boosters, Starter Boosters, Gift Bundles, regular Bundles, cases, multi-packs, partial boxes, single Collector Booster packs, promotional packs, any split listings, non-English versions, or opened/loose product. Supporting details such as pack counts (12 packs of 15 cards), SKU (195166286587), or references to Universes Beyond may help confirm authenticity but are not required for a valid match. The required match is only the sealed English Magic: The Gathering — Marvel's Spider-Man Collector Booster Box; any listing that omits 'Collector Booster Box' or that identifies as a single pack or another booster type is invalid.`,
        inStock: false,
        isNamedProduct: false,
        packagingTypeMatch: true,
        editionMatch: false,
        type: ProductType.BOX,
        mode: 'test',
      },
    ],
  },
  {
    title: `Magic: The Gathering - Edge of Eternities Collector Booster`,
    content: `Publisher Release Date:01/08/2025 Each interstellar booster contains Rares and/or Mythics, Traditional Foils, a Borderless Celestial basic land, and more. You could find Borderless Poster Stellar Sights cards or even Sothera, the Supervoid!. Out of stock`,
    examples: [
      {
        // 14
        productName: 'Edge of Eternities Collector Booster Box',
        context: `This product is the official Magic: The Gathering Edge of Eternities Collector Booster Box, sold as a single, sealed box. The product title or description must clearly state 'Collector Booster Box' and confirm it includes exactly 12 Edge of Eternities Collector Booster packs. Each booster contains 15 Magic: The Gathering cards, including 5 or more Rare or Mythic Rare cards, Traditional Foils, and at least one Borderless or showcase treatment card. Special chase variants may include Galaxy Foils, Poster Showcase Lands, and serialized cards. This product must be in English and must not be a bundle, case, multi-pack, partial box, single pack, or any split listing. It must not be a Draft, Set, Play, or Commander Booster, Gift Bundle, or any other MTG product. This box is part of the Magic: The Gathering Edge of Eternities set, which introduces sci-fi-themed cards and mechanics such as Void and Warp, with exclusive treatments only found in Collector Boosters. These constraints ensure the listing is uniquely identifiable as the sealed MTG Edge of Eternities Collector Booster Box and prevent confusion with other formats or products.`,
        inStock: false,
        isNamedProduct: false,
        packagingTypeMatch: false,
        editionMatch: true,
        type: ProductType.BOX,
        mode: 'test',
      },
    ],
  },
  {
    title: `Magic: The Gathering: Avatar: The Last Airbender Collector Booster`,
    content: `Team Avatar is back! The action, adventure, and spirit of Avatar: The Last Airbender awaken in Magic: The Gathering. Master new mechanics: Earthbending, Airbending, Waterbending, and Firebending to tell your version of the story and discover your Magic playstyle. Bend the elements. Master the game. Discover wonders rivaling Wan Shi Tong's library with Magic: The Gathering | Avatar: The Last Airbender Collector Boosters. Each booster contains cards from across the four nations, including rares and/or mythic rares, traditional foils, and a full-art basic land. You may also find source material cards and neon ink borderless battle pose cards celebrating the show’s iconic visuals, and even hunt for a raised foil Avatar Aang illustrated by show creator Bryan Konietzko. 15 cards per pack. Out of stock. Single Booster`,
    examples: [
      {
        // 15
        productName: 'Avatar: The Last Airbender Collector Booster Box',
        context: `This product is the official Magic: The Gathering – Avatar: The Last Airbender Collector Booster Box, sold as a single, factory-sealed retail unit in English. The listing must clearly state both 'Avatar: The Last Airbender' and 'Collector Booster Box' together in the title or description. It must not be any other Magic: The Gathering set, product line, or booster type (e.g., Play Boosters, Draft Boosters, Set Boosters, Bundles, Gift Editions, cases, multi-packs, partial boxes, or single packs). Accessories, pack counts, or card breakdown details may appear in the listing, but they are only supporting evidence and are not required for a match. The key requirement is that the listing unambiguously matches the exact product name, set ('Avatar: The Last Airbender'), type ('Collector Booster Box'), language, and condition described above.`,
        inStock: false,
        isNamedProduct: false,
        packagingTypeMatch: false,
        editionMatch: true,
        type: ProductType.BOX,
        mode: 'test',
      },
    ],
  },
  {
    title: `Magic the Gathering - Innistrad Remastered - Collector Booster Box`,
    content: `MTG: Innistrad Remastered Collector's Booster Display.. Price is 249.99, InStock Status: false`,
    examples: [
      {
        // 16
        productName: 'Innistrad Remastered Play Booster Box',
        context: `This product is the official Magic: The Gathering – Innistrad Remastered Play Booster Box, sold as a single, factory-sealed retail unit in English. The listing must clearly state “Innistrad Remastered” and “Play Booster Box” together in the title or description. It must not be any other Magic: The Gathering set, product line, or booster type (e.g., Draft Boosters, Set Boosters, Collector Boosters, Bundles, Gift Editions, cases, multi-packs, or single packs). Accessories, pack counts, or card breakdown details are supporting evidence only and are not required for a match, but if present they can help confirm authenticity. The key requirement is that the listing unambiguously matches the exact product name, set (“Innistrad Remastered”), type (“Play Booster Box”), language (English), and condition described above.`,
        inStock: false,
        isNamedProduct: false,
        packagingTypeMatch: true,
        editionMatch: true,
        type: ProductType.BOX,
        mode: 'test',
      },
    ],
  },
  {
    title: `Magic: the Gathering - Innistrad Remastered Play Booster`,
    content: `Return to the plane of glorious gothic horror and dig up fan-favorite reprints from every Innistrad set ever made with Innistrad Remastered. Cackle with delight at Showcase treatments from Innistrad's past and behold all-new borderless art that's hauntingly boo-tiful. Plus, every booster arrives nostalgia-packed with a Retro frame card! Play Boosters are the best way to explore all the gothic horror world of Innistrad has to offer. Play Boosters are balanced for Limited play, perfect to open just for fun, and contain at least one foil card and one Retro frame card. Contents: Each Play Booster may contain these cards: INR 1–480 1–4 cards of rarity Rare or higher (2: 26%; 3: 3%; 4: <1%) 3–6 Uncommon cards 6–9 Common cards 1 Land card.`,
    examples: [
      {
        // 17
        productName: 'Innistrad Remastered Play Booster Box',
        context: `This product is the official Magic: The Gathering – Innistrad Remastered Play Booster Box, sold as a single, factory-sealed retail unit in English. The listing must clearly state “Innistrad Remastered” and “Play Booster Box” together in the title or description. It must not be any other Magic: The Gathering set, product line, or booster type (e.g., Draft Boosters, Set Boosters, Collector Boosters, Bundles, Gift Editions, cases, multi-packs, or single packs). Accessories, pack counts, or card breakdown details are supporting evidence only and are not required for a match, but if present they can help confirm authenticity. The key requirement is that the listing unambiguously matches the exact product name, set (“Innistrad Remastered”), type (“Play Booster Box”), language (English), and condition described above. InStock`,
        inStock: true,
        isNamedProduct: false,
        packagingTypeMatch: false,
        editionMatch: true,
        type: ProductType.BOX,
        mode: 'test',
      },
    ],
  },
];
