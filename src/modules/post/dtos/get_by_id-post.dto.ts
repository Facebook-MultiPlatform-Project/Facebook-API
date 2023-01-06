import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class GetPostByIdDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsUUID()
  postId: string;
}
