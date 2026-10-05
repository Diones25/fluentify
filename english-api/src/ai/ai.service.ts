import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ZodError, ZodType, prettifyError } from 'zod';

export type ChatMsg = { role: 'user' | 'assistant'; content: string };

type MsgParam = OpenAI.Chat.Completions.ChatCompletionMessageParam;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: OpenAI;
  private model: string;

  constructor(config: ConfigService) {
    this.client = new OpenAI({apiKey: config.get('OPENAI_API_KEY')});
    this.model = config.get<string>('OPENAI_MODEL') ?? 'gpt-4.1';
  }

  /** Resposta de texto simples (ex.: dica curta de pronúncia). */
  async text(system: string, user: string, maxTokens = 300): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      max_completion_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    });
    return res.choices[0].message?.content?.trim() ?? '';
  }

  /** Chamada em JSON mode. Devolve o texto limpo e se a resposta foi cortada. */
  private async askJson(system: string, messages: MsgParam[], maxTokens: number): Promise<{ raw: string; truncated: boolean }> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      max_completion_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, ...messages],
      response_format: { type: 'json_object' as const },
    });

    const choice = res.choices[0];
    // Por garantia, removemos cercas ```json caso apareçam.
    const raw = (choice?.message?.content ?? '').replace(/```json|```/g, '').trim();
    return { raw, truncated: choice?.finish_reason === 'length' };
  }

  /**
   * Pede JSON à IA, valida com Zod e reenvia o erro de validação para ela corrigir.
   * Sem esse feedback o modelo repete a mesma resposta inválida até o fim das tentativas.
   */
  async json<T>(system: string, user: string, schema: ZodType<T>, maxTokens = 6000, retries = 2): Promise<T>{
    const messages: MsgParam[] = [{ role: 'user', content: user }];
    let lastProblem = 'resposta inválida';

    for (let attempt = 0; attempt <= retries; attempt++) {
      let raw = '';

      try {
        const res = await this.askJson(system, messages, maxTokens);
        raw = res.raw;
        if (res.truncated) {
          throw new Error(`Resposta cortada pelo limite de ${maxTokens} tokens. Gere conteúdo mais curto.`);
        }
        return schema.parse(JSON.parse(raw));
      } catch (e) {
        lastProblem = e instanceof ZodError ? prettifyError(e) : (e as Error).message;
        this.logger.warn(
          `JSON inválido (tentativa ${attempt + 1}/${retries + 1}): ${lastProblem.split('\n').slice(0, 4).join(' | ')}`,
        );

        // Self-correction: mostramos o que ela mandou e exatamente o que precisa consertar.
        if (raw) messages.push({ role: 'assistant', content: raw });
        messages.push({
          role: 'user',
          content: `Seu JSON anterior não passou na validação:\n${lastProblem}\n\nCorrija esses problemas e responda novamente com o JSON completo e válido, sem texto em volta.`,
        });
      }
    }

    this.logger.error(`IA não devolveu JSON válido após ${retries + 1} tentativas: ${lastProblem}`);
    throw new InternalServerErrorException('Não foi possível gerar o conteúdo. Tente novamente.');
  }

  /** Streaming: devolve pedaços de texto conforme a IA escreve. */
  async *stream(system: string, messages: ChatMsg[], maxTokens = 500): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      max_completion_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, ...messages],
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
