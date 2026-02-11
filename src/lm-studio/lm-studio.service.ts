import { Injectable } from '@nestjs/common';
import { CreateLmStudioDto } from './dto/create-lm-studio.dto';
import { UpdateLmStudioDto } from './dto/update-lm-studio.dto';
import { ProductType } from 'src/app.type';
import { CreateProcessDto } from 'src/process/dto/create-process.dto';
import { OpenaiService } from 'src/openai/openai.service';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class LmStudioService {
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

    const price = answer.price;
    const tolerance = 0.45;

    console.log({ price, tolerance, expectedPrice });

    const unit = Math.abs(price - expectedPrice) / expectedPrice;
    const priceInRange = unit <= tolerance;

    console.log(`princeInRange = ${priceInRange}`);

    if (
      answer?.isNamedProduct === true &&
      answer?.packagingTypeMatch === true &&
      answer?.isMainProductPage === true &&
      answer?.editionMatch === true
    ) {
      console.log(answer);
      openaiAnswer = true;
    } else {
      console.error(answer);
      openaiAnswer = false;
    }

    console.log(hash, count);

    if (openaiAnswer === true) {
      console.log('Sending to webDiscoverySend');
      await this.utilsService.webDiscoverySend(
        {
          ...answer,
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
      console.log('Sending to candidatePageDiscoverySend');
      await this.utilsService.candidatePageDiscoverySend(
        {
          ...answer,
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
    const result = await this.openaiService.crawlFromSitemap(
      sitemapUrls,
      query,
      version,
      mainUrl,
      context,
    );

    if (result.length === 0) {
      console.log('No suitable links found by LM Studio');
      throw new Error('no_site_found');
    }

    const preStrippedResult = result
      .filter((site) => site.score >= 0.9)
      .sort((a, b) => b.score - a.score);

    const strippedResult = preStrippedResult.map((site) => site.url);

    if (strippedResult.length === 0) {
      console.log('no_links_passed_score');
      throw new Error('no_links_passed_scor');
    }

    await fetch(
      `http://${process.env.API_IP}:3000/shop-product/shop-product-links/${shopProductId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links: strippedResult }),
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
