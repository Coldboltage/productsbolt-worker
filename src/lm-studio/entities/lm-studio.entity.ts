import { ProductType } from 'src/app.type.js';
import { CreateProcessDto } from 'src/process/dto/create-process.dto.js';

export class LmStudio {}

export interface lmStudioWebDiscoveryPayload {
  title: string;
  allText: string;
  query: string;
  type: ProductType;
  mode: string;
  context: string;
  createProcessDto: CreateProcessDto;
  specificUrl: string;
  hash: string;
  count: number;
  shopifySite: boolean;
}

export interface LmStudioReduceLinksPayload {
  reducedUrls: string[];
  query: string;
  mode: string;
  url: string;
  context: string;
  shopProductId: string;
}
