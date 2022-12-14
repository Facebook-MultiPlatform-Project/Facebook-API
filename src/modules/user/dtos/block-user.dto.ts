import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
} from 'class-validator';
import { BlockType } from '../enum/block-type.enum';
import AnotherUserDto from './another-user.dto';

/**
 * Dto set block/unblock người dùng 
 * @author : Tr4nLa4m (27-11-2022)
 */
export class BlockUserDto extends AnotherUserDto {

  // Kiểu block/unblock
  @ApiProperty({ enum: [BlockType.BLOCK, BlockType.UNBLOCK]})
  @IsEnum(BlockType)
  type : BlockType;

}

export default BlockUserDto;
