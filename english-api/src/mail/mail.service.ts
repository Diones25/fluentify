import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null;
  private from: string;
  private isProd: boolean;

  constructor(config: ConfigService) {
    const key = config.get<string>('RESEND_API_KEY');
    this.resend = key ? new Resend(key) : null;
    this.from = config.get('MAIL_FROM') ?? 'English Talk <onboarding@resend.dev>';
    this.isProd = config.get('NODE_ENV') === 'production';
  }

  async send(to: string, subject: string, html: string) {
    if (!this.resend) {
      this.logger.warn(`(sem RESEND_API_KEY) e-mail para ${to}: ${subject}`);
      this.logPreview(html);
      return; // em desenvolvimento, só loga
    }
    const { error } = await this.resend.emails.send({ from: this.from, to, subject, html });
    if (error) {
      this.logger.error(`Falha ao enviar e-mail: ${error.message}`);
      // Não bloqueia o fluxo: em dev, imprime o conteúdo para copiar o link de recuperação.
      this.logPreview(html);
    }
  }

  /** Em desenvolvimento, imprime o HTML (inclui o link de recuperação) no console. */
  private logPreview(html: string) {
    if (!this.isProd) this.logger.log(`Conteúdo do e-mail (dev): ${html}`);
  }
}
