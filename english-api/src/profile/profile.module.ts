import { Module } from '@nestjs/common';
import { LevelService } from './level.service.js';
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, LevelService],
  exports: [LevelService]
})
export class ProfileModule {}
