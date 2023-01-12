import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class PostDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsUUID()
  postId: string;
}
