import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ProfileService } from './profile.service.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { UpsertProfileDto } from './dto/upsert-profile.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private profile: ProfileService) { }

  @Get()
  get(@CurrentUser() u: { id: string }) {
    return this.profile.get(u.id);
  }

  @Put()
  put(@CurrentUser() u: { id: string }, @Body() dto: UpsertProfileDto) {
    return this.profile.upsert(u.id, dto);
  }
}