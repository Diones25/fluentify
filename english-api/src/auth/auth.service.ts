import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const DAY = 24 * 60 * 60 * 1000;
const REFRESH_DAYS = 30;

@Injectable()
export class AuthService {
  private google: OAuth2Client;
  private isProd: boolean;
  private cookiePath: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService
  ) {
    this.google = new OAuth2Client(configService.get('GOOGLE_CLIENT_ID'));
    this.isProd = configService.get('NODE_ENV') === 'production';
    this.cookiePath = configService.get('COOKIE_PATH') ?? '/auth';
  }
  
  async register(dto: RegisterDto, res: Response) {
    const exists = await this.prismaService.user.findUnique({
      where: {
        email: dto.email
      }
    });

    if (exists) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prismaService.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash
      }
    });
    return this.issue(user, res);
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email
      }
    });

    if (!user?.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }
    return this.issue(user, res);
  }

  /** Cria access token + refresh token (cookie). */
  private async issue(user: { id: string; email: string; name: string }, res: Response) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email
    }, { expiresIn: '15m' });

    const raw = randomBytes(48).toString('hex');
    await this.prismaService.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(raw),
        expiresAt: new Date(Date.now() + REFRESH_DAYS * DAY)
      },
    });

    res.cookie('rt', raw, {
      httpOnly: true, // JavaScript do navegador não lê
      secure: this.isProd, // só HTTPS em produção
      sameSite: 'lax',
      path: this.cookiePath, // em dev com proxy: /api/auth; direto na API: /auth
      maxAge: REFRESH_DAYS * DAY,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    };
  }

  async refresh(raw: string | undefined, res: Response) {
    if (!raw) {
      throw new UnauthorizedException();
    }

    const row = await this.prismaService.refreshToken.findUnique({
      where: {
        tokenHash: sha256(raw)
      },
      include: {
        user: true
      }
    });

    if (!row) {
      throw new UnauthorizedException();
    }

    if (row.revokedAt) {
      // Token já usado sendo reapresentado = possível roubo. Derruba todas as sessões.
      await this.prismaService.refreshToken.updateMany({
        where: {
          userId: row.userId,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });
      throw new UnauthorizedException();
    }

    if (row.expiresAt < new Date()) {
      throw new UnauthorizedException();
    }

    await this.prismaService.refreshToken.update({
      where: {
        id: row.id
      },
      data: { revokedAt: new Date() }
    }); // rotação

    return this.issue(row.user, res);
  }

  async logout(raw: string | undefined, res: Response) {
    if (raw) {
      await this.prismaService.refreshToken.updateMany({
        where: {
          tokenHash: sha256(raw),
          revokedAt: null
        },
        data: { revokedAt: new Date() }
      });
    }
    res.clearCookie('rt', { path: this.cookiePath });
    return { ok: true };
  }

  // ---------- Login com Google ----------
  async loginWithGoogle(credential: string, res: Response) {
    const ticket = await this.google.verifyIdToken({
      idToken: credential,
      audience: this.configService.get('GOOGLE_CLIENT_ID')
    });

    const p = ticket.getPayload();

    if (!p?.email || !p.email_verified) {
      throw new UnauthorizedException('Conta Google inválida');
    }

    let user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ googleId: p.sub }, { email: p.email }]
      }
    });

    if (!user) {
      user = await this.prismaService.user.create({ data: { email: p.email, name: p.name ?? p.email, googleId: p.sub } });
    }
    else if (!user.googleId) {
      user = await this.prismaService.user.update({ where: { id: user.id }, data: { googleId: p.sub } });
    }
    return this.issue(user, res);
  }

  // ---------- Recuperar senha ----------
  async forgotPassword(email: string) {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    
    if (user) {
      const raw = randomBytes(32).toString('hex');
      await this.prismaService.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: sha256(raw),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000)
        },
      });

      const link = `${this.configService.get('FRONTEND_URL')}/reset?token=${raw}`;
      await this.mailService.send(user.email, 'Redefinir sua senha', `<p>Clique para redefinir (vale 30 min):</p><p><a href="${link}">${link}</a></p>`);
    }

    return { ok: true }; // SEMPRE a mesma resposta: não revele se o e-mail existe
  }

  async resetPassword(token: string, password: string) {
    const row = await this.prismaService.passwordReset.findUnique({
      where: {
        tokenHash: sha256(token)
      }
    });
    
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Link inválido ou expirado');
    }

    await this.prismaService.$transaction([
      this.prismaService.user.update({ where: { id: row.userId }, data: { passwordHash: await bcrypt.hash(password, 10) } }),
      this.prismaService.passwordReset.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
      this.prismaService.refreshToken.updateMany({ where: { userId: row.userId, revokedAt: null }, data: { revokedAt: new Date() } }), // desloga tudo
    ]);
    return { ok: true };
  }
}
