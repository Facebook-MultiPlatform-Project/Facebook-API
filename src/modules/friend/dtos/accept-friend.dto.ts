import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';

export class AcceptFriendDto {
  @ApiProperty({ type: String })
  @IsUUID()
  id: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isAccept: boolean;
}

export default AcceptFriendDto;
