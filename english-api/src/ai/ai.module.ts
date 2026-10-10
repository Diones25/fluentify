import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { UsageService } from './usage.service.js';
import { CostAlertService } from './cost-alert.service.js';

@Global()
  @Module({
    providers: [
      AiService,
      UsageService,
      CostAlertService
    ],
    exports: [
      AiService,
      UsageService
    ]
  })
export class AiModule { }
