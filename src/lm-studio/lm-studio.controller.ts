import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { LmStudioService } from './lm-studio.service.js';
import { CreateLmStudioDto } from './dto/create-lm-studio.dto.js';
import { UpdateLmStudioDto } from './dto/update-lm-studio.dto.js';
import { LmStudioReduceLinksPayloadDto } from './dto/lm-studio-reduce-links-payload.dto.js';
import { LmStudioWebDiscoveryDto } from './dto/lm-studio-web-discovery.dto.js';

@Controller()
export class LmStudioController {
  constructor(private readonly lmStudioService: LmStudioService) {}

  @MessagePattern('lmStudioWebDiscovery')
  async lmStudioWebDiscovery(
    @Payload() lmStudioWebDiscoveryPayloadDto: LmStudioWebDiscoveryDto,
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
      context: lmContext,
      createProcessDto,
      specificUrl,
      hash,
      countIteration,
      shopifySite,
      variantId,
    } = lmStudioWebDiscoveryPayloadDto;

    console.log(`count is: ${countIteration}`);

    try {
      await this.lmStudioService.lmStudioWebDiscovery(
        title,
        allText,
        query,
        type,
        mode,
        lmContext,
        createProcessDto,
        specificUrl,
        hash,
        countIteration,
        shopifySite,
        variantId,
      );
      channel.ack(originalMsg);
    } catch (error) {
      channel.ack(originalMsg, false, false);
    }
  }

  @MessagePattern('lmStudioReduceLinks')
  async lmStudioReduceLinks(
    @Payload() lmStudioReduceLinksPayloadDto: LmStudioReduceLinksPayloadDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    const {
      reducedUrls,
      query,
      mode,
      url,
      context: lmContext,
      shopProductId,
    } = lmStudioReduceLinksPayloadDto;

    try {
      await this.lmStudioService.lmStudioReduceLinks(
        reducedUrls,
        query,
        mode,
        url,
        lmContext,
        shopProductId,
      );
      channel.ack(originalMsg);
    } catch (error) {
      channel.ack(originalMsg, false, false);
    }
  }

  @MessagePattern('createLmStudio')
  create(@Payload() createLmStudioDto: CreateLmStudioDto) {
    return this.lmStudioService.create(createLmStudioDto);
  }

  @MessagePattern('findAllLmStudio')
  findAll() {
    return this.lmStudioService.findAll();
  }

  @MessagePattern('findOneLmStudio')
  findOne(@Payload() id: number) {
    return this.lmStudioService.findOne(id);
  }

  @MessagePattern('updateLmStudio')
  update(@Payload() updateLmStudioDto: UpdateLmStudioDto) {
    return this.lmStudioService.update(updateLmStudioDto.id, updateLmStudioDto);
  }

  @MessagePattern('removeLmStudio')
  remove(@Payload() id: number) {
    return this.lmStudioService.remove(id);
  }
}
