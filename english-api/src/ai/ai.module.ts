import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { UsageService } from './usage.service.js';

@Global()
  @Module({
    providers: [
      AiService,
      UsageService
    ],
    exports: [
      AiService,
      UsageService
    ]
  })
export class AiModule { }
