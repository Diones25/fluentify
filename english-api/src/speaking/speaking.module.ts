import { Module } from '@nestjs/common';
import { SpeakingController } from './speaking.controller.js';
import { SpeakingService } from './speaking.service.js';

@Module({
  controllers: [SpeakingController],
  providers: [SpeakingService]
})
export class SpeakingModule {}
