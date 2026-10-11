import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

class GoogleDto { @IsString() credential: string; }
class ForgotDto { @IsEmail() email: string; }
class ResetDto { @IsString() token: string; @IsString() @MinLength(8) password: string; }

@Throttle({ default: { limit: 10, ttl: 60_000 } }) // login é alvo de força bruta: limite mais baixo
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // passthrough: true => o Nest ainda serializa o retorno, mas deixamos setar o cookie via res
  @Post('register')
  register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.register(dto, res);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res);
  }

  @Post('google') google(@Body() dto: GoogleDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.loginWithGoogle(dto.credential, res);
  }

  @Post('refresh') refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req.cookies?.rt, res);
  }

  @Post('logout') logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req.cookies?.rt, res);
  }

  @Post('forgot') forgot(@Body() dto: ForgotDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset') reset(@Body() dto: ResetDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
