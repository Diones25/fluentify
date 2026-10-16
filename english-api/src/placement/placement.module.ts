import { Module } from '@nestjs/common';
import { PlacementController } from './placement.controller.js';

@Module({
  controllers: [PlacementController]
})
export class PlacementModule {}
