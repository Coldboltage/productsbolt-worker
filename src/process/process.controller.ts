import { ConflictException, Controller, NotFoundException } from '@nestjs/common';
import { Ctx, EventPattern, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateProcessDto } from './dto/create-process.dto.js';
import { UpdateProcessDto } from './dto/update-process.dto.js';
import { ProcessService } from './process.service.js';
import { CheckPageDto } from './dto/check-page.dto.js';
import { ShopDto } from './dto/shop.dto.js';
import { NotFoundError } from 'rxjs';


@Controller()
export class ProcessController {
  constructor(private readonly processService: ProcessService) { }

  @EventPattern('shopyifyCheck')
  async shopifySearch(@Payload() shopDto: ShopDto, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef()
    const originalMsg = context.getMessage();

    try {
      await this.processService.shopifySearch(shopDto)
      channel.ack(originalMsg);
    } catch (error) {
      console.error(error)
      channel.nack(originalMsg, false, false);

    }
  }

  @EventPattern('sitemapSearch')
  async sitemapSearch(@Payload() shopDto: ShopDto,
    @Ctx() context: RmqContext,) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const result = await this.processService.sitemapSearch(shopDto)
      if (result.length === 0) throw new NotFoundException(`No sitemap URLs found for shop ${shopDto.id}`);
      await fetch(`http://localhost:3000/shop/${shopDto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitemapUrls: result }),
      });
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
      const result = await this.processService.webpageDiscovery(createProcessDto, "nano");
      console.log(result);
      if (!result) {
        channel.ack(originalMsg);
        return false;
      }


      // ACK message on success
      channel.ack(originalMsg);
    } catch (error) {
      console.error(error);

      // Optionally nack with requeue false to avoid infinite retry loops
      channel.nack(originalMsg, false, false);
    } finally {
      await new Promise(r => setTimeout(() => r, 1000))
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
      const { query, shopWebsite } = checkPageDto;
      console.log(result);
      if (!result) {
        channel.ack(originalMsg);
        return false;
      }
      const webPage = {
        url: result.specificUrl,
        shopWebsite,
        inStock: result.inStock,
        price: result.price,
        productName: query,
        webPageId: checkPageDto.webPageId,
      };
      console.log(webPage);
      await fetch(`http://localhost:3000/webpage/${webPage.webPageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webPage),
      });
      console.log("Ending");

      // ACK message on success
      channel.ack(originalMsg);
    } catch (error) {
      console.error(error);

      // Optionally nack with requeue false
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
