import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  status: string;
}
