import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpsertProfileDto } from './dto/upsert-profile.dto.js';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) { }

  upsert(userId: string, dto: UpsertProfileDto) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  get(userId: string) {
    return this.prisma.profile.findUnique({ where: { userId } });
  }
}
