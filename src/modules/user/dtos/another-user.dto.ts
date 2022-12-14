import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
} from 'class-validator';

/**
 * Dto người dùng khác
 * @author : Tr4nLa4m (27-11-2022)
 */
export class AnotherUserDto {

  // Id người dùng
  @ApiProperty({ type: String })
  @IsString()
  @IsUUID()
  userId: string;

}

export default AnotherUserDto;
