import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsOptional() @IsUUID() conversationId?: string;
  @IsString() @MinLength(1) @MaxLength(500) message: string;
  @IsOptional() @IsString() @MaxLength(200) topic?: string;
}
