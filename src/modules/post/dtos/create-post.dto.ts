import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @ApiPropertyOptional({ type: String })
  @IsString()
  content: string;

  @ApiProperty({ type: String })
  @IsString()
  status: string;
}
