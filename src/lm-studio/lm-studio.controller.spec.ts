import { Test, TestingModule } from '@nestjs/testing';
import { LmStudioController } from './lm-studio.controller';
import { LmStudioService } from './lm-studio.service';

describe('LmStudioController', () => {
  let controller: LmStudioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LmStudioController],
      providers: [LmStudioService],
    }).compile();

    controller = module.get<LmStudioController>(LmStudioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
