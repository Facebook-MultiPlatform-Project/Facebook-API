import { string } from '@hapi/joi';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
    // Id bài đăng
  @ApiProperty({ type: string })
  @IsUUID()
  postId: string;

  // nội dung comment
  @ApiProperty({ type: string })
  @IsString()
  content: string;

  // Id comment được trả lời
  @ApiProperty({ type: string })
  @IsOptional()
  @IsUUID()
  commentAnsweredId: string;
}

export default CreateCommentDto;
