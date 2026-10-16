import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class EvaluateDto {
  @IsOptional() @IsUUID() lessonId?: string;
  @IsString() @MaxLength(300) expected: string;
  @IsString() @MaxLength(300) transcript: string;
  @IsOptional() @IsString() @MaxLength(300) translation?: string;
}
