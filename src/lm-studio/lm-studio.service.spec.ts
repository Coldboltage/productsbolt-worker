import { Test, TestingModule } from '@nestjs/testing';
import { LmStudioService } from './lm-studio.service';

describe('LmStudioService', () => {
  let service: LmStudioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LmStudioService],
    }).compile();

    service = module.get<LmStudioService>(LmStudioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
