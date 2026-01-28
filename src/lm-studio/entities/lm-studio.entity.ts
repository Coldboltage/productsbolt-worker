import { ProductType } from 'src/app.type.js';
import { CandidatePageCacheDto } from 'src/process/dto/candidate-page-cache.dto';
import { CreateProcessDto } from 'src/process/dto/create-process.dto.js';

export class LmStudio {}

export interface LmStudioWebDiscoveryPayload {
  title: string;
  allText: string;
  query: string;
  type: ProductType;
  mode: string;
  context: string;
  createProcessDto: CreateProcessDto;
  specificUrl: string;
  hash: string;
  countIteration: number;
  shopifySite: boolean;
  candidatePage: CandidatePageCacheDto;
  variantId: null | string;
  imageData: string;
  expectedPrice: number;
}

export interface LmStudioReduceLinksPayload {
  reducedUrls: string[];
  query: string;
  mode: string;
  url: string;
  context: string;
  shopProductId: string;
}
