import { Body, Controller, Post } from '@nestjs/common';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ExecuteService } from './execute.service.js';

class ExecuteDto {
  @IsString()
  code: string;

  @IsNumber()
  languageId: number;

  @IsOptional()
  @IsString()
  stdin?: string;
}

@Controller('execute')
export class ExecuteController {
  constructor(private readonly executeService: ExecuteService) {}

  @Post()
  run(@Body() dto: ExecuteDto) {
    return this.executeService.run(dto.code, dto.languageId, dto.stdin);
  }
}
