import {
  ConflictException,
  Controller,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { CreateProcessDto } from './dto/create-process.dto.js';
import { UpdateProcessDto } from './dto/update-process.dto.js';
import { ProcessService } from './process.service.js';
import {
  CheckPageDto,
  FullCheckPageDtoPayloadDto,
} from './dto/check-page.dto.js';
import { ShopDto } from './dto/shop.dto.js';
import { ProductDto } from './dto/product.dto.js';
import { ProductListingsCheckDto } from './dto/product-listings-check.dto.js';
import { LmStudioCheckProductDto } from './dto/lm-studio-check-product.dto.js';
import { ShopifyMetaDto } from './dto/shopify-meta.dto.js';
import { VariantDto, VariantNormalTextDto } from './dto/variant.dto.js';

@Controller()
export class ProcessController {
  private readonly logger = new Logger(ProcessController.name);
  constructor(private readonly processService: ProcessService) {}

  @EventPattern('shopifyCheck')
  async shopifySearch(@Payload() shopDto: ShopDto, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.processService.shopifySearch(shopDto);
      channel.ack(originalMsg);
    } catch (error) {
      console.error(error);
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('shopifyCollectionsTest')
  async shopifyCollectionsTest(
    @Payload() shopDto: ShopDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await new Promise((r) => setTimeout(r, 750));
      this.logger.log(`shopifyCollectionsTest called`);
      const result = await this.processService.shopifyCollectionsTest(shopDto);
      this.logger.log(result);
      // if (result.length === 0) throw new NotFoundException(`No sitemap URLs found for shop ${shopDto.id}`);
      await fetch(
        `http://${process.env.API_IP}:3000/sitemap/update-from-shopify-collection-test/${shopDto.sitemapEntity.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.JWT_TOKEN}`,
          },
          body: JSON.stringify({ collections: result }),
        },
      );
      // ACK message on success
      channel.ack(originalMsg);
    } catch (error) {
      console.error(error);

      // Optionally nack with requeue false to avoid infinite retry loops
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('shopifySitemapSearch')
  async shopifySitemapSearch(
    @Payload() shopDto: ShopDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const result = await this.processService.shopifySitemapSearch(shopDto);
      // if (result.length === 0) throw new NotFoundException(`No sitemap URLs found for shop ${shopDto.id}`);
      await fetch(
        `http://${process.env.API_IP}:3000/sitemap/check-site-map/${shopDto.sitemapEntity.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.JWT_TOKEN}`,
          },
          body: JSON.stringify({
            sitemapUrls: result.websiteUrls,
            error: result.error,
            scannedAt: new Date(),
          }),
        },
      );
      // ACK message on success
      channel.ack(originalMsg);
    } catch (error) {
      console.error(error);

      // Optionally nack with requeue false to avoid infinite retry loops
      channel.nack(originalMsg, false, false);
    }
  }

  // Whenever a sitemap can not be found, we will use crawlee
  @EventPattern('manualSitemapSearch')
  async manualSitemapSearch(
    @Payload() shopDto: ShopDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log('manualSitemapSearch');
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const result = await this.processService.manualSitemapSearch(shopDto);
      // If successful and group of links found, send back
      await fetch(
        `http://${process.env.API_IP}:3000/sitemap/check-site-map/${shopDto.sitemapEntity.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.JWT_TOKEN}`,
          },
          body: JSON.stringify({ sitemapUrls: result, scannedAt: new Date() }),
        },
      );

      channel.ack(originalMsg);
    } catch (error) {
      console.error(error);
      // Optionally nack with requeue false to avoid infinite retry loops
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('sitemapSearch')
  async sitemapSearch(@Payload() shopDto: ShopDto, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const result = await this.processService.sitemapSearch(shopDto);
      if (result.websiteUrls.length === 0) {
        throw new NotFoundException(
          `No sitemap URLs found for shop ${shopDto.id}`,
        );
      }
      this.logger.log({
        url: `http://${process.env.API_IP}:3000/sitemap/check-site-map/${shopDto.sitemapEntity.id}`,
        result: result.websiteUrls.length,
      });
      try {
        await fetch(
          `http://${process.env.API_IP}:3000/sitemap/check-site-map/${shopDto.sitemapEntity.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.JWT_TOKEN}`,
            },
            body: JSON.stringify({
              sitemapUrls: result.websiteUrls,
              fast: result.fast,
              scannedAt: new Date(),
            }),
          },
        );
      } catch (error) {
        this.logger.error(error);
      }

      // ACK message on success
      channel.ack(originalMsg);
    } catch (error) {
      console.error(error);

      // Optionally nack with requeue false to avoid infinite retry loops
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('lmStudioCheckProduct')
  async lmStudioCheckProduct(
    @Payload() createProcessDto: LmStudioCheckProductDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const {
      title,
      allText,
      query,
      type,
      mode,
      url,
      hash,
      count,
      shopifySite,
      shopWebsite,
      webPageId,
      cloudflare,
    } = createProcessDto;

    try {
      await this.processService.lmStudioCheckProduct(
        title,
        allText,
        query,
        type,
        mode,
        url,
        hash,
        count,
        shopifySite,
        shopWebsite,
        webPageId,
        cloudflare,
      );
      // ACK message on success
      channel.ack(originalMsg);
    } catch (error) {
      console.error(error);

      // Optionally nack with requeue false to avoid infinite retry loops
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('findLinks')
  async findLinks(
    @Payload() createProcessDto: CreateProcessDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.processService.findLinks(createProcessDto, 'nano');
      // ACK message on success
      channel.ack(originalMsg);
    } catch (error) {
      console.error(error);

      // Optionally nack with requeue false to avoid infinite retry loops
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('webpageDiscovery')
  async webpageDiscovery(
    @Payload() createProcessDto: CreateProcessDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.processService.webpageDiscovery(createProcessDto, 'nano');
      // ACK message on success
      channel.ack(originalMsg);
    } catch (error) {
      console.error(error);

      // Optionally nack with requeue false to avoid infinite retry loops
      channel.nack(originalMsg, false, false);
    }
  }

  // Batch jobs for headful workflows
  @EventPattern('webpageDiscoveryHeadful')
  async webpageDiscoveryHeadful(
    @Payload() createProcessDtoArrayDto: CreateProcessDto[],
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.processService.webpageDiscoveryBatch(createProcessDtoArrayDto);
      // ACK message on success
      channel.ack(originalMsg);
    } catch (error) {
      console.error(error);

      // Optionally nack with requeue false to avoid infinite retry loops
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('updatePage')
  async updatePage(
    @Payload() checkPageDto: CheckPageDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log('updatePage message captured');
      this.logger.log(`updatePage message captured`);
      const result = await this.processService.updatePage(checkPageDto);

      // ACK message on success
      this.logger.log('Acknowledging message');
      this.logger.log(result);
      channel.ack(originalMsg);
    } catch (error) {
      console.error(error);

      // Optionally nack with requeue false
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('updatePageBatch')
  async updatePageBatch(
    @Payload() fullCheckPageDtoPayloadDto: FullCheckPageDtoPayloadDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(`updatePage message captured`);
      const result = await this.processService.updatePageBatch(
        fullCheckPageDtoPayloadDto,
      );

      // ACK message on success
      this.logger.log('Acknowledging message');
      this.logger.log(result);
      channel.ack(originalMsg);
    } catch (error) {
      console.error(error);

      // Optionally nack with requeue false
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('ebayPrices')
  async ebayPrices(
    @Payload() productDto: ProductDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      // this.logger.log(productDto)
      const result = await this.processService.ebayStatCalc(productDto);
      this.logger.log(result);
      channel.ack(originalMsg);
    } catch (error) {
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('cloudflare-test')
  async cloudflareTest(
    @Payload() shopDto: ShopDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.processService.cloudflareTest(shopDto);
      channel.ack(originalMsg);
    } catch (error) {
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('product-listings-check')
  async checkShopProductListings(
    @Payload() shopDto: ProductListingsCheckDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log('Received product-listings-check event:', shopDto);

    try {
      await this.processService.checkShopProductListings(shopDto);
      channel.ack(originalMsg);
    } catch (error) {
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('shopifyMeta')
  async shopifyMeta(
    @Payload() shopifyMetPayload: ShopifyMetaDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log(`shopifyMeta with ${shopifyMetPayload.url}`);

    try {
      await this.processService.shopifyMeta(shopifyMetPayload);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(error);
      channel.nack(originalMsg, false, false);
    }
  }

  @MessagePattern('whichVariant')
  async whichVariant(
    @Payload() variantDto: VariantDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const result = await this.processService.whichVariant(variantDto);

      channel.ack(originalMsg);

      return result;
    } catch (error) {
      channel.nack(originalMsg, false, false); // drop message
      throw error; // important so RPC caller gets error
    }
  }

  @MessagePattern('whichVariantNormalText')
  async whichVariantNormalText(
    @Payload() variantDto: VariantNormalTextDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const result =
        await this.processService.whichVariantNormalText(variantDto);

      channel.ack(originalMsg);

      return result;
    } catch (error) {
      channel.nack(originalMsg, false, false); // drop message
      throw error; // important so RPC caller gets error
    }
  }

  @EventPattern('createProcess')
  create(@Payload() createProcessDto: CreateProcessDto) {
    return this.processService.create(createProcessDto);
  }

  @EventPattern('findAllProcess')
  findAll() {
    return this.processService.findAll();
  }

  @EventPattern('findOneProcess')
  findOne(@Payload() id: number) {
    return this.processService.findOne(id);
  }

  @EventPattern('updateProcess')
  update(@Payload() updateProcessDto: UpdateProcessDto) {
    return this.processService.update(updateProcessDto.id, updateProcessDto);
  }

  @EventPattern('removeProcess')
  remove(@Payload() id: number) {
    return this.processService.remove(id);
  }
}
