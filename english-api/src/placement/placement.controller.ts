import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Type } from 'class-transformer';
import { IsArray, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { LEVEL_ORDER, QUESTIONS, levelFromCorrect } from './questions.js';

class AnswerDto {
  @IsInt() id: number;
  @IsInt() @Min(0) @Max(3) choice: number;
}

class SubmitDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => AnswerDto) answers: AnswerDto[];
}

@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('placement')
export class PlacementController {
  
  @Get('questions')
  questions() {
    return QUESTIONS.map(({ id, q, options }) => ({ id, q, options })); // sem "answer"!
  }

  @Post('submit')
  submit(@Body() dto: SubmitDto) {
    const correct = dto.answers.filter((a) => QUESTIONS.find((q) => q.id === a.id)?.answer === a.choice).length;
    return {
      correct,
      total: QUESTIONS.length,
      level: levelFromCorrect(correct)
    };
  }
}
