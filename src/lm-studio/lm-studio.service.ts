import { Injectable, Logger } from '@nestjs/common';
import { CreateLmStudioDto } from './dto/create-lm-studio.dto';
import { UpdateLmStudioDto } from './dto/update-lm-studio.dto';
import { ParsedLinks, ProductType } from 'src/app.type';
import { CreateProcessDto } from 'src/process/dto/create-process.dto';
import { OpenaiService } from 'src/openai/openai.service';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class LmStudioService {
  private logger = new Logger(LmStudioService.name);
  constructor(
    private openaiService: OpenaiService,
    private utilsService: UtilsService,
  ) {}
  async lmStudioWebDiscovery(
    title: string,
    allText: string,
    query: string,
    type: ProductType,
    mode: string,
    context: string,
    createProcessDto: CreateProcessDto,
    specificUrl: string,
    hash: string,
    count: number,
    shopifySite: boolean,
    variantId: null | string,
    imageData: string,
    expectedPrice = 0,
    cloudflare: boolean,
  ): Promise<void> {
    let openaiAnswer: boolean;
    const answer = await this.openaiService.productInStock(
      title,
      allText,
      query,
      type,
      mode,
      context,
      imageData,
      specificUrl,
    );

    let price: number;

    if (shopifySite && cloudflare === true) {
      price = answer.price / 100;
    } else {
      price = answer.price;
    }

    const tolerance = 0.45;

    this.logger.log({ price, tolerance, expectedPrice });

    const unit = Math.abs(price - expectedPrice) / expectedPrice;
    const priceInRange = unit <= tolerance;

    this.logger.log(`princeInRange = ${priceInRange}`);

    if (
      answer?.isNamedProduct === true &&
      answer?.packagingTypeMatch === true &&
      answer?.isMainProductPage === true &&
      answer?.editionMatch === true &&
      answer?.soft404 === false &&
      answer?.loadedData === true
    ) {
      this.logger.log(answer);
      openaiAnswer = true;
    } else {
      console.error(answer);
      openaiAnswer = false;
    }

    this.logger.log(hash, count);

    if (openaiAnswer === true) {
      this.logger.log('Sending to webDiscoverySend');
      await this.utilsService.webDiscoverySend(
        {
          ...answer,
          price: shopifySite && cloudflare === true ? price : answer.price,
          specificUrl,
          pageAllText: allText,
          pageTitle: title,
          hash,
          count,
          shopifySite,
          variantId,
          priceInRange,
          editionMatch: answer.editionMatch,
          packagingTypeMatch: answer.packagingTypeMatch,
          loadedData: answer.loadedData,
          hasMixedSignals: answer.hasMixedSignals,
        },
        createProcessDto,
      );
    } else {
      this.logger.log('Sending to candidatePageDiscoverySend');
      await this.utilsService.candidatePageDiscoverySend(
        {
          ...answer,
          price: shopifySite && cloudflare === true ? price : answer.price,
          specificUrl,
          pageAllText: allText,
          pageTitle: title,
          count,
          hash,
          shopifySite,
          variantId,
          priceInRange,
          editionMatch: answer.editionMatch,
          packagingTypeMatch: answer.packagingTypeMatch,
          loadedData: answer.loadedData,
          hasMixedSignals: answer.hasMixedSignals,
        },
        createProcessDto,
      );
    }
  }

  async lmStudioReduceLinks(
    sitemapUrls: string[],
    query: string,
    version: string,
    mainUrl: string,
    context: string,
    shopProductId: string,
  ) {
    // const found = sitemapUrls.some((url) =>
    //   url.includes(
    //     `trading-card-game-spiritforged-sealed-booster-box-set-2-p88590`,
    //   ),
    // );

    // this.logger.debug(found);

    console.log(context);

    // await new Promise((r) => setTimeout(r, 2000000));

    const singleJob: ParsedLinks[] = [];
    const batchSize = 20;

    const promises: Promise<ParsedLinks[]>[] = [];

    for (let i = 0; i < sitemapUrls.length; i += batchSize) {
      const batch = sitemapUrls.slice(i, i + batchSize);

      promises.push(
        this.openaiService.crawlFromSitemap(
          batch,
          query,
          version,
          mainUrl,
          context,
          4,
        ),
      );
    }

    const results = await Promise.all(promises);
    for (const result of results) {
      singleJob.push(...result);
    }

    if (singleJob.length === 0) {
      this.logger.log('No suitable links found by LM Studio');
      throw new Error('no_site_found');
    }

    const preStrippedResult = singleJob
      .filter((site) => site.score >= 0.9)
      .sort((a, b) => b.score - a.score);

    const strippedResult = preStrippedResult.map((site) => site.url);

    this.logger.debug({
      message: 'Last test',
      preStrippedResult: preStrippedResult.length,
    });

    const result = await this.openaiService.crawlFromSitemap(
      strippedResult,
      query,
      version,
      mainUrl,
      context,
      4,
    );

    const finalStrippedResult = Array.from(
      new Set(result.map((site) => site.url)),
    );

    // await new Promise((r) => setTimeout(r, 20000000));

    if (finalStrippedResult.length === 0) {
      this.logger.log('no_links_passed_score');
      throw new Error('no_links_passed_scor');
    }

    await fetch(
      `http://${process.env.API_IP}:3000/shop-product/shop-product-links/${shopProductId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.JWT_TOKEN}`,
        },
        body: JSON.stringify({ links: finalStrippedResult }),
      },
    );
  }

  create(createLmStudioDto: CreateLmStudioDto) {
    return 'This action adds a new lmStudio';
  }

  findAll() {
    return `This action returns all lmStudio`;
  }

  findOne(id: number) {
    return `This action returns a #${id} lmStudio`;
  }

  update(id: number, updateLmStudioDto: UpdateLmStudioDto) {
    return `This action updates a #${id} lmStudio`;
  }

  remove(id: number) {
    return `This action removes a #${id} lmStudio`;
  }
}
