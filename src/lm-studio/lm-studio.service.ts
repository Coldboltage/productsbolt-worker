import { Injectable } from '@nestjs/common';
import { CreateLmStudioDto } from './dto/create-lm-studio.dto.js';
import { UpdateLmStudioDto } from './dto/update-lm-studio.dto.js';
import { ProductType } from 'src/app.type.js';
import { CreateProcessDto } from 'src/process/dto/create-process.dto.js';
import { OpenaiService } from 'src/openai/openai.service.js';
import { UtilsService } from 'src/utils/utils.service.js';

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
  ): Promise<void> {
    let openaiAnswer: boolean;
    const answer = await this.openaiService.productInStock(
      title,
      allText,
      query,
      type,
      mode,
      context,
    );

    if (
      answer?.isNamedProduct === true &&
      answer?.productTypeMatchStrict === true &&
      answer?.isMainProductPage === true &&
      answer?.variantMatchStrict === true
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

    if (result.length === 0) throw new Error('no_site_found');

    const preStrippedResult = result
      .filter((site) => site.score >= 0.9)
      .sort((a, b) => b.score - a.score);
    console.log(preStrippedResult);
    const strippedResult = preStrippedResult.map((site) => site.url);

    await fetch(
      `http://localhost:3000/shop-product/shop-product-links/${shopProductId}`,
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
