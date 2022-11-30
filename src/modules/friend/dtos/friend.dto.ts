import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FriendDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id: string;

}

export default FriendDto;
