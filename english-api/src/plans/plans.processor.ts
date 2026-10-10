import { Processor, WorkerHost } from "@nestjs/bullmq";
import { PlansService } from "./plans.service.js";
import { Job } from "bullmq";

@Processor('plans', { concurrency: 2 })// no máx. 2 planos gerando ao mesmo tempo
export class PlansProcessor extends WorkerHost {
  constructor(private readonly plansService: PlansService) {
    super();
  }

  async process(job: Job<{ userId: string }>) {
    const plan = await this.plansService.generate(job.data.userId);
    // devolva pouco: o retorno fica salvo no Redis
    return { 
      planId: plan.id,
    }
  }
}