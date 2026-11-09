import 'dotenv/config';

import { Test, TestingModule } from '@nestjs/testing';
import { OpenaiService } from './openai.service';
// import { ParsedLinks } from 'src/app.type';

describe('OpenaiService In2', () => {
  let service: OpenaiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenaiService],
    }).compile();

    service = module.get<OpenaiService>(OpenaiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('crawlFromSitemap', () => {
    it('should run with one url and pass', async () => {
      // Arrange
      const closeMtGDistractors = [
        'https://games-island.eu/MTG-Marvel-Darkhold-Destiny-Booster-Display-English',
        'https://games-island.eu/MTG-Marvel-Darkhold-Destiny-Collector-Booster-Display-English',
        'https://games-island.eu/MTG-Edge-of-Eternities-Play-Booster-Display-English',
        'https://games-island.eu/MTG-Phyrexia-All-Will-Be-One-Set-Booster-Display-English',
        'https://games-island.eu/MTG-The-Lord-of-the-Rings-Holiday-Jumpstart-Vol-2-Booster-Display-English',
        'https://games-island.eu/MTG-The-Lord-of-the-Rings-Draft-Booster-Display-English',
        'https://games-island.eu/MTG-The-Lost-Caverns-of-Ixalan-Draft-Booster-Display-English',
        'https://games-island.eu/MTG-Wilds-of-Eldraine-Draft-Booster-Display-English',
        'https://games-island.eu/MTG-Star-Trek-Collector-Booster-Display-English',
        'https://games-island.eu/MTG-Star-Trek-Play-Booster-Display-English',
        'https://games-island.eu/MTG-Reality-Fracture-Collector-Booster-Display-English',
        'https://games-island.eu/MTG-Reality-Fracture-Play-Booster-Display-English',
        'https://games-island.eu/MTG-The-Hobbit-Play-Booster-Display-English',
        'https://games-island.eu/MTG-Marvel-Super-Heroes-Jumpstart-Booster-Display-English',
        'https://games-island.eu/MTG-Marvel-Super-Heroes-Play-Booster-Display-English',
        'https://games-island.eu/MTG-Secrets-of-Strixhaven-Collector-Booster-Display-English',
        'https://games-island.eu/MTG-Secrets-of-Strixhaven-Play-Booster-Display-English',
        'https://games-island.eu/MTG-Lorwyn-Eclipsed-Play-Booster-Display-English',
        'https://games-island.eu/MTG-Avatar-The-Last-Airbender-Play-Booster-Display-English',
        'https://games-island.eu/MTG-Final-Fantasy-Play-Booster-Display-English',
        'https://games-island.eu/MTG-Tarkir-Dragonstorm-Collector-Booster-Display-English',
        'https://games-island.eu/MTG-Aetherdrift-Collector-Booster-Display-English',
        'https://games-island.eu/MTG-Foundations-Jumpstart-Booster-Display-English',
        'https://games-island.eu/MTG-Bloomburrow-Play-Booster-Display-English',
        'https://games-island.eu/MTG-Modern-Horizons-3-Play-Booster-Display-English',
        'https://games-island.eu/MTG-Outlaws-of-Thunder-Junction-Play-Booster-Display-English',
        'https://games-island.eu/MTG-Commander-Masters-Set-Booster-Display-English',
      ];

      // Act
      const result = await service.crawlFromSitemap(
        [
          'https://games-island.eu/MtG-Teenage-Mutant-Ninja-Turtles-Play-Booster-Box-English',
          'https://games-island.eu/MTG-Marvel-Darkhold-Destiny-Booster-Box-English',
          'https://games-island.eu/MTG-Edge-of-Eternities-Play-Booster-Box-English',
          'https://games-island.eu/YuGiOh-Battle-Pack-2-War-of-the-Giants-Booster-Display-Englisch',
          ...closeMtGDistractors,
        ],
        'Teenage Mutant Ninja Turtles Play Booster Box',
        '',
        'https://games-island.eu/',
        `Identify the sealed English retail product titled 'Teenage Mutant Ninja Turtles Play Booster Box'. This is the standard Play Booster retail box containing exactly 30 Play Boosters from the official Teenage Mutant Ninja Turtles crossover set by Wizards of the Coast. The listing must explicitly include the exact phrase 'Play Booster Box' together with 'Teenage Mutant Ninja Turtles' and 'Magic: The Gathering' (or 'MTG') in the title or description. The product must clearly indicate it is a sealed retail box containing 30 Play Boosters. Single booster packs, loose/opened product, partial boxes, mixed lots, split listings, non-English language versions, and accessories are never valid. The following are INVALID even if also from the same set: any 'Collector Booster Box' or 'Collector Booster Display'; any 'Collector Booster'; any 'Draft Booster Box'; any 'Set Booster Box'; any 'Bundle', 'Gift Bundle', 'Starter Kit', 'Prerelease Kit', 'Commander Deck', 'Theme Deck', or promotional kit; any 'Booster Case'; any product labeled only as 'Display' without explicitly stating 'Play Booster Box'; any opened or damaged product. Supporting metadata that MAY appear but is not required: 30 Play Boosters per box; 14 cards per booster; 1 Traditional Foil card per booster; English language; official Wizards of the Coast release; release date March 6, 2026. The correct match must be a sealed English retail 'Teenage Mutant Ninja Turtles Play Booster Box', no other booster types, formats, or configurations are allowed.`,
        2,
      ); // Assert
      expect(result[0].url).toEqual(
        'https://games-island.eu/MtG-Teenage-Mutant-Ninja-Turtles-Play-Booster-Box-English',
      );
      expect(result.length).toEqual(1);
    });
  });
});
