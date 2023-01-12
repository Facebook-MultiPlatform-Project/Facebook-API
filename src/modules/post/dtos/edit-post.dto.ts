import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class EditPostDto {

@ApiProperty({ type: String })
  @IsString()
  @IsUUID()
  postId: string;


  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  status: string;

  // Danh sách id các ảnh bị xoá (join với nhau, cách với nhau bằng dấu ',')
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  image_del: string;

  // Danh sách id các video bị xoá (join với nhau, cách với nhau bằng dấu ',')
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  video_del: string;

  // Danh sách thứ tự của các ảnh được upload lên, cách với nhau bởi dấu ','
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  image_sort: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  auto_block: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  auto_accept: string;
}
