import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { AudioMode, Goal, Level } from '../../generated/prisma/enums.js';

export class UpsertProfileDto {
  @IsEnum(Level) level: Level;
  @IsEnum(Goal) goal: Goal;
  @IsInt() @Min(3) @Max(120) minutesPerDay: number;
  @IsInt() @Min(1) @Max(7) daysPerWeek: number;
  @IsEnum(AudioMode) audioMode: AudioMode;
}
