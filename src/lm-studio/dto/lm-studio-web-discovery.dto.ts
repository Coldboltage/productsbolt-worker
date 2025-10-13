import {
  IsString,
  IsEnum,
  IsObject,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ProductType } from 'src/app.type';
import { CreateProcessDto } from 'src/process/dto/create-process.dto';
import { lmStudioWebDiscoveryPayload } from '../entities/lm-studio.entity';

export class LmStudioWebDiscoveryDto implements lmStudioWebDiscoveryPayload {
  @IsString()
  title: string;

  @IsString()
  allText: string;

  @IsString()
  query: string;

  @IsEnum(ProductType)
  type: ProductType;

  @IsString()
  mode: string;

  @IsString()
  context: string;

  @IsObject()
  createProcessDto: CreateProcessDto;

  @IsString()
  specificUrl: string;

  @IsString()
  hash: string;

  @IsNumber()
  count: number;

  @IsBoolean()
  shopifySite: boolean;
}
