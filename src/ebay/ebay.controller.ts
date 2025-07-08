import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateEbayDto } from './dto/create-ebay.dto.js';
import { UpdateEbayDto } from './dto/update-ebay.dto.js';
import { EbayService } from './ebay.service.js';

@Controller()
export class EbayController {
  constructor(private readonly ebayService: EbayService) {}

  @MessagePattern('createEbay')
  create(@Payload() createEbayDto: CreateEbayDto) {
    return this.ebayService.create(createEbayDto);
  }

  @MessagePattern('findAllEbay')
  findAll() {
    return this.ebayService.findAll();
  }

  @MessagePattern('findOneEbay')
  findOne(@Payload() id: number) {
    return this.ebayService.findOne(id);
  }

  @MessagePattern('updateEbay')
  update(@Payload() updateEbayDto: UpdateEbayDto) {
    return this.ebayService.update(updateEbayDto.id, updateEbayDto);
  }

  @MessagePattern('removeEbay')
  remove(@Payload() id: number) {
    return this.ebayService.remove(id);
  }
}
