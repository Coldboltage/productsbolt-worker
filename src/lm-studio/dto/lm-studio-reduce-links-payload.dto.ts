import { IsArray, IsString } from 'class-validator';
import { LmStudioReduceLinksPayload } from '../entities/lm-studio.entity.js';

export class LmStudioReduceLinksPayloadDto
  implements LmStudioReduceLinksPayload
{
  @IsArray()
  @IsString({ each: true })
  reducedUrls: string[];

  @IsString()
  query: string;

  @IsString()
  mode: string;

  @IsString()
  url: string;

  @IsString()
  context: string;

  @IsString()
  shopProductId: string;
}
