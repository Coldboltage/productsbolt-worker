import { Injectable } from '@nestjs/common';
import { ShopDto } from 'src/process/dto/shop.dto';

@Injectable()
export class ApiService {
  constructor() {}

  async getShop(id: string): Promise<ShopDto> {
    const shopResponse = await fetch(id, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.JWT_TOKEN}`,
      },
    });
    return shopResponse.json();
  }
}
