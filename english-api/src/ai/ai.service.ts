import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ZodType } from 'zod';
import { UsageService } from './usage.service.js';

export type ChatMsg = { role: 'user' | 'assistant'; content: string };
export type Tier = 'fast' | 'smart';
export type AiCtx = { userId: string; feature: string };
type Opts = { tier?: Tier; maxTokens?: number };

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: OpenAI;
  private models: Record<Tier, string>;

  constructor(config: ConfigService, private usage: UsageService) {
    this.client = new OpenAI({ apiKey: config.getOrThrow<string>('OPENAI_API_KEY') });
    this.models = {
      smart: config.get<string>('OPENAI_MODEL') ?? 'gpt-4.1',
      fast: config.get<string>('OPENAI_MODEL_FAST') ?? 'gpt-4.1-mini',
    };
  }

  async text(system: string, user: string, ctx: AiCtx, opts: Opts & { jsonMode?: boolean } = {}): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.models[opts.tier ?? 'smart'],
      max_completion_tokens: opts.maxTokens ?? 300,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      ...(opts.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
    });
    await this.usage.record(ctx.userId, ctx.feature, res.usage?.prompt_tokens ?? 0, res.usage?.completion_tokens ?? 0);
    return res.choices[0]?.message?.content?.trim() ?? '';
  }

  async json<T>(
    system: string,
    user: string,
    schema: ZodType<T>,
    ctx: AiCtx,
    opts: Opts & { retries?: number } = {},
  ): Promise<T> {
    const retries = opts.retries ?? 2;
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const raw = await this.text(system, user, ctx, { tier: opts.tier, maxTokens: opts.maxTokens ?? 6000, jsonMode: true });
        const clean = raw.replace(/```json|```/g, '').trim();
        return schema.parse(JSON.parse(clean));
      } catch (e) {
        lastError = e;
        this.logger.warn(`JSON inválido (tentativa ${attempt + 1}): ${(e as Error).message}`);
      }
    }
    this.logger.error('IA não devolveu JSON válido', lastError as Error);
    throw new InternalServerErrorException('Não foi possível gerar o conteúdo. Tente novamente.');
  }

  async *stream(system: string, messages: ChatMsg[], ctx: AiCtx, opts: Opts = {}): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: this.models[opts.tier ?? 'smart'],
      max_completion_tokens: opts.maxTokens ?? 500,
      messages: [{ role: 'system', content: system }, ...messages],
      stream: true,
      stream_options: { include_usage: true }, // o último pedaço traz o consumo de tokens
    });

    let inputTokens = 0;
    let outputTokens = 0;
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens;
        outputTokens = chunk.usage.completion_tokens;
      }
    }
    await this.usage.record(ctx.userId, ctx.feature, inputTokens, outputTokens);
  }
}
