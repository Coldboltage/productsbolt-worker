import {
  ConflictException,
  Controller,
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
import { CheckPageDto } from './dto/check-page.dto.js';
import { ShopDto } from './dto/shop.dto.js';
import { ProductDto } from './dto/product.dto.js';
import { ProductListingsCheckDto } from './dto/product-listings-check.dto.js';
import { LmStudioCheckProductDto } from './dto/lm-studio-check-product.dto.js';

@Controller()
export class ProcessController {
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
      console.log(`shopifyCollectionsTest called`);
      const result = await this.processService.shopifyCollectionsTest(shopDto);
      console.log(result);
      // if (result.length === 0) throw new NotFoundException(`No sitemap URLs found for shop ${shopDto.id}`);
      await fetch(
        `http://${process.env.API_IP}:3000/sitemap/update-from-shopify-collection-test/${shopDto.sitemapEntity.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
    console.log('manualSitemapSearch');
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const result = await this.processService.manualSitemapSearch(shopDto);
      // If successful and group of links found, send back
      await fetch(
        `http://${process.env.API_IP}:3000/sitemap/check-site-map/${shopDto.sitemapEntity.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
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
      if (result.websiteUrls.length === 0)
        throw new NotFoundException(
          `No sitemap URLs found for shop ${shopDto.id}`,
        );
      fetch(
        `http://${process.env.API_IP}:3000/sitemap/check-site-map/${shopDto.sitemapEntity.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sitemapUrls: result.websiteUrls,
            fast: result.fast,
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

  @EventPattern('updatePage')
  async updatePage(
    @Payload() checkPageDto: CheckPageDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const result = await this.processService.updatePage(checkPageDto);
      // const { query, shopWebsite, webPageId } = checkPageDto;
      // console.log(result);
      // if (!result) {
      //   channel.ack(originalMsg);
      //   return false;
      // }
      // const webPage = {
      //   url: result.specificUrl,
      //   shopWebsite,
      //   inStock: result.inStock,
      //   price: result.price,
      //   productName: query,
      //   webPageId: webPageId,
      //   hash: result.hash,
      //   count: result.count,
      //   shopifySite: result.shopifySite
      // };
      // console.log(webPage);
      // await fetch(`http://${process.env.API_IP}:3000/webpage-cache/update-single-page-and-cache/${webPage.webPageId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(webPage),
      // });
      // console.log("Ending");

      // ACK message on success
      console.log('Acknowledging message');
      console.log(result);
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
      // console.log(productDto)
      const result = await this.processService.ebayStatCalc(productDto);
      console.log(result);
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

    console.log('Received product-listings-check event:', shopDto);

    try {
      await this.processService.checkShopProductListings(shopDto);
      channel.ack(originalMsg);
    } catch (error) {
      channel.nack(originalMsg, false, false);
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
